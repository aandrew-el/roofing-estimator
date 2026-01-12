'use client';

import { useState, useEffect } from 'react';
import { getSessionId } from '@/lib/session';

/**
 * Hook to get the session ID
 * Handles SSR by returning empty string until client-side hydration
 */
export function useSession() {
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = getSessionId();
    setSessionId(id);
    setIsLoading(false);
  }, []);

  return { sessionId, isLoading };
}
