import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';
import type { User } from '@supabase/supabase-js';

/**
 * Authentication helper for API routes
 * Provides optional or required authentication checks
 */

interface AuthResult {
  user: User | null;
  isAuthenticated: boolean;
}

/**
 * Get current user from API route context (optional auth)
 * Returns user if authenticated, null otherwise
 * Use this when auth is optional but you want to know if user is logged in
 */
export async function getOptionalUser(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore - can happen in read-only contexts
            }
          },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { user: null, isAuthenticated: false };
    }

    return { user, isAuthenticated: true };
  } catch {
    return { user: null, isAuthenticated: false };
  }
}

/**
 * Require authentication for an API route
 * Returns user if authenticated, throws error response if not
 * Use this when auth is required
 */
export async function requireAuth(): Promise<{ user: User; error: null } | { user: null; error: Response }> {
  const { user, isAuthenticated } = await getOptionalUser();

  if (!isAuthenticated || !user) {
    return {
      user: null,
      error: new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      ),
    };
  }

  return { user, error: null };
}

/**
 * Validate a redirect URL to prevent open redirect attacks
 * Only allows relative paths starting with /
 * Rejects absolute URLs, protocol-relative URLs, and dangerous protocols
 */
export function isValidRedirectUrl(url: string): boolean {
  // Must be a string
  if (typeof url !== 'string') return false;

  // Must start with /
  if (!url.startsWith('/')) return false;

  // Must not be protocol-relative (//evil.com)
  if (url.startsWith('//')) return false;

  // Must not contain protocol
  if (url.includes('://')) return false;

  // Must not contain newlines (header injection)
  if (url.includes('\n') || url.includes('\r')) return false;

  // Must not contain backslashes (some browsers treat \\ as //)
  if (url.includes('\\')) return false;

  return true;
}

/**
 * Sanitize a redirect URL - returns safe default if invalid
 */
export function sanitizeRedirectUrl(url: string | null, defaultUrl: string = '/dashboard'): string {
  if (!url) return defaultUrl;
  return isValidRedirectUrl(url) ? url : defaultUrl;
}

/**
 * Validate a URL for branding (website field)
 * Only allows http:// and https:// URLs
 */
export function isValidBrandingUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
