'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/lib/database.types';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
}

export function ConversationItem({
  conversation,
  isSelected,
  onSelect,
  onDelete,
  onRename,
}: ConversationItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

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

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Cleanup long press timer
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = () => {
    onDelete(conversation.id);
    setShowConfirmDialog(false);
  };

  const startEditing = () => {
    if (onRename) {
      setEditTitle(conversation.title);
      setIsEditing(true);
    }
  };

  // Double-click to edit (desktop)
  const handleTitleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    startEditing();
  };

  // Long-press to edit (mobile) - 500ms
  const handleTitleTouchStart = () => {
    if (onRename) {
      longPressTimer.current = setTimeout(() => {
        startEditing();
      }, 500);
    }
  };

  const handleTitleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleSaveEdit = () => {
    const trimmedTitle = editTitle.trim();
    if (trimmedTitle && trimmedTitle !== conversation.title && onRename) {
      onRename(conversation.id, trimmedTitle);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(conversation.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200',
        isSelected
          ? 'bg-accent/10 dark:bg-accent/15'
          : 'hover:bg-muted/50 dark:hover:bg-muted/30',
        isEditing && 'cursor-default'
      )}
      onClick={() => !isEditing && onSelect(conversation.id)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => !isEditing && setShowActions(false)}
    >
      {/* Accent dot indicator */}
      <div className={cn(
        "w-2 h-2 rounded-full shrink-0 transition-all duration-200",
        isSelected ? "bg-accent scale-100" : "bg-muted-foreground/30 scale-75"
      )} />

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
            <Input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => handleSaveEdit()}
              className="h-7 text-sm px-2 py-1 w-full"
              placeholder="Enter title..."
            />
          </div>
        ) : (
          <>
            <p
              className={cn(
                "text-sm font-medium text-foreground block truncate max-w-[180px]",
                onRename && "cursor-text hover:bg-muted/50 rounded px-1 -mx-1 transition-colors"
              )}
              onDoubleClick={handleTitleDoubleClick}
              onTouchStart={handleTitleTouchStart}
              onTouchEnd={handleTitleTouchEnd}
              onTouchMove={handleTitleTouchEnd}
              title={onRename ? "Double-click to rename" : undefined}
            >
              {conversation.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatRelativeTime(conversation.updated_at)}
            </p>
          </>
        )}
      </div>

      {/* Delete button - show on hover when not editing */}
      {!isEditing && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200',
            showActions ? 'opacity-100' : 'opacity-0'
          )}
          onClick={handleDeleteClick}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete conversation</span>
        </Button>
      )}

      {/* Confirm Delete Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
