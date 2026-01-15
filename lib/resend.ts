import { Resend } from 'resend';

// Lazy initialization of Resend client to avoid build-time errors
let resendClient: Resend | null = null;

export function getResendClient(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Default sender email
// In development, use Resend's test domain: onboarding@resend.dev
// In production, use your verified domain: noreply@yourdomain.com
export const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Roofing Estimator <onboarding@resend.dev>';
