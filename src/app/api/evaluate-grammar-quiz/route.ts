import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

interface QuizQuestion {
  chinese: string;
  pinyin: string;
  english: string;
}

interface QuizAnswer {
  question: QuizQuestion;
  userAnswer: string;
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
    const { questions, answers, skillLevel, topic } = body;

    // Validate input
    if (!questions || !answers || !skillLevel || !topic) {
      return NextResponse.json(
        { error: 'Missing questions, answers, skillLevel, or topic' },
        { status: 400 }
      );
    }

    console.log('Evaluating grammar quiz for:', { skillLevel, topic });

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: apiKey,
      defaultHeaders: {
        'User-Agent': 'Chinese-Reading-App/1.0',
      },
    });

    // Create the evaluation prompt
    const prompt = `You are a Chinese language teacher evaluating a student's grammar quiz answers.

CONTEXT:
- Skill Level: ${skillLevel}
- Topic: ${topic}
- The student was asked to translate Chinese sentences to English

TASK:
Evaluate each of the student's answers and provide:
1. Whether each answer is correct (true/false)
2. A brief explanation for each answer (speaking directly to the student using "you")
3. The correct answer if the student's answer is wrong
4. An overall score and feedback (speaking directly to the student using "you")

STUDENT ANSWERS:
${questions.map((q: QuizQuestion, idx: number) => 
  `${idx + 1}. Chinese: "${q.chinese}" (${q.pinyin})
   Correct English: "${q.english}"
   Student's Answer: "${answers[idx] || 'No answer provided'}"`
).join('\n\n')}

EVALUATION CRITERIA:
- Be lenient with minor spelling mistakes, capitalization, and punctuation
- Accept answers that convey the same meaning even if worded differently
- Consider synonyms and alternative phrasings as correct
- Focus on whether the student understood the grammar pattern and meaning

OUTPUT FORMAT (respond with ONLY this JSON structure):
{
  "evaluations": [
    {
      "questionIndex": 0,
      "isCorrect": true,
      "explanation": "You correctly translated this Chinese sentence. Well done!",
      "correctAnswer": "I like cats",
      "studentAnswer": "I like cats"
    }
  ],
  "summary": {
    "correctCount": 4,
    "totalCount": 5,
    "percentage": 80,
    "overallFeedback": "Great work! You demonstrated a solid understanding of the grammar pattern. Keep practicing and you'll continue to improve!"
  }
}

IMPORTANT:
- Always speak directly to the student using "you" and "your" in explanations and feedback
- Be encouraging and constructive in your feedback
- Provide specific explanations for incorrect answers
- Consider the student's skill level (${skillLevel}) when evaluating
- Focus on the grammar pattern understanding rather than perfect English
- Use a warm, supportive tone as if you're speaking directly to the student`;

    console.log('Sending evaluation request to Claude...');

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
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
          const evaluationData = JSON.parse(jsonMatch[0]);
          
          // Validate the structure
          if (evaluationData.evaluations && evaluationData.summary) {
            return NextResponse.json(evaluationData);
          } else {
            throw new Error('Invalid evaluation data structure');
          }
        } catch (parseError) {
          console.error('Failed to parse evaluation response:', parseError);
          return NextResponse.json(
            { error: 'Failed to parse AI evaluation response' },
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