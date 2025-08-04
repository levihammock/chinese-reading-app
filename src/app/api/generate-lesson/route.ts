import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import completeHSKDictionaryData from '@/data/complete-hsk-dictionary.json';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Type the dictionary data
interface DictionaryEntry {
  chinese: string;
  pinyin: string;
  english: string;
  hskLevel?: number;
  hskUsage?: string;
  hskSource?: string;
  priority?: string;
  frequency?: number;
  partsOfSpeech?: string[];
  radical?: string;
  traditional?: string;
  allMeanings?: string[];
  classifiers?: string[];
}

const completeHSKDictionary = completeHSKDictionaryData as DictionaryEntry[];

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
        // Try to fix common JSON issues
        const fixedJson = fixCommonJsonIssues(jsonMatch[0]);
        try {
          return JSON.parse(fixedJson);
        } catch (finalError) {
          console.error('Failed to parse fixed JSON:', finalError);
          return null;
        }
      }
    }
    return null;
  }
};

// Helper function to fix common JSON formatting issues
const fixCommonJsonIssues = (jsonString: string): string => {
  let fixed = jsonString;
  
  // Fix missing commas between array elements
  fixed = fixed.replace(/"\s*}\s*"/g, '",\n"');
  fixed = fixed.replace(/"\s*]\s*"/g, '",\n"');
  
  // Fix missing commas between object properties
  fixed = fixed.replace(/"\s*}\s*"/g, '",\n"');
  
  // Fix unclosed quotes
  fixed = fixed.replace(/"([^"]*)$/gm, '"$1"');
  
  // Fix trailing commas
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix missing closing brackets
  const openBraces = (fixed.match(/\{/g) || []).length;
  const closeBraces = (fixed.match(/\}/g) || []).length;
  const openBrackets = (fixed.match(/\[/g) || []).length;
  const closeBrackets = (fixed.match(/\]/g) || []).length;
  
  // Add missing closing braces
  for (let i = 0; i < openBraces - closeBraces; i++) {
    fixed += '}';
  }
  
  // Add missing closing brackets
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    fixed += ']';
  }
  
  return fixed;
};

// Fallback function using curl when Node.js SSL fails
async function makeAnthropicCallWithCurl(prompt: string, apiKey: string) {
  try {
    const requestBody = JSON.stringify({
      model: 'claude-4-sonnet-20250514',
      max_tokens: 5000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const { stdout, stderr } = await execAsync(
      `curl -s -X POST "https://api.anthropic.com/v1/messages" \
        -H "Content-Type: application/json" \
        -H "anthropic-version: 2023-06-01" \
        -H "x-api-key: ${apiKey}" \
        -d '${requestBody.replace(/'/g, "'\"'\"'")}'`
    );

    if (stderr) {
      console.error('Curl stderr:', stderr);
    }

    // Parse the curl response to extract the text content
    try {
      const response = JSON.parse(stdout);
      if (response.content && Array.isArray(response.content) && response.content[0] && response.content[0].text) {
        console.log('Token usage (curl):', {
          inputTokens: response.usage?.input_tokens,
          outputTokens: response.usage?.output_tokens,
          totalTokens: response.usage?.input_tokens + response.usage?.output_tokens
        });
        return response.content[0].text;
      } else {
        throw new Error('Unexpected response format from curl');
      }
    } catch (parseError) {
      console.error('Failed to parse curl response:', parseError);
      throw parseError;
    }
  } catch (error) {
    console.error('Curl fallback failed:', error);
    throw error;
  }
}

// Helper function to get target HSK level vocabulary only (for Lesson 1 vocabulary list)
const getTargetLevelWords = (skillLevel: string, subject?: string): string[] => {
  const hskLevelMap: Record<string, number> = {
    'HSK1': 1, 'HSK2': 2, 'HSK3': 3, 'HSK4': 4, 'HSK5': 5, 'HSK6': 6, 'HSK7': 7
  };
  
  const targetHskLevel = hskLevelMap[skillLevel];
  
  if (!targetHskLevel) {
    return completeHSKDictionary.slice(0, 200).map(entry => entry.chinese);
  }
  
  // Get words from the target HSK level ONLY
  let targetLevelWords = completeHSKDictionary
    .filter(entry => entry.hskLevel === targetHskLevel)
    .map(entry => entry.chinese);
  
  // Prioritize high-priority practical words
  const highPriorityWords = completeHSKDictionary
    .filter(entry => entry.hskLevel === targetHskLevel && (entry.priority === 'high' || entry.priority === 'very_high'))
    .map(entry => entry.chinese);
  
  // Put high-priority words first
  targetLevelWords = [...highPriorityWords, ...targetLevelWords.filter(word => !highPriorityWords.includes(word))];
  
  console.log(`Found ${targetLevelWords.length} words for HSK${targetHskLevel} level (${highPriorityWords.length} high-priority)`);
  
  // Only fall back to lower levels if we have extremely few words (< 20)
  if (targetLevelWords.length < 20 && targetHskLevel > 1) {
    console.log(`WARNING: Very few HSK${targetHskLevel} words (${targetLevelWords.length}), adding some HSK${targetHskLevel - 1} words`);
    const lowerLevelWords = completeHSKDictionary
      .filter(entry => entry.hskLevel === targetHskLevel - 1)
      .map(entry => entry.chinese)
      .slice(0, 100); // Add up to 100 words from the level below
    
    targetLevelWords = [...targetLevelWords, ...lowerLevelWords];
  }
  
  // Only add common words if we still have extremely few words (< 10)
  if (targetLevelWords.length < 10) {
    console.log(`WARNING: Still very few words (${targetLevelWords.length}), adding some common words`);
    const commonWords = completeHSKDictionary
      .filter(entry => !entry.hskLevel)
      .map(entry => entry.chinese)
      .slice(0, 100);
    
    targetLevelWords = [...targetLevelWords, ...commonWords];
  }
  
  return targetLevelWords;
};

// Helper function to get topic-relevant vocabulary
const getTopicRelevantVocabulary = (skillLevel: string, subject: string): string[] => {
  const hskLevelMap: Record<string, number> = {
    'HSK1': 1, 'HSK2': 2, 'HSK3': 3, 'HSK4': 4, 'HSK5': 5, 'HSK6': 6, 'HSK7': 7
  };
  
  const targetHskLevel = hskLevelMap[skillLevel];
  
  if (!targetHskLevel) {
    return [];
  }
  
  // Define topic keywords for different subjects
  const topicKeywords: Record<string, string[]> = {
    'Food': ['食物', '菜', '饭', '吃', '餐厅', '厨房', '味道', '营养', '健康', '水果', '蔬菜', '肉类', '海鲜', '饮料', '咖啡', '茶', '酒', '甜点', '零食'],
    'Travel': ['旅行', '旅游', '飞机', '火车', '酒店', '景点', '导游', '护照', '签证', '机场', '车站', '地图', '行李', '相机', '纪念品', '风景', '文化'],
    'Technology': ['科技', '电脑', '手机', '软件', '网络', '数据', '信息', '互联网', '人工智能', '程序', '系统', '设备', '技术', '创新', '数字', '智能'],
    'Business': ['商业', '公司', '经济', '贸易', '金融', '投资', '市场', '企业', '管理', '销售', '营销', '客户', '产品', '服务', '利润', '竞争', '合作'],
    'Environment': ['环境', '自然', '保护', '污染', '气候', '生态', '绿色', '可持续发展', '能源', '资源', '森林', '海洋', '动物', '植物', '地球'],
    'Education': ['教育', '学习', '学校', '大学', '老师', '学生', '课程', '知识', '技能', '考试', '成绩', '研究', '学术', '文化', '语言', '科学'],
    'Health': ['健康', '医疗', '医生', '医院', '治疗', '药物', '疾病', '预防', '营养', '运动', '休息', '心理', '身体', '检查', '康复'],
    'Sports': ['运动', '体育', '比赛', '训练', '团队', '胜利', '失败', '技能', '身体', '健康', '竞争', '合作', '教练', '运动员', '场地'],
    'Music': ['音乐', '歌曲', '乐器', '演奏', '歌手', '乐队', '旋律', '节奏', '艺术', '文化', '表演', '创作', '欣赏', '古典', '流行'],
    'Art': ['艺术', '绘画', '作品', '创作', '文化', '历史', '博物馆', '展览', '风格', '色彩', '设计', '美学', '传统', '现代', '表达']
  };
  
  const relevantKeywords = topicKeywords[subject] || [];
  
  // Find words that match the topic keywords
  const relevantWords = completeHSKDictionary
    .filter(entry => 
      entry.hskLevel === targetHskLevel && 
      (relevantKeywords.includes(entry.chinese) || 
       entry.english.toLowerCase().includes(subject.toLowerCase()) ||
       relevantKeywords.some(keyword => entry.english.toLowerCase().includes(keyword.toLowerCase())))
    )
    .map(entry => entry.chinese);
  
  console.log(`Found ${relevantWords.length} topic-relevant words for "${subject}" in HSK${targetHskLevel}`);
  
  return relevantWords;
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
    'HSK6': 6,
    'HSK7': 7
  };
  
  const targetHskLevel = hskLevelMap[skillLevel];
  
  if (!targetHskLevel) {
    // If no HSK level mapping, return all words (fallback)
    return completeHSKDictionary.slice(0, 500).map(entry => entry.chinese);
  }
  
  // Get words from the target HSK level (prioritize these)
  const targetLevelWords = completeHSKDictionary
    .filter(entry => entry.hskLevel === targetHskLevel)
    .map(entry => entry.chinese);
  
  // Prioritize high-priority practical words
  const highPriorityWords = completeHSKDictionary
    .filter(entry => entry.hskLevel === targetHskLevel && (entry.priority === 'high' || entry.priority === 'very_high'))
    .map(entry => entry.chinese);
  
  // Get words from lower levels (limit these to avoid too much basic vocabulary)
  const lowerLevelWords = completeHSKDictionary
    .filter(entry => entry.hskLevel && entry.hskLevel < targetHskLevel)
    .map(entry => entry.chinese);
  
  // For higher levels, limit lower-level words to avoid overwhelming with basic vocabulary
  const maxLowerLevelWords = targetHskLevel <= 2 ? 200 : 100; // More lower-level words for HSK1-2
  const limitedLowerLevelWords = lowerLevelWords.slice(0, maxLowerLevelWords);
  
  // Combine words, prioritizing high-priority words first, then target level, then lower levels
  const combinedWords = [...highPriorityWords, ...targetLevelWords.filter(word => !highPriorityWords.includes(word)), ...limitedLowerLevelWords];
  
  // If we don't have enough HSK words, add some common words without HSK level
  if (combinedWords.length < 100) {
    const commonWords = completeHSKDictionary
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
      'HSK6': 6,
      'HSK7': 7
    };

    // Get vocabulary pools for different purposes
    const targetLevelWords = getTargetLevelWords(skillLevel, subject);
    const topicRelevantWords = getTopicRelevantVocabulary(skillLevel, subject);
    const allowedWords = getAllowedWords(skillLevel);
    console.log(`Using ${targetLevelWords.length} target-level words and ${allowedWords.length} total allowed words for ${skillLevel}`);
    console.log(`Found ${topicRelevantWords.length} topic-relevant words for "${subject}"`);
    
    // Debug: Show vocabulary distribution
    const targetHskLevel = hskLevelMap[skillLevel];
    const lowerLevelWords = completeHSKDictionary
      .filter(entry => entry.hskLevel && entry.hskLevel < targetHskLevel)
      .map(entry => entry.chinese);
    console.log(`Vocabulary breakdown for ${skillLevel}:`);
    console.log(`- Target level (HSK${targetHskLevel}): ${targetLevelWords.length} words`);
    console.log(`- Topic-relevant: ${topicRelevantWords.length} words`);
    console.log(`- Lower levels (HSK1-${targetHskLevel-1}): ${lowerLevelWords.length} words`);
    console.log(`- Selected from allowed words: ${allowedWords.length} words`);

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: apiKey,
      defaultHeaders: {
        'User-Agent': 'Chinese-Reading-App/1.0',
        'anthropic-version': '2023-06-01',
      },
    });

    // Determine vocabulary limits and story length based on HSK level
    const hskConfig = {
      HSK1: { vocabLimit: 10, charLimit: '50-100', grammarComplexity: 'basic' },
      HSK2: { vocabLimit: 10, charLimit: '80-150', grammarComplexity: 'basic' },
      HSK3: { vocabLimit: 10, charLimit: '120-200', grammarComplexity: 'intermediate' },
      HSK4: { vocabLimit: 10, charLimit: '200-350', grammarComplexity: 'intermediate' },
      HSK5: { vocabLimit: 10, charLimit: '300-450', grammarComplexity: 'advanced' },
      HSK6: { vocabLimit: 10, charLimit: '400-600', grammarComplexity: 'advanced' },
      HSK7: { vocabLimit: 10, charLimit: '500-800', grammarComplexity: 'advanced' }
    };

    const config = hskConfig[skillLevel as keyof typeof hskConfig] || hskConfig.HSK1;

    // Create vocabulary samples for the prompt with topic prioritization
    // First, prioritize topic-relevant words, then add other target-level words
    const prioritizedTargetWords = [...topicRelevantWords, ...targetLevelWords.filter(word => !topicRelevantWords.includes(word))];
    const shuffledTargetWords = [...prioritizedTargetWords].sort(() => Math.random() - 0.5);
    const shuffledGeneralWords = [...allowedWords].sort(() => Math.random() - 0.5);
    
    const targetLevelSample = shuffledTargetWords.slice(0, 50).join(', ');
    const generalSample = shuffledGeneralWords.slice(0, 80).join(', ');
    const remainingTargetCount = targetLevelWords.length - 50;
    const remainingGeneralCount = allowedWords.length - 80;
    
    // Debug: Show actual target-level words being provided
    console.log(`Target-level words sample (first 20): ${shuffledTargetWords.slice(0, 20).join(', ')}`);
    console.log(`Topic-relevant words in sample: ${topicRelevantWords.slice(0, 10).join(', ')}`);
    console.log(`Target-level words count: ${targetLevelWords.length}`);
    console.log(`Randomized sample size: ${shuffledTargetWords.slice(0, 50).length}`);
    if (targetLevelWords.length < 50) {
      console.log(`WARNING: Very few target-level words available (${targetLevelWords.length}). This may cause repetitive vocabulary.`);
    }

    const prompt = `You are a Chinese language teacher creating comprehensive lesson materials for English-speaking students preparing for the ${skillLevel} exam.

TASK: Create a complete lesson about "${subject}" suitable for ${skillLevel} level Chinese learners.

VOCABULARY RESTRICTIONS:

1. NEW VOCABULARY LIST (Lesson 1) - TARGET LEVEL ONLY:
You MUST ONLY use words from the following list for the vocabulary section. These are EXCLUSIVELY from ${skillLevel} level:
${targetLevelSample}${remainingTargetCount > 0 ? `\n(and ${remainingTargetCount} more words from ${skillLevel} level)` : ''}

TOPIC-RELEVANT VOCABULARY PRIORITY:
The first ${topicRelevantWords.length} words in the above list are specifically related to "${subject}". You MUST prioritize these topic-relevant words when selecting vocabulary for the lesson.

CRITICAL: Avoid using these very common words unless absolutely necessary: 我, 喜欢, 学习, 中文, 朋友, 快乐, 时间, 老师, 学校, 动物. Choose more diverse and interesting vocabulary from the provided list.

2. OTHER CONTENT (Grammar, Reading, Writing, Quizzes) - GENERAL VOCABULARY:
For all other content (grammar examples, reading story, quiz questions), you can use words from this broader list which includes ${skillLevel} AND some lower HSK levels:
${generalSample}${remainingGeneralCount > 0 ? `\n(and ${remainingGeneralCount} more words from HSK1-${skillLevel.replace('HSK', '')} vocabulary)` : ''}

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
      "english": "He studies Chinese",
      "aligned": [
        {
          "chinese": "他",
          "pinyin": "tā",
          "english": "he"
        },
        {
          "chinese": "学习", 
          "pinyin": "xuéxí",
          "english": "study"
        },
        {
          "chinese": "中文",
          "pinyin": "zhōngwén", 
          "english": "Chinese"
        }
      ]
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
- Include exactly ${config.vocabLimit} vocabulary words from the TARGET LEVEL list above
- ALL words must be from ${skillLevel} level vocabulary only
- CRITICAL: At least 6-8 words should be directly related to "${subject}" (prioritize the topic-relevant words from the beginning of the list)
- The remaining 2-4 words should be useful, common vocabulary for ${skillLevel} level
- Each word should include chinese, pinyin, and english
- DO NOT use the same words repeatedly across different lessons
- IMPORTANT: Choose a VARIETY of different words - avoid repetitive selection

2. GRAMMAR CONCEPT - USE GENERAL VOCABULARY:
- Choose a grammar pattern appropriate for ${skillLevel} level (${config.grammarComplexity} complexity)
- CRITICAL: Create EXACTLY 5 example sentences that are relevant to "${subject}"
- CRITICAL: You MUST include exactly 5 examples - no more, no less
- Use words from the GENERAL VOCABULARY list (can include lower-level words for sentence structure)
- Each example should include chinese, pinyin, and english
- Examples should demonstrate the grammar pattern clearly
- Include a brief explanation (1-2 sentences) in simple, conversational language explaining what this grammar pattern means and when to use it

3. GRAMMAR QUIZ QUESTIONS - USE GENERAL VOCABULARY:
- CRITICAL: Create EXACTLY 5 DIFFERENT example sentences that use the SAME grammar pattern as above
- CRITICAL: You MUST include exactly 5 questions - no more, no less
- These should be separate from the grammar examples (different sentences)
- Use words from the GENERAL VOCABULARY list (can include lower-level words for sentence structure)
- Each quiz question should include chinese, pinyin, english, AND aligned word-level data
- All sentences should be relevant to "${subject}" and appropriate for ${skillLevel} level
- Each grammarQuiz question should have this structure:
  {
    "chinese": "他学习中文",
    "pinyin": "Tā xuéxí zhōngwén", 
    "english": "He studies Chinese",
    "aligned": [
      {
        "chinese": "他",
        "pinyin": "tā",
        "english": "he"
      },
      {
        "chinese": "学习", 
        "pinyin": "xuéxí",
        "english": "study"
      },
      {
        "chinese": "中文",
        "pinyin": "zhōngwén", 
        "english": "Chinese"
      }
    ]
  }

4. WRITING QUIZ QUESTIONS - USE GENERAL VOCABULARY:
- CRITICAL: Create EXACTLY 5 English sentences that students will translate into Chinese characters
- CRITICAL: You MUST include exactly 5 questions - no more, no less
- Each sentence MUST use the grammar pattern: [same as grammar concept above]
- Each sentence should be about "${subject}" specifically
- Use words from the GENERAL VOCABULARY list (can include lower-level words for sentence structure)
- Make sentences engaging and relevant to the topic
- Include correct pinyin for each Chinese sentence
- Focus on character writing practice with the grammar pattern

5. READING STORY - USE GENERAL VOCABULARY:
- CRITICAL STORY LENGTH: You MUST create EXACTLY ${skillLevel === 'HSK5' || skillLevel === 'HSK6' ? '5-10' : '3-5'} sentences for ${skillLevel}
- CRITICAL: Count your sentences carefully - if you generate fewer than ${skillLevel === 'HSK5' || skillLevel === 'HSK6' ? '5' : '3'} sentences, your response will be rejected
- The story MUST be about "${subject}" specifically
- Use words from the GENERAL VOCABULARY list (can include lower-level words for sentence structure)
- Include approximately ${config.vocabLimit} vocabulary words
- IMPORTANT: The story MUST include at least one instance of the grammar concept introduced in the grammar section above
- Each object in the aligned array should represent a single word or common word pair
- The sentence should be a natural, fluent English translation
- Include proper Chinese punctuation (，。！？) in the story text

IMPORTANT RULES:
- For VOCABULARY section: Use ONLY words from the TARGET LEVEL list (${skillLevel} level only) and prioritize topic-relevant words
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
        let responseText: string;
        
        try {
          // Try Node.js SDK first
          const message = await anthropic.messages.create({
            model: 'claude-4-sonnet-20250514',
            max_tokens: 5000,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
          });

          const content = message.content[0];
          if (content.type === 'text') {
            responseText = content.text;
            console.log('Token usage (Node.js SDK):', {
              inputTokens: message.usage?.input_tokens,
              outputTokens: message.usage?.output_tokens,
              totalTokens: message.usage?.input_tokens + message.usage?.output_tokens
            });
          } else {
            throw new Error('Unexpected content type from Node.js SDK');
          }
        } catch (nodeError: unknown) {
          console.log('Node.js SDK failed, trying curl fallback:', (nodeError as Error).message);
          
          // Fallback to curl
          responseText = await makeAnthropicCallWithCurl(prompt, apiKey);
          console.log('Curl response length:', responseText.length);
          console.log('Note: Token usage not available for curl fallback');
        }

        const lessonData = extractJSONFromText(responseText);
        console.log('Raw AI response (first 1000 chars):', responseText.substring(0, 1000));
        console.log('Extracted lesson data:', lessonData ? 'Success' : 'Failed');
        if (lessonData) {
          console.log('Lesson data keys:', Object.keys(lessonData));
          console.log('Has vocabulary:', !!lessonData.vocabulary);
          console.log('Has grammar:', !!lessonData.grammar);
          console.log('Has grammarQuiz:', !!lessonData.grammarQuiz);
          console.log('Has story:', !!lessonData.story);
        }
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