import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { EstimatePDF } from '@/lib/pdf/EstimatePDF';
import type { Estimate } from '@/lib/types';
import { checkRateLimit, getRateLimitConfig } from '@/lib/rate-limit';
import { getOptionalUser } from '@/lib/api-auth';

interface PDFRequestBody {
  estimate: Estimate;
  customerName?: string;
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
  const rateLimitConfig = getRateLimitConfig('pdf', isAuthenticated);

  const rateLimitResult = checkRateLimit(rateLimitIdentifier, rateLimitConfig);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before generating another PDF.' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  try {
    // Parse request body
    let body: PDFRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { estimate, customerName } = body;

    // Validate estimate
    if (!estimate?.id || !estimate?.project || !estimate?.lineItems) {
      return NextResponse.json(
        { error: 'Invalid estimate data' },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      <EstimatePDF estimate={estimate} customerName={customerName} />
    );

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer);

    // Return PDF as response
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="roofing-estimate-${estimate.id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
