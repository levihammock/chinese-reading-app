import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { cedictDictionary } from '@/data/cedict-dictionary';

// Fallback story generator for when API is unavailable
const generateFallbackStory = (skillLevel: string, subject: string) => {
  // Example fallback: "我 爱 中国" (I love China)
  return [
    { chinese: "我", pinyin: "wǒ", english: "I" },
    { chinese: "爱", pinyin: "ài", english: "love" },
    { chinese: "中国", pinyin: "zhōngguó", english: "China" }
  ];
};

// Helper function to extract JSON from text that might contain extra content
const extractJSONFromText = (text: string) => {
  try {
    // First, try to parse the entire text as JSON
    return JSON.parse(text);
  } catch (error) {
    // If that fails, try to find JSON within the text
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('Failed to parse extracted JSON:', parseError);
        return null;
      }
    }
    return null;
  }
};

// Helper function to get allowed words for a specific HSK level
const getAllowedWords = (skillLevel: string): string[] => {
  // Map skill levels to HSK numbers
  const hskLevelMap: Record<string, number> = {
    'HSK1': 1,
    'HSK2': 2,
    'HSK3': 3,
    'HSK4': 4,
    'HSK5': 5,
    'HSK6': 6
  };
  
  const targetHskLevel = hskLevelMap[skillLevel];
  
  if (!targetHskLevel) {
    // If no HSK level mapping, return all words (fallback)
    return cedictDictionary.slice(0, 500).map(entry => entry.chinese);
  }
  
  // Filter dictionary to include words from the target level AND all lower levels
  const filteredWords = cedictDictionary
    .filter(entry => entry.hskLevel && entry.hskLevel <= targetHskLevel)
    .map(entry => entry.chinese)
    .slice(0, 500);
  
  // If we don't have enough HSK words, add some common words without HSK level
  if (filteredWords.length < 100) {
    const commonWords = cedictDictionary
      .filter(entry => !entry.hskLevel)
      .map(entry => entry.chinese)
      .slice(0, 500 - filteredWords.length);
    
    return [...filteredWords, ...commonWords];
  }
  
  return filteredWords;
};

export async function POST(request: NextRequest) {
  try {
    // Check if API key is available
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { skillLevel, subject } = body;

    // Validate input
    if (!skillLevel || !subject) {
      return NextResponse.json(
        { error: 'Missing skillLevel or subject' },
        { status: 400 }
      );
    }

    console.log('Generating story for:', { skillLevel, subject });

    // Get allowed words for this skill level
    const allowedWords = getAllowedWords(skillLevel);
    console.log(`Using ${allowedWords.length} allowed words for ${skillLevel}`);

    // Try to set SSL configuration
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    // Initialize Anthropic client with custom configuration
    const anthropic = new Anthropic({
      apiKey: apiKey,
      // Add custom headers and configuration
      defaultHeaders: {
        'User-Agent': 'Chinese-Reading-App/1.0',
      },
    });

    // Determine vocabulary limits and story length based on HSK level
    const hskConfig = {
      HSK1: { vocabLimit: 3, charLimit: '50-100' },
      HSK2: { vocabLimit: 5, charLimit: '80-150' },
      HSK3: { vocabLimit: 8, charLimit: '120-200' },
      HSK4: { vocabLimit: 12, charLimit: '200-350' },
      HSK5: { vocabLimit: 15, charLimit: '300-450' },
      HSK6: { vocabLimit: 20, charLimit: '400-600' }
    };

    const config = hskConfig[skillLevel as keyof typeof hskConfig] || hskConfig.HSK1;

    // Create a sample of allowed words for the prompt (limit to first 50 to keep prompt manageable)
    const sampleWords = allowedWords.slice(0, 50).join(', ');
    const remainingCount = allowedWords.length - 50;

    const prompt = `You are a Chinese language teacher creating reading materials for English-speaking students preparing for the ${skillLevel} exam.

TASK: Create a short story in Chinese about "${subject}" suitable for ${skillLevel} level Chinese learners.

CRITICAL VOCABULARY RESTRICTION:
You MUST ONLY use words from the following list. This list includes vocabulary from ${skillLevel} AND all lower HSK levels (HSK1-${skillLevel.replace('HSK', '')}). Do not use any Chinese words that are not in this list:
${sampleWords}${remainingCount > 0 ? `\n(and ${remainingCount} more words from HSK1-${skillLevel.replace('HSK', '')} vocabulary)` : ''}

REQUIREMENTS:
- The story MUST be about "${subject}" specifically
- Use ONLY vocabulary from the provided word list above (HSK1-${skillLevel.replace('HSK', '')} levels)
- Include approximately ${config.vocabLimit} new vocabulary words appropriate for ${skillLevel}
- Keep the story between ${config.charLimit} Chinese characters
- Make it engaging and educational
- Use grammar patterns appropriate for ${skillLevel} level
- Ensure the story is culturally appropriate and family-friendly
- Focus on practical, everyday vocabulary that students would encounter in ${skillLevel} contexts

IMPORTANT: Each object in the array should represent a single word or a common word pair/phrase (e.g., '中国', '朋友', '喜欢'), NOT a full sentence or clause. Do not group entire sentences together. Segment the story as finely as possible while keeping common word pairs together.

CRITICAL: You must respond with ONLY a valid JSON array. Do not include any text before or after the JSON.

OUTPUT FORMAT (respond with ONLY this JSON structure):
[
  { "chinese": "我", "pinyin": "wǒ", "english": "I" },
  { "chinese": "爱", "pinyin": "ài", "english": "love" },
  { "chinese": "中国", "pinyin": "zhōngguó", "english": "China" }
]

NOT THIS (do NOT group sentences):
[
  { "chinese": "我爱中国。", "pinyin": "wǒ ài zhōngguó.", "english": "I love China." }
]

IMPORTANT RULES:
- The story must be specifically about "${subject}"
- Use ONLY vocabulary from the provided word list (HSK1-${skillLevel.replace('HSK', '')} levels)
- Do not include any explanations, markdown, or additional text
- Do not use backticks or code blocks
- Ensure the JSON is properly formatted as an array of objects, with double quotes
- Do not include any trailing commas`;

    console.log('Sending request to Claude...');

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      console.log('Received response from Claude');

      const content = message.content[0];
      
      if (content.type === 'text') {
        console.log('Raw response length:', content.text.length);
        console.log('Raw response preview:', content.text.substring(0, 200) + '...');
        
        // Try to extract and parse JSON from the response
        let storyData = extractJSONFromText(content.text);
        // Fallback post-processing: if the AI returned sentence-level objects, split them into word-level objects
        if (Array.isArray(storyData) && storyData.length > 0 && typeof storyData[0].chinese === 'string' && storyData[0].chinese.length > 2) {
          // If any object is a full sentence, split it into words (naive split by character, or you could use a segmentation lib)
          const newArray = [];
          for (const obj of storyData) {
            // If the object is a sentence, split it
            if (obj.chinese.length > 2 && obj.chinese.indexOf(' ') === -1) {
              // Naive: split by character, align pinyin and english if possible
              const pinyinArr = obj.pinyin.split(' ');
              const englishArr = obj.english.split(' ');
              for (let i = 0; i < obj.chinese.length; i++) {
                newArray.push({
                  chinese: obj.chinese[i],
                  pinyin: pinyinArr[i] || '',
                  english: englishArr[i] || ''
                });
              }
            } else {
              newArray.push(obj);
            }
          }
          storyData = newArray;
        }
        
        if (Array.isArray(storyData) && storyData.length > 0 && storyData[0].chinese && storyData[0].pinyin && storyData[0].english) {
          console.log('Successfully generated aligned story array');
          return NextResponse.json({
            story: storyData,
            isAIGenerated: true
          });
        } else {
          console.error('Invalid response structure or missing fields:', storyData);
          // Log the problematic response for debugging
          console.error('Problematic response:', content.text);
          return NextResponse.json(
            { 
              error: 'Invalid story format received from AI',
              details: 'The AI response did not contain the required aligned array of objects.'
            },
            { status: 500 }
          );
        }
      } else {
        console.error('Unexpected content type:', content.type);
        return NextResponse.json(
          { error: 'Unexpected response format from AI' },
          { status: 500 }
        );
      }
    } catch (apiError) {
      console.error('Anthropic API error:', apiError);
      
      // Fallback to predefined stories
      console.log('Using fallback story due to API error');
      const fallbackStory = generateFallbackStory(skillLevel, subject);
      return NextResponse.json({
        story: fallbackStory,
        isAIGenerated: false,
        note: 'Generated using fallback due to API error'
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 