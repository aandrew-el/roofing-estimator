import { NextRequest, NextResponse } from 'next/server';
import { getResendClient, DEFAULT_FROM_EMAIL } from '@/lib/resend';
import { EstimateEmail } from '@/emails/EstimateEmail';
import type { Estimate } from '@/lib/types';
import { checkRateLimit, getRateLimitConfig } from '@/lib/rate-limit';
import { getOptionalUser } from '@/lib/api-auth';

interface EmailRequestBody {
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  estimate: Estimate;
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  // Check authentication status for tiered rate limiting
  const { user, isAuthenticated } = await getOptionalUser();

  // Rate limiting - use user ID for authenticated users, IP for anonymous
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             'unknown';

  // Use user ID as identifier if authenticated (more reliable than IP)
  const rateLimitIdentifier = user?.id || ip;
  const rateLimitConfig = getRateLimitConfig('email', isAuthenticated);

  const rateLimitResult = checkRateLimit(rateLimitIdentifier, rateLimitConfig);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please wait before sending another email.' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return NextResponse.json(
        { success: false, error: 'Email service not configured' },
        { status: 503 }
      );
    }

    // Parse request body
    let body: EmailRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Validate required fields
    const { customer, estimate } = body;

    if (!customer?.name || !customer?.email) {
      return NextResponse.json(
        { success: false, error: 'Customer name and email are required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(customer.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (!estimate?.id || !estimate?.project || !estimate?.lineItems) {
      return NextResponse.json(
        { success: false, error: 'Invalid estimate data' },
        { status: 400 }
      );
    }

    // Send email using Resend
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: customer.email,
      subject: `Your Roofing Estimate - ${new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(estimate.midEstimate)}`,
      react: EstimateEmail({
        customerName: customer.name,
        estimate: estimate,
      }),
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
    });

  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
