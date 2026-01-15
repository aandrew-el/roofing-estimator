'use client';

import { cn } from '@/lib/utils';

interface MessageSkeletonProps {
  count?: number;
}

export function MessageSkeleton({ count = 3 }: MessageSkeletonProps) {
  // Alternating pattern: assistant, user, assistant
  const skeletons = Array.from({ length: count }, (_, i) => ({
    id: i,
    isUser: i % 2 === 1,
  }));

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {skeletons.map(({ id, isUser }) => (
        <div
          key={id}
          className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}
        >
          <div
            className={cn(
              'rounded-2xl px-4 py-3 animate-shimmer',
              isUser ? 'w-[40%]' : 'w-[60%]',
              'h-16'
            )}
          />
        </div>
      ))}
    </div>
  );
}
