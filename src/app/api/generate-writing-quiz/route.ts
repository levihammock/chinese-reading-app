import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

interface WritingQuizQuestion {
  english: string;
  chinese: string;
  pinyin: string;
}

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
    const { skillLevel, topic, grammarConcept } = body;

    // Validate input
    if (!skillLevel || !topic || !grammarConcept) {
      return NextResponse.json(
        { error: 'Missing skillLevel, topic, or grammarConcept' },
        { status: 400 }
      );
    }

    console.log('Generating writing quiz for:', { skillLevel, topic, grammarConcept });

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: apiKey,
      defaultHeaders: {
        'User-Agent': 'Chinese-Reading-App/1.0',
      },
    });

    // Create the prompt for generating writing quiz questions
    const prompt = `You are a Chinese language teacher creating a writing quiz for ${skillLevel} level students.

CONTEXT:
- Skill Level: ${skillLevel}
- Topic: ${topic}
- Grammar Concept: ${grammarConcept.name}
- Grammar Description: ${grammarConcept.description}
- Grammar Explanation: ${grammarConcept.explanation}

TASK:
Create 5 English sentences that students will translate into Chinese characters. Each sentence MUST use the grammar pattern: ${grammarConcept.description}

REQUIREMENTS:
- Each sentence should be about "${topic}" specifically
- All sentences must demonstrate the grammar pattern: ${grammarConcept.description}
- Use vocabulary appropriate for ${skillLevel} level
- Make sentences engaging and relevant to the topic
- Vary the complexity slightly but keep within ${skillLevel} level
- Include a mix of different subjects and objects to practice the pattern thoroughly

OUTPUT FORMAT (respond with ONLY this JSON structure):
{
  "questions": [
    {
      "english": "I like studying Chinese",
      "chinese": "我喜欢学习中文",
      "pinyin": "Wǒ xǐhuān xuéxí zhōngwén"
    }
  ]
}

IMPORTANT:
- Ensure all sentences use the grammar pattern: ${grammarConcept.description}
- Make sure the Chinese translations are accurate and use proper characters
- Include correct pinyin for each Chinese sentence
- Keep sentences appropriate for ${skillLevel} level vocabulary
- Focus on the topic: "${topic}"`;

    console.log('Sending writing quiz generation request to Claude...');

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

    const content = message.content[0];
    if (content.type === 'text') {
      // Extract JSON from the response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const quizData = JSON.parse(jsonMatch[0]);
          
          // Validate the structure
          if (quizData.questions && Array.isArray(quizData.questions)) {
            return NextResponse.json(quizData);
          } else {
            throw new Error('Invalid quiz data structure');
          }
        } catch (parseError) {
          console.error('Failed to parse writing quiz response:', parseError);
          return NextResponse.json(
            { error: 'Failed to parse AI writing quiz response' },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'No valid JSON found in AI response' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Unexpected content type from AI' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 