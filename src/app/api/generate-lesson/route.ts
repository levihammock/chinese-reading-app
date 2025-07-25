import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import cedictDictionaryData from '@/data/cedict-dictionary-merged.json';

// Type the dictionary data
interface DictionaryEntry {
  chinese: string;
  pinyin: string;
  english: string;
  hskLevel?: number;
}

const cedictDictionary = cedictDictionaryData as DictionaryEntry[];

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

    console.log('Generating complete lesson for:', { skillLevel, subject });

    // Get allowed words for this skill level
    const allowedWords = getAllowedWords(skillLevel);
    console.log(`Using ${allowedWords.length} allowed words for ${skillLevel}`);

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: apiKey,
      defaultHeaders: {
        'User-Agent': 'Chinese-Reading-App/1.0',
      },
    });

    // Determine vocabulary limits and story length based on HSK level
    const hskConfig = {
      HSK1: { vocabLimit: 10, charLimit: '50-100', grammarComplexity: 'basic' },
      HSK2: { vocabLimit: 10, charLimit: '80-150', grammarComplexity: 'basic' },
      HSK3: { vocabLimit: 10, charLimit: '120-200', grammarComplexity: 'intermediate' },
      HSK4: { vocabLimit: 10, charLimit: '200-350', grammarComplexity: 'intermediate' },
      HSK5: { vocabLimit: 10, charLimit: '300-450', grammarComplexity: 'advanced' },
      HSK6: { vocabLimit: 10, charLimit: '400-600', grammarComplexity: 'advanced' }
    };

    const config = hskConfig[skillLevel as keyof typeof hskConfig] || hskConfig.HSK1;

    // Create a sample of allowed words for the prompt (limit to first 50 to keep prompt manageable)
    const sampleWords = allowedWords.slice(0, 50).join(', ');
    const remainingCount = allowedWords.length - 50;

    const prompt = `You are a Chinese language teacher creating comprehensive lesson materials for English-speaking students preparing for the ${skillLevel} exam.

TASK: Create a complete lesson about "${subject}" suitable for ${skillLevel} level Chinese learners.

CRITICAL VOCABULARY RESTRICTION:
You MUST ONLY use words from the following list. This list includes vocabulary from ${skillLevel} AND all lower HSK levels (HSK1-${skillLevel.replace('HSK', '')}). Do not use any Chinese words that are not in this list:
${sampleWords}${remainingCount > 0 ? `\n(and ${remainingCount} more words from HSK1-${skillLevel.replace('HSK', '')} vocabulary)` : ''}

REQUIREMENTS FOR ALL SECTIONS:
- The topic MUST be "${subject}" specifically
- Use ONLY vocabulary from the provided word list above (HSK1-${skillLevel.replace('HSK', '')} levels)
- Make content engaging and educational
- Use grammar patterns appropriate for ${skillLevel} level
- Ensure content is culturally appropriate and family-friendly

OUTPUT FORMAT (respond with ONLY this JSON structure):
{
  "vocabulary": [
    {
      "chinese": "我",
      "pinyin": "wǒ", 
      "english": "I"
    }
  ],
  "grammar": {
    "name": "Basic Subject-Verb-Object",
    "description": "Subject + Verb + Object",
    "explanation": "This pattern is used to express basic actions where someone does something to an object.",
    "examples": [
      {
        "chinese": "我喜欢猫",
        "pinyin": "Wǒ xǐhuān māo",
        "english": "I like cats"
      }
    ]
  },
  "grammarQuiz": [
    {
      "chinese": "他学习中文",
      "pinyin": "Tā xuéxí zhōngwén",
      "english": "He studies Chinese"
    }
  ],
  "story": {
    "aligned": [
      {
        "chinese": "我",
        "pinyin": "wǒ",
        "english": "I"
      }
    ],
    "sentence": "I love China."
  }
}

SPECIFIC REQUIREMENTS:

1. VOCABULARY (10 words):
- Include approximately ${config.vocabLimit} vocabulary words appropriate for ${skillLevel}
- At least 4 words should be directly related to "${subject}"
- The remaining words should be useful, common vocabulary for ${skillLevel} level
- Each word should include chinese, pinyin, and english

2. GRAMMAR CONCEPT:
- Choose a grammar pattern appropriate for ${skillLevel} level (${config.grammarComplexity} complexity)
- Create 5 example sentences that are relevant to "${subject}"
- Each example should include chinese, pinyin, and english
- Examples should demonstrate the grammar pattern clearly
- Include a brief explanation (1-2 sentences) in simple, conversational language explaining what this grammar pattern means and when to use it

3. GRAMMAR QUIZ QUESTIONS:
- Create 5 DIFFERENT example sentences that use the SAME grammar pattern as above
- These should be separate from the grammar examples (different sentences)
- Each quiz question should include chinese, pinyin, and english
- All sentences should be relevant to "${subject}" and appropriate for ${skillLevel} level

4. READING STORY:
- Create a short story between ${config.charLimit} Chinese characters
- The story MUST be about "${subject}" specifically
- Use vocabulary from the provided word list
- Include approximately ${config.vocabLimit} vocabulary words
- Each object in the aligned array should represent a single word or common word pair
- The sentence should be a natural, fluent English translation

IMPORTANT RULES:
- Use ONLY vocabulary from the provided word list (HSK1-${skillLevel.replace('HSK', '')} levels)
- Do not include any explanations, markdown, or additional text
- Do not use backticks or code blocks
- Ensure the JSON is properly formatted as an object with the three fields above
- Do not include any trailing commas
- Make sure all content is specifically about "${subject}"`;

    console.log('Sending request to Claude...');

    const maxRetries = 3;
    let attempt = 0;
    let lastError = null;
    while (attempt < maxRetries) {
      try {
        const message = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        const content = message.content[0];
        if (content.type === 'text') {
          const lessonData = extractJSONFromText(content.text);
          if (lessonData && lessonData.vocabulary && lessonData.grammar && lessonData.grammarQuiz && lessonData.story) {
            // Validate the structure
            if (Array.isArray(lessonData.vocabulary) && 
                lessonData.grammar.examples && 
                Array.isArray(lessonData.grammar.examples) &&
                lessonData.grammarQuiz &&
                Array.isArray(lessonData.grammarQuiz) &&
                lessonData.story.aligned && 
                Array.isArray(lessonData.story.aligned) &&
                lessonData.story.sentence) {
              
              return NextResponse.json({
                vocabulary: lessonData.vocabulary,
                grammar: lessonData.grammar,
                grammarQuiz: lessonData.grammarQuiz,
                story: lessonData.story,
                isAIGenerated: true
              });
            } else {
              lastError = 'AI response missing required arrays or fields.';
            }
          } else {
            lastError = 'AI response missing vocabulary, grammar, grammarQuiz, or story sections.';
          }
        } else {
          lastError = 'Unexpected content type from AI.';
        }
      } catch (apiError: unknown) {
        if (
          typeof apiError === 'object' &&
          apiError !== null &&
          'message' in apiError &&
          typeof (apiError as Record<string, unknown>).message === 'string'
        ) {
          lastError = (apiError as Record<string, unknown>).message as string;
        } else {
          lastError = 'Anthropic API error';
        }
      }
      attempt++;
    }
    
    // If we reach here, all attempts failed
    return NextResponse.json(
      {
        error: 'Failed to generate properly formatted lesson',
        details: lastError || 'AI did not return a valid lesson structure.'
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 