'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useSession } from './useSession';
import type { Estimate } from '@/lib/types';
import type { Json, EstimateStatus } from '@/lib/database.types';

interface SaveEstimateOptions {
  customerName?: string;
  status?: EstimateStatus;
}

export function useEstimate() {
  const { contractorId, isAuthenticated } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save estimate for a conversation
  const saveEstimate = useCallback(async (
    conversationId: string,
    estimate: Estimate,
    options?: SaveEstimateOptions
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Extract metadata for quick display
      const totalAmount = estimate.midEstimate;
      const location = estimate.project?.location || null;
      const customerName = options?.customerName || null;
      const status = options?.status || 'draft';

      // Check if estimate already exists for this conversation
      const { data: existing } = await supabase
        .from('estimates')
        .select('id')
        .eq('conversation_id', conversationId)
        .single();

      if (existing) {
        // Update existing estimate
        const { error: dbError } = await supabase
          .from('estimates')
          .update({
            estimate_data: estimate as unknown as Json,
            total_amount: totalAmount,
            location,
            customer_name: customerName || undefined,
            status: options?.status || undefined,
          })
          .eq('conversation_id', conversationId);

        if (dbError) throw dbError;
      } else {
        // Insert new estimate - include contractor_id if authenticated
        const insertData: {
          conversation_id: string;
          estimate_data: Json;
          total_amount: number;
          location: string | null;
          customer_name: string | null;
          status: EstimateStatus;
          contractor_id?: string;
        } = {
          conversation_id: conversationId,
          estimate_data: estimate as unknown as Json,
          total_amount: totalAmount,
          location,
          customer_name: customerName,
          status,
        };

        // Add contractor_id if authenticated
        if (isAuthenticated && contractorId) {
          insertData.contractor_id = contractorId;
        }

        const { error: dbError } = await supabase
          .from('estimates')
          .insert(insertData);

        if (dbError) throw dbError;
      }

      return true;
    } catch (err) {
      console.error('Error saving estimate:', err);
      setError('Failed to save estimate');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contractorId, isAuthenticated]);

  // Get estimate for a conversation
  const getEstimate = useCallback(async (
    conversationId: string
  ): Promise<Estimate | null> => {
    try {
      const { data, error: dbError } = await supabase
        .from('estimates')
        .select('estimate_data')
        .eq('conversation_id', conversationId)
        .single();

      if (dbError) {
        if (dbError.code === 'PGRST116') {
          // No estimate found - not an error
          return null;
        }
        throw dbError;
      }

      return (data?.estimate_data as unknown as Estimate) || null;
    } catch (err) {
      console.error('Error fetching estimate:', err);
      return null;
    }
  }, []);

  return {
    saveEstimate,
    getEstimate,
    isLoading,
    error,
  };
}
