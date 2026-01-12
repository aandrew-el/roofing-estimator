import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SYSTEM_PROMPT } from '@/lib/prompts';
import { generateEstimate } from '@/lib/calculations';
import { RoofingProject } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Security constants
const MAX_MESSAGE_LENGTH = 2000;
const MAX_MESSAGES = 50;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface IncomingMessage {
  role: string;
  content: string;
}

// Validate and sanitize incoming messages
function validateMessages(messages: unknown): IncomingMessage[] | null {
  if (!Array.isArray(messages)) {
    return null;
  }

  if (messages.length > MAX_MESSAGES) {
    return null;
  }

  const validated: IncomingMessage[] = [];

  for (const msg of messages) {
    // Check message structure
    if (
      typeof msg !== 'object' ||
      msg === null ||
      typeof msg.role !== 'string' ||
      typeof msg.content !== 'string'
    ) {
      return null;
    }

    // Validate role
    if (msg.role !== 'user' && msg.role !== 'assistant') {
      return null;
    }

    // Truncate content if too long
    const content = msg.content.slice(0, MAX_MESSAGE_LENGTH);

    validated.push({
      role: msg.role,
      content,
    });
  }

  return validated;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: { messages?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Validate messages
    const messages = validateMessages(body.messages);
    if (!messages) {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      );
    }

    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Build conversation with system prompt
    const conversationMessages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: conversationMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = response.choices[0]?.message?.content || '';

    // Check if AI has collected all data and is ready to generate estimate
    if (assistantMessage.includes('[READY_TO_ESTIMATE]')) {
      // Parse the JSON data from the response
      const jsonMatch = assistantMessage.match(/\[READY_TO_ESTIMATE\]\s*(\{[\s\S]*?\})/);

      if (jsonMatch && jsonMatch[1]) {
        try {
          const projectData = JSON.parse(jsonMatch[1]) as RoofingProject;
          const estimate = generateEstimate(projectData);

          // Return the message before the JSON, plus the estimate
          const displayMessage = assistantMessage
            .replace(/\[READY_TO_ESTIMATE\][\s\S]*$/, '')
            .trim();

          return NextResponse.json({
            message: displayMessage || 'Generating your estimate now...',
            estimate,
            isComplete: true,
          });
        } catch (parseError) {
          console.error('Failed to parse project data:', parseError);
          // Continue with regular message if parsing fails
        }
      }
    }

    // Regular response without estimate
    return NextResponse.json({
      message: assistantMessage,
      estimate: null,
      isComplete: false,
    });

  } catch (error) {
    console.error('Chat API error:', error);

    // Don't expose internal error details to clients
    if (error instanceof OpenAI.APIError) {
      // Log the actual error for debugging
      console.error('OpenAI API error details:', error.message, error.status);

      // Return generic message to client
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Service is busy. Please try again in a moment.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: 'Unable to process your request. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
