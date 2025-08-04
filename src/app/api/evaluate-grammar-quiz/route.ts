import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Fallback function using curl when Node.js SSL fails
async function makeAnthropicCallWithCurl(prompt: string, apiKey: string) {
  try {
    const requestBody = JSON.stringify({
      model: 'claude-4-sonnet-20250514',
      max_tokens: 1500,
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
1. Whether each answer is correct, partially correct, or incorrect
2. A detailed explanation for each answer (speaking directly to the student using "you")
3. The correct answer if the student's answer is wrong or partially wrong
4. An overall score and feedback (speaking directly to the student using "you")

STUDENT ANSWERS:
${questions.map((q: QuizQuestion, idx: number) => 
  `${idx + 1}. Chinese: "${q.chinese}" (${q.pinyin})
   Correct English: "${q.english}"
   Student's Answer: "${answers[idx] || 'No answer provided'}"`
).join('\n\n')}

EVALUATION CRITERIA:

CORRECT ANSWERS (Full Credit):
- Exact matches to the correct answer
- Minor spelling mistakes, capitalization, or punctuation differences
- Synonyms that convey the same meaning (e.g., "plane" vs "airplane", "car" vs "automobile")
- Alternative phrasings that maintain the same meaning and grammar structure
- Articles that don't change the meaning (e.g., "the" vs "a" when both are acceptable)

PARTIALLY CORRECT ANSWERS (Half Credit):
- Answers that show understanding of the main grammar pattern but have minor errors
- Correct word order and structure but with vocabulary mistakes
- Missing or incorrect articles that don't fundamentally change the meaning
- Slightly different word choices that are close but not exact synonyms
- Answers that capture the main idea but miss some details

INCORRECT ANSWERS (No Credit):
- Completely wrong translations that don't match the meaning
- Major grammar errors that change the sentence structure
- Missing key vocabulary that changes the meaning significantly
- Answers that don't demonstrate understanding of the grammar pattern

EXPLANATION REQUIREMENTS:
- For correct answers: Explain what they did well and why their translation is accurate
- For partially correct answers: Explain what they got right, what needs improvement, and why
- For incorrect answers: Explain what the correct translation should be and why their answer doesn't work
- Always be encouraging and constructive
- Consider the student's skill level (${skillLevel}) when providing explanations

OUTPUT FORMAT (respond with ONLY this JSON structure):
{
  "evaluations": [
    {
      "questionIndex": 0,
      "isCorrect": true,
      "isPartiallyCorrect": false,
      "explanation": "You correctly translated this Chinese sentence. The word order is perfect, and you used the appropriate English equivalent. The grammar pattern 'Subject + Verb + Object' is well understood here.",
      "correctAnswer": "I like cats",
      "studentAnswer": "I like cats"
    }
  ],
  "summary": {
    "correctCount": 3,
    "partialCount": 1,
    "totalCount": 5,
    "percentage": 70,
    "overallFeedback": "Good work! You showed solid understanding of the grammar patterns. Your translations were mostly accurate, with just a few areas for improvement. Keep practicing and you'll continue to get better!"
  }
}

IMPORTANT:
- Always speak directly to the student using "you" and "your" in explanations and feedback
- Be encouraging and constructive in your feedback
- Provide specific, detailed explanations that help the student understand their mistakes
- Consider the student's skill level (${skillLevel}) when evaluating
- Use "isCorrect: true" for full credit, "isCorrect: false, isPartiallyCorrect: true" for half credit, and "isCorrect: false, isPartiallyCorrect: false" for no credit`;

    console.log('Sending evaluation request to Claude...');

    let responseText: string;
    
    try {
      // Try Node.js SDK first
      const message = await anthropic.messages.create({
        model: 'claude-4-sonnet-20250514',
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
      console.log('Note: Token usage not available for curl fallback');
    }

    // Extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
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
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 