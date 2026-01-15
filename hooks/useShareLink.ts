'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// Generate a cryptographically secure random token
function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const randomValues = new Uint32Array(16);
  crypto.getRandomValues(randomValues);
  let token = '';
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(randomValues[i] % chars.length);
  }
  return token;
}

interface ShareLinkResult {
  token: string;
  url: string;
}

export function useShareLink() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a share link for an estimate
  const createShareLink = useCallback(async (
    estimateId: string,
    expiresInDays?: number
  ): Promise<ShareLinkResult | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if a share link already exists
      const { data: existing } = await supabase
        .from('share_tokens')
        .select('token')
        .eq('estimate_id', estimateId)
        .single();

      if (existing) {
        const url = `${window.location.origin}/share/${existing.token}`;
        return { token: existing.token, url };
      }

      // Generate new token
      const token = generateToken();
      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      // Insert new share token
      const { error: dbError } = await supabase
        .from('share_tokens')
        .insert({
          estimate_id: estimateId,
          token,
          expires_at: expiresAt,
        });

      if (dbError) throw dbError;

      const url = `${window.location.origin}/share/${token}`;
      return { token, url };
    } catch (err) {
      console.error('Error creating share link:', err);
      setError('Failed to create share link');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get existing share link for an estimate
  const getShareLink = useCallback(async (
    estimateId: string
  ): Promise<ShareLinkResult | null> => {
    try {
      const { data } = await supabase
        .from('share_tokens')
        .select('token')
        .eq('estimate_id', estimateId)
        .single();

      if (data) {
        const url = `${window.location.origin}/share/${data.token}`;
        return { token: data.token, url };
      }

      return null;
    } catch {
      return null;
    }
  }, []);

  // Delete a share link
  const deleteShareLink = useCallback(async (
    estimateId: string
  ): Promise<boolean> => {
    try {
      const { error: dbError } = await supabase
        .from('share_tokens')
        .delete()
        .eq('estimate_id', estimateId);

      if (dbError) throw dbError;
      return true;
    } catch (err) {
      console.error('Error deleting share link:', err);
      return false;
    }
  }, []);

  return {
    createShareLink,
    getShareLink,
    deleteShareLink,
    isLoading,
    error,
  };
}
