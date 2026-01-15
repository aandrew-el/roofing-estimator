'use client';

import { EstimateHistoryItem } from './EstimateHistoryItem';
import { Receipt } from 'lucide-react';
import type { EstimateHistoryItem as EstimateHistoryItemType } from '@/hooks/useEstimateHistory';

interface EstimateHistoryPanelProps {
  estimates: EstimateHistoryItemType[];
  selectedEstimateId?: string | null;
  onSelect: (estimateId: string) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export function EstimateHistoryPanel({
  estimates,
  selectedEstimateId,
  onSelect,
  onDelete,
  isLoading,
}: EstimateHistoryPanelProps) {
  if (isLoading) {
    return (
      <div className="px-3 py-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-14 bg-sidebar-item-hover rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (estimates.length === 0) {
    return (
      <div className="px-3 py-8 text-center animate-in fade-in duration-300">
        <div className="w-10 h-10 rounded-xl bg-sidebar-item-hover flex items-center justify-center mx-auto mb-3">
          <Receipt className="w-5 h-5 text-sidebar-text-muted" />
        </div>
        <p className="text-sm text-sidebar-text-muted font-medium">
          No saved estimates
        </p>
        <p className="text-xs text-sidebar-text-muted mt-1">
          Complete an estimate to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="px-2 py-2 space-y-1">
      {estimates.map((estimate) => (
        <EstimateHistoryItem
          key={estimate.id}
          estimate={estimate}
          isSelected={selectedEstimateId === estimate.id}
          onSelect={() => onSelect(estimate.id)}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
