import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function GET() {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'No API key' }, { status: 500 });
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
      defaultHeaders: {
        'anthropic-version': '2023-06-01',
        'User-Agent': 'Chinese-Reading-App/1.0',
      },
    });

    console.log('Making Anthropic API call...');
    
    const message = await anthropic.messages.create({
      model: 'claude-4-sonnet-20250514',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Say "Hello, API test successful!"',
        },
      ],
    });

    console.log('API call successful:', message);

    const content = message.content[0];
    if (content.type === 'text') {
      return NextResponse.json({
        success: true,
        response: content.text,
        model: message.model,
        usage: message.usage
      });
    } else {
      return NextResponse.json({ error: 'Unexpected content type' }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error('Anthropic API test error:', error);
    console.error('Error details:', {
      message: (error as Error).message,
      type: (error as Error).constructor.name,
      stack: (error as Error).stack
    });
    
    return NextResponse.json({
      error: 'Anthropic API call failed',
      details: (error as Error).message,
      type: (error as Error).constructor.name,
      code: (error as { code?: string }).code || 'unknown'
    }, { status: 500 });
  }
} 