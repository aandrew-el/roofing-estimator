'use client';

import { ConversationItem } from './ConversationItem';
import { MessageSquare } from 'lucide-react';
import type { Conversation } from '@/lib/database.types';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  isLoading: boolean;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onDelete,
  onRename,
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
      <div className="px-3 py-8 text-center animate-in fade-in duration-300">
        <div className="w-10 h-10 rounded-xl bg-sidebar-item-hover flex items-center justify-center mx-auto mb-3">
          <MessageSquare className="w-5 h-5 text-sidebar-text-muted" />
        </div>
        <p className="text-sm text-sidebar-text-muted font-medium">
          No estimates yet
        </p>
        <p className="text-xs text-sidebar-text-muted mt-1">
          Start chatting to create your first estimate
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
          onRename={onRename}
        />
      ))}
    </div>
  );
}
