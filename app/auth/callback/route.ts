import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sanitizeRedirectUrl } from '@/lib/api-auth';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // Sanitize the redirect URL to prevent open redirect attacks
  const next = sanitizeRedirectUrl(searchParams.get('next'), '/dashboard');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
