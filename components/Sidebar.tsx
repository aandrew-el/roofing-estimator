'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SidebarToggle } from './SidebarToggle';
import { ConversationList } from './ConversationList';
import { Plus, Home } from 'lucide-react';
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
      <div className="h-14 px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-sidebar-text">
            Roofing Estimator
          </span>
        </div>
        <SidebarToggle isCollapsed={isCollapsed} onToggle={onToggle} />
      </div>

      <Separator className="bg-sidebar-border" />

      {/* New Chat Button */}
      <div className="px-3 py-3">
        <Button
          onClick={onNewChat}
          variant="outline"
          className="w-full justify-start gap-2 h-9 text-sm font-medium border-sidebar-border hover:bg-sidebar-item-hover"
        >
          <Plus className="h-4 w-4" />
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

      {/* Footer */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-text-muted text-center">
          AI-Powered Estimates
        </p>
      </div>
    </aside>
  );
}
