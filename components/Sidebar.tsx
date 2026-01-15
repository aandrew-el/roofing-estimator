'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SidebarToggle } from './SidebarToggle';
import { ConversationList } from './ConversationList';
import { EstimateHistoryPanel } from './EstimateHistoryPanel';
import { SettingsDropdown } from './SettingsDropdown';
import { PenLine, MessageSquare, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/lib/database.types';
import type { EstimateHistoryItem } from '@/hooks/useEstimateHistory';

type SidebarTab = 'chats' | 'estimates';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  selectedId: string | null;
  selectedEstimateId?: string | null;
  onSelect: (id: string | null) => void;
  onSelectEstimate?: (estimateId: string) => void;
  onDelete: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  onNewChat: () => void;
  isLoading: boolean;
  // Estimate history props
  estimates?: EstimateHistoryItem[];
  estimatesLoading?: boolean;
  onDeleteEstimate?: (id: string) => void;
}

export function Sidebar({
  isCollapsed,
  onToggle,
  conversations,
  selectedId,
  selectedEstimateId,
  onSelect,
  onSelectEstimate,
  onDelete,
  onRename,
  onNewChat,
  isLoading,
  estimates = [],
  estimatesLoading = false,
  onDeleteEstimate,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('chats');

  return (
    <aside
      className={cn(
        'h-full bg-sidebar-bg flex flex-col transition-all duration-200 ease-out',
        isCollapsed ? 'w-0 overflow-hidden' : 'w-[280px]'
      )}
    >
      {/* Header */}
      <div className="h-14 px-3 flex items-center justify-between shrink-0">
        <button
          onClick={onNewChat}
          className="flex items-center gap-2 px-2 py-1.5 -ml-2 rounded-lg hover:bg-sidebar-item-hover transition-colors group"
        >
          <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
            <PenLine className="h-4 w-4 text-accent" />
          </div>
          <span className="text-sm font-semibold text-sidebar-text tracking-tight group-hover:text-accent transition-colors">
            Roofing Estimator
          </span>
        </button>
        <SidebarToggle isCollapsed={isCollapsed} onToggle={onToggle} />
      </div>

      {/* Tab Switcher - iOS segmented control style */}
      <div className="px-4 pb-3">
        <div className="flex gap-1 p-1 bg-muted/50 dark:bg-muted/30 rounded-xl">
          <button
            onClick={() => setActiveTab('chats')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 h-8 text-xs font-semibold rounded-lg transition-all duration-200',
              activeTab === 'chats'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Chats
          </button>
          <button
            onClick={() => setActiveTab('estimates')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 h-8 text-xs font-semibold rounded-lg transition-all duration-200',
              activeTab === 'estimates'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Receipt className="h-3.5 w-3.5" />
            Estimates
            {estimates.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-accent/10 text-accent rounded-full font-bold">
                {estimates.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {activeTab === 'chats' ? (
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={onSelect}
            onDelete={onDelete}
            onRename={onRename}
            isLoading={isLoading}
          />
        ) : (
          <EstimateHistoryPanel
            estimates={estimates}
            selectedEstimateId={selectedEstimateId}
            onSelect={onSelectEstimate || (() => {})}
            onDelete={onDeleteEstimate || (() => {})}
            isLoading={estimatesLoading}
          />
        )}
      </ScrollArea>

      {/* Settings Footer */}
      <div className="px-4 py-3">
        <SettingsDropdown />
      </div>
    </aside>
  );
}
