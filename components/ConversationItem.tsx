'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/lib/database.types';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ConversationItem({
  conversation,
  isSelected,
  onSelect,
  onDelete,
}: ConversationItemProps) {
  const [showDelete, setShowDelete] = useState(false);

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(conversation.id);
  };

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150',
        isSelected
          ? 'bg-blue-50 border-l-[3px] border-l-accent font-medium'
          : 'hover:bg-sidebar-item-hover border-l-[3px] border-l-transparent'
      )}
      onClick={() => onSelect(conversation.id)}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <MessageSquare className={cn(
        "h-4 w-4 shrink-0 transition-colors",
        isSelected ? "text-blue-600" : "text-sidebar-text-muted"
      )} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-sidebar-text block truncate max-w-[160px]">
          {conversation.title}
        </p>
        <p className="text-xs text-sidebar-text-muted">
          {formatRelativeTime(conversation.updated_at)}
        </p>
      </div>

      {/* Delete button - shows on hover */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-7 w-7 shrink-0 text-sidebar-text-muted hover:text-red-500 hover:bg-red-50 transition-opacity duration-150',
          showDelete ? 'opacity-100' : 'opacity-0'
        )}
        onClick={handleDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span className="sr-only">Delete conversation</span>
      </Button>
    </div>
  );
}
