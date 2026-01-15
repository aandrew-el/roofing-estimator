'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
import { Trash2, FileText, Send, Eye, CheckCircle, Loader2 } from 'lucide-react';
import type { EstimateHistoryItem as EstimateHistoryItemType } from '@/hooks/useEstimateHistory';
import type { EstimateStatus } from '@/lib/database.types';

interface EstimateHistoryItemProps {
  estimate: EstimateHistoryItemType;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (id: string) => Promise<void> | void;
}

const STATUS_CONFIG: Record<EstimateStatus, { label: string; icon: typeof FileText; color: string }> = {
  draft: { label: 'Draft', icon: FileText, color: 'text-muted-foreground' },
  sent: { label: 'Sent', icon: Send, color: 'text-blue-500' },
  viewed: { label: 'Viewed', icon: Eye, color: 'text-amber-500' },
  accepted: { label: 'Accepted', icon: CheckCircle, color: 'text-green-500' },
};

export function EstimateHistoryItem({
  estimate,
  isSelected,
  onSelect,
  onDelete,
}: EstimateHistoryItemProps) {
  const [showDelete, setShowDelete] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const statusConfig = STATUS_CONFIG[estimate.status];
  const StatusIcon = statusConfig.icon;

  const formatAmount = (amount: number | null) => {
    if (!amount) return 'No estimate';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get display name with better fallback
  const getDisplayName = () => {
    if (estimate.customerName) return estimate.customerName;
    if (estimate.location) return estimate.location;
    // Fallback to date-based name
    return `Estimate - ${formatShortDate(estimate.createdAt)}`;
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    setShowConfirmDialog(false);
    setIsDeleting(true);
    try {
      await onDelete(estimate.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-1 px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
        isSelected
          ? 'bg-sidebar-item-active'
          : 'hover:bg-sidebar-item-hover'
      )}
      onClick={onSelect}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      {/* Top row: Customer/Location and Status */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-sidebar-text truncate flex-1">
          {getDisplayName()}
        </span>
        <div className={cn('flex items-center gap-1', statusConfig.color)}>
          <StatusIcon className="h-3 w-3" />
          <span className="text-[10px] font-medium uppercase tracking-wide">
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Bottom row: Amount and Date */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-sidebar-text-muted font-medium">
          {formatAmount(estimate.totalAmount)}
        </span>
        <span className="text-[10px] text-sidebar-text-muted">
          {formatDate(estimate.createdAt)}
        </span>
      </div>

      {/* Delete button - shows on hover */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-sidebar-text-muted hover:text-red-500 hover:bg-destructive/10 transition-opacity duration-150',
          showDelete || isDeleting ? 'opacity-100' : 'opacity-0'
        )}
        onClick={handleDeleteClick}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
        <span className="sr-only">Delete estimate</span>
      </Button>

      {/* Confirm Delete Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete estimate?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this estimate. This action cannot be undone.
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
