import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { cedictDictionary } from '@/data/cedict-dictionary';

// Fallback story generator for when API is unavailable
const generateFallbackStory = (skillLevel: string, subject: string) => {
  const stories = {
    HSK1: {
      chinese: "小猫喜欢玩球。它每天都很开心。",
      pinyin: "Xiǎo māo xǐhuān wán qiú. Tā měi tiān dōu hěn kāixīn.",
      english: "The little cat likes to play with a ball. It is very happy every day."
    },
    HSK2: {
      chinese: "小明和他的朋友一起去公园。他们看到了很多美丽的花。天气很好，大家都很高兴。",
      pinyin: "Xiǎo Míng hé tā de péngyou yīqǐ qù gōngyuán. Tāmen kàn dào le hěn duō měilì de huā. Tiānqì hěn hǎo, dàjiā dōu hěn gāoxìng.",
      english: "Xiao Ming and his friend went to the park together. They saw many beautiful flowers. The weather was nice, and everyone was happy."
    },
    HSK3: {
      chinese: "昨天下午，我和家人去了博物馆。那里有很多有趣的历史文物。我们学到了很多关于古代中国的知识。参观结束后，我们在附近的餐厅吃了晚饭。",
      pinyin: "Zuótiān xiàwǔ, wǒ hé jiārén qù le bówùguǎn. Nàlǐ yǒu hěn duō yǒuqù de lìshǐ wénwù. Wǒmen xué dào le hěn duō guānyú gǔdài Zhōngguó de zhīshi. Cānguān jiéshù hòu, wǒmen zài fùjìn de cāntīng chī le wǎnfàn.",
      english: "Yesterday afternoon, my family and I went to the museum. There were many interesting historical artifacts there. We learned a lot about ancient China. After the visit, we had dinner at a nearby restaurant."
    },
    HSK4: {
      chinese: "上个月，我参加了一个中国文化交流活动。活动期间，我们学习了传统书法和国画技巧。老师耐心地教导我们如何握笔和运笔。虽然一开始很困难，但经过练习，我们都取得了很大进步。这次经历让我对中国传统文化有了更深的理解和欣赏。",
      pinyin: "Shàng gè yuè, wǒ cānjiā le yī gè Zhōngguó wénhuà jiāoliú huódòng. Huódòng qījiān, wǒmen xuéxí le chuántǒng shūfǎ hé guóhuà jìqiǎo. Lǎoshī nàixīn de jiàodǎo wǒmen rúhé wò bǐ hé yùn bǐ. Suīrán yī kāishǐ hěn kùnnan, dàn jīngguò liànxí, wǒmen dōu qǔdé le hěn dà jìnbù. Zhè cì jīnglì ràng wǒ duì Zhōngguó chuántǒng wénhuà yǒu le gèng shēn de lǐjiě hé xīnshǎng.",
      english: "Last month, I participated in a Chinese cultural exchange activity. During the event, we learned traditional calligraphy and Chinese painting techniques. The teacher patiently taught us how to hold and use the brush. Although it was difficult at first, after practice, we all made great progress. This experience gave me a deeper understanding and appreciation of traditional Chinese culture."
    },
    HSK5: {
      chinese: "随着全球化的发展，跨文化交流变得越来越重要。在当今社会，掌握多种语言不仅能够促进个人发展，还能为职业发展创造更多机会。学习中文不仅让我了解了中国的历史和文化，还帮助我建立了与中文母语者的友谊。这种语言学习经历让我认识到，语言是连接不同文化的桥梁，也是促进世界和平与理解的重要工具。",
      pinyin: "Suízhe quánqiúhuà de fāzhǎn, kuà wénhuà jiāoliú biàn dé yuè lái yuè zhòngyào. Zài dāngjīn shèhuì, zhǎngwò duō zhǒng yǔyán bùjǐn nénggòu cùjìn gèrén fāzhǎn, hái néng wèi zhíyè fāzhǎn chuàngzào gèng duō jīhuì. Xuéxí Zhōngwén bùjǐn ràng wǒ liǎojiě le Zhōngguó de lìshǐ hé wénhuà, hái bāngzhù wǒ jiànlì le yǔ Zhōngwén mǔyǔ zhě de yǒuyì. Zhè zhǒng yǔyán xuéxí jīnglì ràng wǒ rènshí dào, yǔyán shì liánjiē bùtóng wénhuà de qiáoliáng, yě shì cùjìn shìjiè hépíng yǔ lǐjiě de zhòngyào gōngjù.",
      english: "With the development of globalization, cross-cultural communication has become increasingly important. In today's society, mastering multiple languages not only promotes personal development but also creates more opportunities for career advancement. Learning Chinese has not only helped me understand China's history and culture but also helped me build friendships with native Chinese speakers. This language learning experience has made me realize that language is a bridge connecting different cultures and an important tool for promoting world peace and understanding."
    },
    HSK6: {
      chinese: "在当今快速发展的信息时代，人工智能技术的突飞猛进正在深刻改变着我们的生活方式和工作模式。从智能手机到自动驾驶汽车，从医疗诊断到金融分析，AI技术的应用已经渗透到社会的各个领域。然而，这种技术革新也带来了新的挑战和思考。我们需要在享受技术便利的同时，也要关注其可能带来的伦理问题和社会影响。只有通过理性思考和负责任的发展，我们才能确保人工智能技术真正造福人类，推动社会向着更加和谐、可持续的方向发展。",
      pinyin: "Zài dāngjīn kuàisù fāzhǎn de xìnxī shídài, réngōng zhìnéng jìshù de tūfēi měngjìn zhèngzài shēnkè gǎibiàn zhe wǒmen de shēnghuó fāngshì hé gōngzuò móshì. Cóng zhìnéng shǒujī dào zìdòng jiàshǐ qìchē, cóng yīliáo zhěnduàn dào jīnróng fēnxī, AI jìshù de yìngyòng yǐjīng shèntòu dào shèhuì de gègè lǐngyù. Rán'ér, zhè zhǒng jìshù géxīn yě dài lái le xīn de tiǎozhàn hé sīkǎo. Wǒmen xūyào zài xiǎngshòu jìshù biànlì de tóngshí, yě yào guānzhù qí kěnéng dài lái de lúnlǐ wèntí hé shèhuì yǐngxiǎng. Zhǐyǒu tōngguò lǐxìng sīkǎo hé fùzérèn de fāzhǎn, wǒmen cái néng quèbǎo réngōng zhìnéng jìshù zhēnzhèng zàofú rénlèi, tuīdòng shèhuì xiàng zhe gèngjiā héxié, kě chíxù de fāngxiàng fāzhǎn.",
      english: "In today's rapidly developing information age, the rapid advancement of artificial intelligence technology is profoundly changing our way of life and work patterns. From smartphones to autonomous vehicles, from medical diagnosis to financial analysis, the application of AI technology has penetrated into various fields of society. However, this technological innovation also brings new challenges and considerations. While enjoying the convenience of technology, we also need to pay attention to the potential ethical issues and social impacts it may bring. Only through rational thinking and responsible development can we ensure that artificial intelligence technology truly benefits humanity and promotes society toward a more harmonious and sustainable direction."
    }
  };
  
  return stories[skillLevel as keyof typeof stories] || stories.HSK1;
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

CRITICAL: You must respond with ONLY a valid JSON object. Do not include any text before or after the JSON.

OUTPUT FORMAT (respond with ONLY this JSON structure):
{
  "chinese": "Simplified Chinese text here",
  "pinyin": "Pinyin with tone marks here", 
  "english": "English translation here"
}

IMPORTANT RULES:
- The story must be specifically about "${subject}"
- Use ONLY vocabulary from the provided word list (HSK1-${skillLevel.replace('HSK', '')} levels)
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
        ...fallbackStory,
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