'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Customer, CustomerInsert } from '@/lib/database.types';

export interface CustomerData {
  name: string;
  email: string;
  phone?: string;
}

export function useCustomer() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save customer details for a conversation
  const saveCustomer = useCallback(async (
    conversationId: string,
    customerData: CustomerData
  ): Promise<Customer | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const insertData: CustomerInsert = {
        conversation_id: conversationId,
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone || null,
      };

      const { data, error: dbError } = await supabase
        .from('customers')
        .insert(insertData)
        .select()
        .single();

      if (dbError) throw dbError;
      return data;
    } catch (err) {
      console.error('Error saving customer:', err);
      setError('Failed to save customer details');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get customer for a conversation
  const getCustomer = useCallback(async (
    conversationId: string
  ): Promise<Customer | null> => {
    try {
      const { data, error: dbError } = await supabase
        .from('customers')
        .select('*')
        .eq('conversation_id', conversationId)
        .single();

      if (dbError) {
        if (dbError.code === 'PGRST116') {
          // No customer found - not an error
          return null;
        }
        throw dbError;
      }
      return data;
    } catch (err) {
      console.error('Error fetching customer:', err);
      return null;
    }
  }, []);

  return {
    saveCustomer,
    getCustomer,
    isLoading,
    error,
  };
}
