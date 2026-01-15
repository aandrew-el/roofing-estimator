import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SYSTEM_PROMPT } from '@/lib/prompts';
import { generateEstimate } from '@/lib/calculations';
import { RoofingProject } from '@/lib/types';
import { checkRateLimit, getRateLimitConfig } from '@/lib/rate-limit';
import { getOptionalUser } from '@/lib/api-auth';

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
  // Check authentication status for tiered rate limiting
  const { user, isAuthenticated } = await getOptionalUser();

  // Rate limiting - use user ID for authenticated users, IP for anonymous
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             'unknown';

  // Use user ID as identifier if authenticated (more reliable than IP)
  const rateLimitIdentifier = user?.id || ip;
  const rateLimitConfig = getRateLimitConfig('chat', isAuthenticated);

  const rateLimitResult = checkRateLimit(rateLimitIdentifier, rateLimitConfig);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment before trying again.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
        },
      }
    );
  }

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
      // Extract everything after [READY_TO_ESTIMATE] and find the JSON object
      const markerIndex = assistantMessage.indexOf('[READY_TO_ESTIMATE]');
      const afterMarker = assistantMessage.slice(markerIndex + '[READY_TO_ESTIMATE]'.length).trim();

      // Find the JSON by matching balanced braces
      const jsonStart = afterMarker.indexOf('{');
      if (jsonStart !== -1) {
        let braceCount = 0;
        let jsonEnd = -1;

        for (let i = jsonStart; i < afterMarker.length; i++) {
          if (afterMarker[i] === '{') braceCount++;
          else if (afterMarker[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              jsonEnd = i + 1;
              break;
            }
          }
        }

        if (jsonEnd !== -1) {
          const jsonString = afterMarker.slice(jsonStart, jsonEnd);
          try {
            const projectData = JSON.parse(jsonString) as RoofingProject;
            const estimate = generateEstimate(projectData);

            // Return the message before the marker, plus the estimate
            const displayMessage = assistantMessage
              .slice(0, markerIndex)
              .trim();

            return NextResponse.json({
              message: displayMessage || 'Here is your detailed roofing estimate:',
              estimate,
              isComplete: true,
            });
          } catch (parseError) {
            console.error('Failed to parse project data:', parseError, jsonString);
            // Continue with regular message if parsing fails
          }
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
