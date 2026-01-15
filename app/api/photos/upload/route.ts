import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getRateLimitConfig } from '@/lib/rate-limit';
import { getOptionalUser } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Magic bytes for image validation
const IMAGE_SIGNATURES = {
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46], // "RIFF" - WebP starts with RIFF
};

/**
 * Validate image by checking magic bytes, not just MIME type
 */
function validateImageContent(buffer: Uint8Array, mimeType: string): boolean {
  if (buffer.length < 12) return false;

  // Check JPEG signature
  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }

  // Check PNG signature
  if (mimeType === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  }

  // Check WebP signature (RIFF....WEBP)
  if (mimeType === 'image/webp') {
    const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    return isRiff && isWebp;
  }

  return false;
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
  const rateLimitConfig = getRateLimitConfig('photoUpload', isAuthenticated);

  const rateLimitResult = checkRateLimit(rateLimitIdentifier, rateLimitConfig);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many uploads. Please wait before uploading another photo.' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const conversationId = formData.get('conversationId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const storagePath = `${timestamp}-${randomId}.${ext}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Validate file content by checking magic bytes (prevents MIME type spoofing)
    if (!validateImageContent(buffer, file.type)) {
      return NextResponse.json(
        { error: 'Invalid file content. The file does not appear to be a valid image.' },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('roof-photos')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('roof-photos')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Create photo record in database
    const { data: photoRecord, error: dbError } = await supabase
      .from('photos')
      .insert({
        conversation_id: conversationId || null,
        storage_path: storagePath,
        public_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        analysis_status: 'pending',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Try to clean up the uploaded file
      await supabase.storage.from('roof-photos').remove([storagePath]);
      return NextResponse.json(
        { error: 'Failed to save photo record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      photo: {
        id: photoRecord.id,
        publicUrl,
        fileName: file.name,
        fileSize: file.size,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}
