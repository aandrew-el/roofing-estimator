'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { Contractor, ContractorUpdate } from '@/lib/database.types';

export function useContractor() {
  const { user, isLoading: authLoading } = useAuth();
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch contractor profile
  const fetchContractor = useCallback(async () => {
    if (!user) {
      setContractor(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error: dbError } = await supabase
        .from('contractors')
        .select('*')
        .eq('id', user.id)
        .single();

      if (dbError) {
        // Profile might not exist yet (trigger not fired or failed)
        if (dbError.code === 'PGRST116') {
          // No rows returned - create profile
          const { data: newProfile, error: createError } = await supabase
            .from('contractors')
            .insert({
              id: user.id,
              email: user.email || '',
            })
            .select()
            .single();

          if (createError) throw createError;
          setContractor(newProfile);
        } else {
          throw dbError;
        }
      } else {
        setContractor(data);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching contractor:', err);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Update contractor profile
  const updateContractor = useCallback(
    async (updates: ContractorUpdate): Promise<boolean> => {
      if (!user) return false;

      try {
        const { data, error: dbError } = await supabase
          .from('contractors')
          .update(updates)
          .eq('id', user.id)
          .select()
          .single();

        if (dbError) throw dbError;

        setContractor(data);
        return true;
      } catch (err) {
        console.error('Error updating contractor:', err);
        setError('Failed to update profile');
        return false;
      }
    },
    [user]
  );

  // Upload logo
  const uploadLogo = useCallback(
    async (file: File): Promise<string | null> => {
      if (!user) return null;

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/logo.${fileExt}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('contractor-logos')
          .upload(fileName, file, {
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('contractor-logos')
          .getPublicUrl(fileName);

        const logoUrl = urlData.publicUrl;

        // Update contractor profile with logo URL
        await updateContractor({ logo_url: logoUrl });

        return logoUrl;
      } catch (err) {
        console.error('Error uploading logo:', err);
        setError('Failed to upload logo');
        return null;
      }
    },
    [user, updateContractor]
  );

  // Remove logo
  const removeLogo = useCallback(async (): Promise<boolean> => {
    if (!user || !contractor?.logo_url) return false;

    try {
      // Extract file path from URL
      const urlParts = contractor.logo_url.split('/');
      const filePath = `${user.id}/${urlParts[urlParts.length - 1]}`;

      // Remove from storage
      const { error: deleteError } = await supabase.storage
        .from('contractor-logos')
        .remove([filePath]);

      if (deleteError) {
        console.error('Error deleting from storage:', deleteError);
        // Continue anyway to clear the URL
      }

      // Update profile
      await updateContractor({ logo_url: null });
      return true;
    } catch (err) {
      console.error('Error removing logo:', err);
      setError('Failed to remove logo');
      return false;
    }
  }, [user, contractor, updateContractor]);

  // Fetch on auth load
  useEffect(() => {
    if (!authLoading) {
      fetchContractor();
    }
  }, [authLoading, fetchContractor]);

  return {
    contractor,
    isLoading: isLoading || authLoading,
    error,
    updateContractor,
    uploadLogo,
    removeLogo,
    refetch: fetchContractor,
  };
}
