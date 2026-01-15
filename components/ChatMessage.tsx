'use client';

import { cn } from '@/lib/utils';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] sm:max-w-[75%] rounded-[20px] px-4 py-3 text-[15px] leading-relaxed',
          isUser
            ? 'bg-accent text-white'
            : 'bg-muted/60 dark:bg-muted/40 text-foreground'
        )}
      >
        {/* Render content with line breaks preserved */}
        {content.split('\n').map((line, index, arr) => (
          <span key={index}>
            {line}
            {index < arr.length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}
