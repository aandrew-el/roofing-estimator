'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { EstimateDisplay } from './EstimateDisplay';
import { INITIAL_MESSAGE } from '@/lib/prompts';
import { Estimate } from '@/lib/types';
import { useMessages } from '@/hooks/useConversations';
import { ArrowRight } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  conversationId: string | null;
  onConversationCreated: (title: string) => Promise<string | null>;
  onUpdateTitle: (id: string, title: string) => void;
  onTouch: (id: string) => void;
}

export function ChatInterface({
  conversationId,
  onConversationCreated,
  onUpdateTitle,
  onTouch,
}: ChatInterfaceProps) {
  const [localMessages, setLocalMessages] = useState<Message[]>([
    {
      id: 'initial',
      role: 'assistant',
      content: INITIAL_MESSAGE,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFirstMessage = useRef(true);

  // Database messages hook
  const { messages: dbMessages, addMessage, isLoading: messagesLoading } = useMessages(conversationId);

  // Handle conversation change - reset state
  useEffect(() => {
    if (conversationId !== activeConversationId) {
      setActiveConversationId(conversationId);
      setEstimate(null);
      setInput('');

      // For new chat (null conversationId), reset to initial message immediately
      if (!conversationId) {
        isFirstMessage.current = true;
        setLocalMessages([
          {
            id: 'initial',
            role: 'assistant',
            content: INITIAL_MESSAGE,
          },
        ]);
      }
    }
  }, [conversationId, activeConversationId]);

  // Sync messages from database when they load
  useEffect(() => {
    // Only sync if we have a conversation and messages have loaded
    if (conversationId && !messagesLoading) {
      if (dbMessages.length > 0) {
        // Load messages from database
        setLocalMessages(
          dbMessages.map((m) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }))
        );
        isFirstMessage.current = false;
      } else {
        // Existing conversation with no messages yet - show initial message
        isFirstMessage.current = true;
        setLocalMessages([
          {
            id: 'initial',
            role: 'assistant',
            content: INITIAL_MESSAGE,
          },
        ]);
      }
    }
  }, [conversationId, dbMessages, messagesLoading]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, isLoading]);

  // Focus input on mount and conversation change
  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userContent = input.trim();
    let currentConvId = conversationId;

    // Create conversation on first real message
    if (!currentConvId && isFirstMessage.current) {
      // Use first few words as title
      const title = userContent.slice(0, 50) + (userContent.length > 50 ? '...' : '');
      currentConvId = await onConversationCreated(title);
      if (!currentConvId) {
        console.error('Failed to create conversation');
        return;
      }
      isFirstMessage.current = false;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
    };

    setLocalMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Save user message to database (pass ID explicitly for race condition handling)
    if (currentConvId) {
      await addMessage('user', userContent, currentConvId);
      onTouch(currentConvId);
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...localMessages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
      };

      setLocalMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message to database (pass ID explicitly for race condition handling)
      if (currentConvId) {
        await addMessage('assistant', data.message, currentConvId);
      }

      // If estimate was generated, display it
      if (data.estimate) {
        setEstimate(data.estimate);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'I apologize, but I encountered an error processing your request. Please try again.',
      };
      setLocalMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = useCallback(() => {
    setLocalMessages([
      {
        id: 'initial',
        role: 'assistant',
        content: INITIAL_MESSAGE,
      },
    ]);
    setEstimate(null);
    setInput('');
    isFirstMessage.current = true;
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messagesLoading && conversationId ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading messages...</div>
          </div>
        ) : (
          <>
            {localMessages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
              />
            ))}
            {isLoading && <TypingIndicator />}
            {estimate && <EstimateDisplay estimate={estimate} onReset={handleReset} />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {!estimate && (
        <div className="border-t border-gray-100 bg-white px-4 py-3">
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl mx-auto">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message..."
              disabled={isLoading}
              className="flex-1 h-10 text-sm border-gray-200 focus:border-gray-300 focus:ring-0 rounded-lg"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              size="sm"
              className="h-10 px-4 bg-accent hover:bg-accent/90 rounded-lg"
            >
              <ArrowRight className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
