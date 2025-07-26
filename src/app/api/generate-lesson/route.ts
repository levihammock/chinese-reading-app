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

// Helper function to get target HSK level vocabulary only (for Lesson 1 vocabulary list)
const getTargetLevelWords = (skillLevel: string): string[] => {
  const hskLevelMap: Record<string, number> = {
    'HSK1': 1, 'HSK2': 2, 'HSK3': 3, 'HSK4': 4, 'HSK5': 5, 'HSK6': 6
  };
  
  const targetHskLevel = hskLevelMap[skillLevel];
  
  if (!targetHskLevel) {
    return cedictDictionary.slice(0, 200).map(entry => entry.chinese);
  }
  
  // Get ONLY words from the target HSK level
  const targetLevelWords = cedictDictionary
    .filter(entry => entry.hskLevel === targetHskLevel)
    .map(entry => entry.chinese);
  
  return targetLevelWords;
};

// Helper function to get allowed words for a specific HSK level (for general content)
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
  
  // Get words from the target HSK level (prioritize these)
  const targetLevelWords = cedictDictionary
    .filter(entry => entry.hskLevel === targetHskLevel)
    .map(entry => entry.chinese);
  
  // Get words from lower levels (limit these to avoid too much basic vocabulary)
  const lowerLevelWords = cedictDictionary
    .filter(entry => entry.hskLevel && entry.hskLevel < targetHskLevel)
    .map(entry => entry.chinese);
  
  // For higher levels, limit lower-level words to avoid overwhelming with basic vocabulary
  const maxLowerLevelWords = targetHskLevel <= 2 ? 200 : 100; // More lower-level words for HSK1-2
  const limitedLowerLevelWords = lowerLevelWords.slice(0, maxLowerLevelWords);
  
  // Combine words, prioritizing target level
  const combinedWords = [...targetLevelWords, ...limitedLowerLevelWords];
  
  // If we don't have enough HSK words, add some common words without HSK level
  if (combinedWords.length < 100) {
    const commonWords = cedictDictionary
      .filter(entry => !entry.hskLevel)
      .map(entry => entry.chinese)
      .slice(0, 500 - combinedWords.length);
    
    return [...combinedWords, ...commonWords];
  }
  
  return combinedWords.slice(0, 500);
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

    // Map skill levels to HSK numbers (needed for debug info)
    const hskLevelMap: Record<string, number> = {
      'HSK1': 1,
      'HSK2': 2,
      'HSK3': 3,
      'HSK4': 4,
      'HSK5': 5,
      'HSK6': 6
    };

    // Get vocabulary pools for different purposes
    const targetLevelWords = getTargetLevelWords(skillLevel);
    const allowedWords = getAllowedWords(skillLevel);
    console.log(`Using ${targetLevelWords.length} target-level words and ${allowedWords.length} total allowed words for ${skillLevel}`);
    
    // Debug: Show vocabulary distribution
    const targetHskLevel = hskLevelMap[skillLevel];
    const lowerLevelWords = cedictDictionary
      .filter(entry => entry.hskLevel && entry.hskLevel < targetHskLevel)
      .map(entry => entry.chinese);
    console.log(`Vocabulary breakdown for ${skillLevel}:`);
    console.log(`- Target level (HSK${targetHskLevel}): ${targetLevelWords.length} words`);
    console.log(`- Lower levels (HSK1-${targetHskLevel-1}): ${lowerLevelWords.length} words`);
    console.log(`- Selected from allowed words: ${allowedWords.length} words`);

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

    // Create vocabulary samples for the prompt
    const targetLevelSample = targetLevelWords.slice(0, 30).join(', ');
    const generalSample = allowedWords.slice(0, 50).join(', ');
    const remainingTargetCount = targetLevelWords.length - 30;
    const remainingGeneralCount = allowedWords.length - 50;

    const prompt = `You are a Chinese language teacher creating comprehensive lesson materials for English-speaking students preparing for the ${skillLevel} exam.

TASK: Create a complete lesson about "${subject}" suitable for ${skillLevel} level Chinese learners.

VOCABULARY RESTRICTIONS:

1. NEW VOCABULARY LIST (Lesson 1) - TARGET LEVEL ONLY:
You MUST ONLY use words from the following list for the vocabulary section. These are EXCLUSIVELY from ${skillLevel} level:
${targetLevelSample}${remainingTargetCount > 0 ? `\n(and ${remainingTargetCount} more words from ${skillLevel} level)` : ''}

2. OTHER CONTENT (Grammar, Reading, Writing, Quizzes) - GENERAL VOCABULARY:
For all other content (grammar examples, reading story, quiz questions), you can use words from this broader list which includes ${skillLevel} AND some lower HSK levels:
${generalSample}${remainingGeneralCount > 0 ? `\n(and ${remainingGeneralCount} more words from HSK1-${skillLevel.replace('HSK', '')} vocabulary)` : ''}

REQUIREMENTS FOR ALL SECTIONS:
- The topic MUST be "${subject}" specifically
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
  "writingQuiz": [
    {
      "english": "I like studying Chinese",
      "chinese": "我喜欢学习中文",
      "pinyin": "Wǒ xǐhuān xuéxí zhōngwén"
    }
  ],
  "story": {
    "aligned": [
      {
        "chinese": "我",
        "pinyin": "wǒ",
        "english": "I"
      },
      {
        "chinese": "，",
        "pinyin": "",
        "english": ","
      }
    ],
    "sentence": "I love China."
  }
}

SPECIFIC REQUIREMENTS:

1. VOCABULARY (10 words) - USE TARGET LEVEL ONLY:
- Include approximately ${config.vocabLimit} vocabulary words from the TARGET LEVEL list above
- ALL words must be from ${skillLevel} level vocabulary only
- At least 4 words should be directly related to "${subject}"
- The remaining words should be useful, common vocabulary for ${skillLevel} level
- Each word should include chinese, pinyin, and english

2. GRAMMAR CONCEPT - USE GENERAL VOCABULARY:
- Choose a grammar pattern appropriate for ${skillLevel} level (${config.grammarComplexity} complexity)
- Create 5 example sentences that are relevant to "${subject}"
- Use words from the GENERAL VOCABULARY list (can include lower-level words for sentence structure)
- Each example should include chinese, pinyin, and english
- Examples should demonstrate the grammar pattern clearly
- Include a brief explanation (1-2 sentences) in simple, conversational language explaining what this grammar pattern means and when to use it

3. GRAMMAR QUIZ QUESTIONS - USE GENERAL VOCABULARY:
- Create 5 DIFFERENT example sentences that use the SAME grammar pattern as above
- These should be separate from the grammar examples (different sentences)
- Use words from the GENERAL VOCABULARY list (can include lower-level words for sentence structure)
- Each quiz question should include chinese, pinyin, and english
- All sentences should be relevant to "${subject}" and appropriate for ${skillLevel} level

4. WRITING QUIZ QUESTIONS - USE GENERAL VOCABULARY:
- Create 5 English sentences that students will translate into Chinese characters
- Each sentence MUST use the grammar pattern: [same as grammar concept above]
- Each sentence should be about "${subject}" specifically
- Use words from the GENERAL VOCABULARY list (can include lower-level words for sentence structure)
- Make sentences engaging and relevant to the topic
- Include correct pinyin for each Chinese sentence
- Focus on character writing practice with the grammar pattern

5. READING STORY - USE GENERAL VOCABULARY:
- STORY LENGTH REQUIREMENT: For ${skillLevel} level, create a story with EXACTLY ${skillLevel === 'HSK5' || skillLevel === 'HSK6' ? '5-10 sentences' : '3-5 sentences'} (approximately ${config.charLimit} Chinese characters total)
- CRITICAL: The story MUST contain ${skillLevel === 'HSK5' || skillLevel === 'HSK6' ? 'at least 5 sentences and no more than 10 sentences' : 'at least 3 sentences and no more than 5 sentences'}
- The story MUST be about "${subject}" specifically
- Use words from the GENERAL VOCABULARY list (can include lower-level words for sentence structure)
- Include approximately ${config.vocabLimit} vocabulary words
- IMPORTANT: The story MUST include at least one instance of the grammar concept introduced in the grammar section above
- Each object in the aligned array should represent a single word or common word pair
- The sentence should be a natural, fluent English translation
- Include proper Chinese punctuation (，。！？) in the story text

IMPORTANT RULES:
- For VOCABULARY section: Use ONLY words from the TARGET LEVEL list (${skillLevel} level only)
- For all other sections: Use words from the GENERAL VOCABULARY list (can include lower-level words for sentence structure)
- Do not include any explanations, markdown, or additional text
- Do not use backticks or code blocks
- Ensure the JSON is properly formatted as an object with the required fields
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
                lessonData.writingQuiz &&
                Array.isArray(lessonData.writingQuiz) &&
                lessonData.story.aligned && 
                Array.isArray(lessonData.story.aligned) &&
                lessonData.story.sentence) {
              
              // Validate story length based on HSK level
              const storyText = lessonData.story.sentence;
              const sentenceCount = (storyText.match(/[.!?]+/g) || []).length;
              const minSentences = skillLevel === 'HSK5' || skillLevel === 'HSK6' ? 5 : 3;
              const maxSentences = skillLevel === 'HSK5' || skillLevel === 'HSK6' ? 10 : 5;
              
              if (sentenceCount < minSentences || sentenceCount > maxSentences) {
                console.log(`Story has ${sentenceCount} sentences, but ${skillLevel} requires ${minSentences}-${maxSentences} sentences. Regenerating...`);
                lastError = `Story length validation failed: got ${sentenceCount} sentences, need ${minSentences}-${maxSentences} for ${skillLevel}`;
                attempt++;
                continue;
              }
              
              // Validate grammar examples count
              const grammarExamplesCount = lessonData.grammar.examples.length;
              if (grammarExamplesCount !== 5) {
                console.log(`Grammar has ${grammarExamplesCount} examples, but requires exactly 5 examples. Regenerating...`);
                lastError = `Grammar examples validation failed: got ${grammarExamplesCount} examples, need exactly 5`;
                attempt++;
                continue;
              }
              
              // Validate writing quiz count
              const writingQuizCount = lessonData.writingQuiz.length;
              if (writingQuizCount !== 5) {
                console.log(`Writing quiz has ${writingQuizCount} questions, but requires exactly 5 questions. Regenerating...`);
                lastError = `Writing quiz validation failed: got ${writingQuizCount} questions, need exactly 5`;
                attempt++;
                continue;
              }
              
              return NextResponse.json({
                vocabulary: lessonData.vocabulary,
                grammar: lessonData.grammar,
                grammarQuiz: lessonData.grammarQuiz,
                writingQuiz: lessonData.writingQuiz,
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