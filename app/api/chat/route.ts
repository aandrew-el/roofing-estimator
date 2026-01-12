import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SYSTEM_PROMPT } from '@/lib/prompts';
import { generateEstimate } from '@/lib/calculations';
import { RoofingProject } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Build conversation with system prompt
    const conversationMessages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((msg: { role: string; content: string }) => ({
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

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `OpenAI API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
