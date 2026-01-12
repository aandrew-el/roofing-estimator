'use client';

import { ConversationItem } from './ConversationItem';
import type { Conversation } from '@/lib/database.types';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onDelete,
  isLoading,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="px-3 py-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-12 bg-sidebar-item-hover rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="px-3 py-8 text-center">
        <p className="text-sm text-sidebar-text-muted">
          No conversations yet
        </p>
        <p className="text-xs text-sidebar-text-muted mt-1">
          Start a new estimate to begin
        </p>
      </div>
    );
  }

  return (
    <div className="px-2 py-2 space-y-1">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isSelected={selectedId === conversation.id}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
