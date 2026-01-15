'use client';

import { useState, useEffect } from 'react';
import { getSessionId } from '@/lib/session';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook to get the session ID
 * Returns contractorId if authenticated, otherwise falls back to localStorage sessionId
 * This allows authenticated users to access their data across devices
 */
export function useSession() {
  const { user, isLoading: authLoading } = useAuth();
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    // Get localStorage session ID (for anonymous users)
    const id = getSessionId();
    setSessionId(id);
    setIsLoading(false);
  }, [authLoading]);

  // If authenticated, return user ID as the contractor ID
  const contractorId = user?.id || null;

  return {
    sessionId,
    contractorId,
    isAuthenticated: !!user,
    isLoading: isLoading || authLoading,
  };
}
