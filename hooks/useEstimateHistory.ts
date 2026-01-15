'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useSession } from './useSession';
import type { StoredEstimate, EstimateStatus } from '@/lib/database.types';

export interface EstimateHistoryItem {
  id: string;
  conversationId: string;
  customerName: string | null;
  totalAmount: number | null;
  location: string | null;
  status: EstimateStatus;
  createdAt: string;
}

export function useEstimateHistory() {
  const { sessionId, contractorId, isAuthenticated, isLoading: sessionLoading } = useSession();
  const [estimates, setEstimates] = useState<EstimateHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all estimates for this session or contractor
  const fetchEstimates = useCallback(async () => {
    // Need either sessionId (anonymous) or contractorId (authenticated)
    if (!sessionId && !contractorId) return;

    try {
      setIsLoading(true);

      // For authenticated users, query estimates directly by contractor_id
      if (isAuthenticated && contractorId) {
        const { data: estimatesData, error: estError } = await supabase
          .from('estimates')
          .select('id, conversation_id, customer_name, total_amount, location, status, created_at')
          .eq('contractor_id', contractorId)
          .order('created_at', { ascending: false });

        if (estError) throw estError;

        const historyItems: EstimateHistoryItem[] = (estimatesData || []).map(est => ({
          id: est.id,
          conversationId: est.conversation_id,
          customerName: est.customer_name,
          totalAmount: est.total_amount,
          location: est.location,
          status: est.status || 'draft',
          createdAt: est.created_at,
        }));

        setEstimates(historyItems);
        setError(null);
        return;
      }

      // For anonymous users, query via conversations
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('session_id', sessionId);

      if (convError) throw convError;

      if (!conversations || conversations.length === 0) {
        setEstimates([]);
        return;
      }

      const conversationIds = conversations.map(c => c.id);

      // Then get all estimates for those conversations
      const { data: estimatesData, error: estError } = await supabase
        .from('estimates')
        .select('id, conversation_id, customer_name, total_amount, location, status, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      if (estError) throw estError;

      const historyItems: EstimateHistoryItem[] = (estimatesData || []).map(est => ({
        id: est.id,
        conversationId: est.conversation_id,
        customerName: est.customer_name,
        totalAmount: est.total_amount,
        location: est.location,
        status: est.status || 'draft',
        createdAt: est.created_at,
      }));

      setEstimates(historyItems);
      setError(null);
    } catch (err) {
      console.error('Error fetching estimate history:', err);
      setError('Failed to load estimate history');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, contractorId, isAuthenticated]);

  // Update estimate status
  const updateStatus = useCallback(async (
    estimateId: string,
    status: EstimateStatus
  ): Promise<boolean> => {
    try {
      const { error: dbError } = await supabase
        .from('estimates')
        .update({ status })
        .eq('id', estimateId);

      if (dbError) throw dbError;

      // Update local state
      setEstimates(prev =>
        prev.map(est =>
          est.id === estimateId ? { ...est, status } : est
        )
      );

      return true;
    } catch (err) {
      console.error('Error updating estimate status:', err);
      return false;
    }
  }, []);

  // Delete estimate
  const deleteEstimate = useCallback(async (estimateId: string): Promise<boolean> => {
    try {
      const { error: dbError } = await supabase
        .from('estimates')
        .delete()
        .eq('id', estimateId);

      if (dbError) throw dbError;

      // Remove from local state
      setEstimates(prev => prev.filter(est => est.id !== estimateId));

      return true;
    } catch (err) {
      console.error('Error deleting estimate:', err);
      return false;
    }
  }, []);

  // Fetch on session load
  useEffect(() => {
    if (!sessionLoading && sessionId) {
      fetchEstimates();
    }
  }, [sessionId, sessionLoading, fetchEstimates]);

  return {
    estimates,
    isLoading: isLoading || sessionLoading,
    error,
    updateStatus,
    deleteEstimate,
    refetch: fetchEstimates,
  };
}
