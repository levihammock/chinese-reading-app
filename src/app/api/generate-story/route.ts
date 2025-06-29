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

OUTPUT FORMAT: Provide ONLY a valid JSON object with these exact fields:
{
  "chinese": "Simplified Chinese text here",
  "pinyin": "Pinyin with tone marks here", 
  "english": "English translation here"
}

IMPORTANT: 
- The story must be specifically about "${subject}"
- Do not include any explanations or additional text outside the JSON
- Ensure all three versions tell the same story
- Make sure the JSON is properly formatted`;

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
        try {
          console.log('Raw response:', content.text);
          
          // Try to parse the JSON response
          const storyData = JSON.parse(content.text);
          
          // Validate the response structure
          if (storyData.chinese && storyData.pinyin && storyData.english) {
            console.log('Successfully generated story');
            return NextResponse.json({
              ...storyData,
              isAIGenerated: true
            });
          } else {
            console.error('Invalid response structure:', storyData);
            return NextResponse.json(
              { error: 'Invalid story format received from AI' },
              { status: 500 }
            );
          }
        } catch (parseError) {
          // If JSON parsing fails, return an error
          console.error('Failed to parse JSON response:', content.text);
          console.error('Parse error:', parseError);
          return NextResponse.json(
            { error: 'Failed to generate properly formatted story' },
            { status: 500 }
          );
        }
      } else {
        console.error('Unexpected content type:', content.type);
        return NextResponse.json(
          { error: 'Unexpected response format' },
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