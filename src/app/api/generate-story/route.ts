import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Fallback story generator for when API is unavailable
const generateFallbackStory = (skillLevel: string, subject: string) => {
  const stories = {
    easy: {
      chinese: "小猫喜欢玩球。它每天都很开心。",
      pinyin: "Xiǎo māo xǐhuān wán qiú. Tā měi tiān dōu hěn kāixīn.",
      english: "The little cat likes to play with a ball. It is very happy every day."
    },
    medium: {
      chinese: "小明和他的朋友一起去公园。他们看到了很多美丽的花。天气很好，大家都很高兴。",
      pinyin: "Xiǎo Míng hé tā de péngyou yīqǐ qù gōngyuán. Tāmen kàn dào le hěn duō měilì de huā. Tiānqì hěn hǎo, dàjiā dōu hěn gāoxìng.",
      english: "Xiao Ming and his friend went to the park together. They saw many beautiful flowers. The weather was nice, and everyone was happy."
    },
    hard: {
      chinese: "昨天下午，我和家人去了博物馆。那里有很多有趣的历史文物。我们学到了很多关于古代中国的知识。参观结束后，我们在附近的餐厅吃了晚饭。",
      pinyin: "Zuótiān xiàwǔ, wǒ hé jiārén qù le bówùguǎn. Nàlǐ yǒu hěn duō yǒuqù de lìshǐ wénwù. Wǒmen xué dào le hěn duō guānyú gǔdài Zhōngguó de zhīshi. Cānguān jiéshù hòu, wǒmen zài fùjìn de cāntīng chī le wǎnfàn.",
      english: "Yesterday afternoon, my family and I went to the museum. There were many interesting historical artifacts there. We learned a lot about ancient China. After the visit, we had dinner at a nearby restaurant."
    }
  };
  
  return stories[skillLevel as keyof typeof stories] || stories.easy;
};

// Helper function to extract JSON from text that might contain extra content
const extractJSONFromText = (text: string) => {
  try {
    // First, try to parse the entire text as JSON
    return JSON.parse(text);
  } catch (error) {
    // If that fails, try to find JSON within the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
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

    // Determine vocabulary limits based on skill level
    const vocabLimits = {
      easy: 3,
      medium: 5,
      hard: 8
    };

    const vocabLimit = vocabLimits[skillLevel as keyof typeof vocabLimits] || 5;

    const prompt = `You are a Chinese language teacher creating reading materials for English-speaking students.

TASK: Create a short story in Chinese about "${subject}" suitable for ${skillLevel} level Chinese learners.

REQUIREMENTS:
- The story MUST be about "${subject}" specifically
- Include only ${vocabLimit} new vocabulary words
- Keep the story between 100-300 Chinese characters
- Make it engaging and educational
- Use appropriate grammar for ${skillLevel} level
- Ensure the story is culturally appropriate and family-friendly

CRITICAL: You must respond with ONLY a valid JSON object. Do not include any text before or after the JSON.

OUTPUT FORMAT (respond with ONLY this JSON structure):
{
  "chinese": "Simplified Chinese text here",
  "pinyin": "Pinyin with tone marks here", 
  "english": "English translation here"
}

IMPORTANT RULES:
- The story must be specifically about "${subject}"
- Do not include any explanations, markdown, or additional text
- Do not use backticks or code blocks
- Ensure all three versions tell the same story
- Make sure the JSON is properly formatted with double quotes
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
        const storyData = extractJSONFromText(content.text);
        
        if (storyData && storyData.chinese && storyData.pinyin && storyData.english) {
          console.log('Successfully generated story');
          console.log('Story validation:', {
            chineseLength: storyData.chinese.length,
            pinyinLength: storyData.pinyin.length,
            englishLength: storyData.english.length,
            hasChinese: !!storyData.chinese,
            hasPinyin: !!storyData.pinyin,
            hasEnglish: !!storyData.english
          });
          
          return NextResponse.json({
            ...storyData,
            isAIGenerated: true
          });
        } else {
          console.error('Invalid response structure or missing fields:', {
            hasData: !!storyData,
            hasChinese: storyData?.chinese,
            hasPinyin: storyData?.pinyin,
            hasEnglish: storyData?.english,
            dataKeys: storyData ? Object.keys(storyData) : 'null'
          });
          
          // Log the problematic response for debugging
          console.error('Problematic response:', content.text);
          
          return NextResponse.json(
            { 
              error: 'Invalid story format received from AI',
              details: 'The AI response did not contain the required chinese, pinyin, and english fields'
            },
            { status: 500 }
          );
        }
      } else {
        console.error('Unexpected content type:', content.type);
        return NextResponse.json(
          { error: 'Unexpected response format from AI service' },
          { status: 500 }
        );
      }
    } catch (apiError) {
      console.error('API Error:', apiError);
      
      // If it's a connection/SSL error, provide a fallback
      if (apiError instanceof Error && 
          (apiError.message.includes('Connection error') || 
           apiError.message.includes('fetch failed') ||
           apiError.message.includes('UNABLE_TO_GET_ISSUER_CERT_LOCALLY') ||
           apiError.message.includes('certificate') ||
           apiError.message.includes('SSL'))) {
        
        console.log('Using fallback story due to connection issues');
        const fallbackStory = generateFallbackStory(skillLevel, subject);
        
        return NextResponse.json({
          ...fallbackStory,
          isAIGenerated: false,
          note: `⚠️ Connection issue: This is a sample story about a cat/park/museum. Your requested topic "${subject}" could not be processed due to network connectivity issues. Please check your internet connection and try again.`
        });
      }
      
      throw apiError; // Re-throw other errors
    }
  } catch (error) {
    console.error('Error generating story:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
      } else if (error.message.includes('429')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        );
      } else if (error.message.includes('Connection error') || error.message.includes('fetch failed')) {
        return NextResponse.json(
          { error: 'Network connection error. Please check your internet connection and try again.' },
          { status: 500 }
        );
      } else if (error.message.includes('UNABLE_TO_GET_ISSUER_CERT_LOCALLY') || error.message.includes('certificate')) {
        return NextResponse.json(
          { error: 'SSL certificate issue. Please try again or contact support.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to generate story. Please try again.' },
      { status: 500 }
    );
  }
} 