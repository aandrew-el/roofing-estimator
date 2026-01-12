'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SidebarToggle } from './SidebarToggle';
import { ConversationList } from './ConversationList';
import { Plus, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/lib/database.types';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
  isLoading: boolean;
}

export function Sidebar({
  isCollapsed,
  onToggle,
  conversations,
  selectedId,
  onSelect,
  onDelete,
  onNewChat,
  isLoading,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'h-full bg-sidebar-bg border-r border-sidebar-border flex flex-col transition-all duration-200 ease-out',
        isCollapsed ? 'w-0 overflow-hidden' : 'w-[260px]'
      )}
    >
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between shrink-0">
        <span className="text-sm font-semibold text-sidebar-text tracking-tight">
          Roofing Estimator
        </span>
        <SidebarToggle isCollapsed={isCollapsed} onToggle={onToggle} />
      </div>

      {/* New Chat Button */}
      <div className="px-3 pb-2">
        <Button
          onClick={onNewChat}
          variant="ghost"
          className="w-full justify-start gap-2 h-8 text-sm font-normal text-sidebar-text-muted hover:text-sidebar-text hover:bg-sidebar-item-hover"
        >
          <PenLine className="h-3.5 w-3.5" />
          New Estimate
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={onSelect}
          onDelete={onDelete}
          isLoading={isLoading}
        />
      </ScrollArea>

    </aside>
  );
}
