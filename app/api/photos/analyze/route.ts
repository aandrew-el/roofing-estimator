import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getRateLimitConfig } from '@/lib/rate-limit';
import { getOptionalUser } from '@/lib/api-auth';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AnalyzeRequestBody {
  photoId: string;
  imageUrl: string;
}

interface RoofAnalysis {
  material: string;
  materialConfidence: number;
  condition: string;
  conditionScore: number;
  damageDetected: boolean;
  damageDetails: string[];
  estimatedAreaSqft: number | null;
  ageEstimate: string;
  recommendations: string[];
  overallAssessment: string;
}

const VISION_PROMPT = `You are an expert roofing inspector analyzing a photo of a roof. Analyze this image and provide a detailed assessment.

Return your analysis as a JSON object with the following structure:
{
  "material": "The roofing material type (e.g., 'asphalt shingles', 'metal', 'tile', 'slate', 'wood shake', 'flat/membrane', 'unknown')",
  "materialConfidence": 0.0-1.0 confidence score for material identification,
  "condition": "Overall condition rating: 'excellent', 'good', 'fair', 'poor', or 'critical'",
  "conditionScore": 1-10 numeric score (10 being perfect condition),
  "damageDetected": true or false,
  "damageDetails": ["Array of specific damage observations, e.g., 'Missing shingles in northeast section', 'Visible moss growth'"],
  "estimatedAreaSqft": Estimated roof area in square feet if possible to determine from image, or null if not determinable,
  "ageEstimate": "Estimated age of roof (e.g., '5-10 years', '15-20 years', 'new')",
  "recommendations": ["Array of recommended actions, e.g., 'Schedule professional inspection', 'Clean gutters'"],
  "overallAssessment": "A 2-3 sentence summary of the roof's condition and any urgent concerns"
}

If you cannot see a roof clearly in the image, return:
{
  "material": "unknown",
  "materialConfidence": 0,
  "condition": "unknown",
  "conditionScore": 0,
  "damageDetected": false,
  "damageDetails": [],
  "estimatedAreaSqft": null,
  "ageEstimate": "unknown",
  "recommendations": ["Please upload a clearer image of the roof"],
  "overallAssessment": "Unable to analyze - the image does not clearly show a roof. Please upload a photo that shows the roof surface from a good angle."
}

IMPORTANT: Return ONLY the JSON object, no markdown formatting or additional text.`;

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
  const rateLimitConfig = getRateLimitConfig('photoAnalyze', isAuthenticated);

  const rateLimitResult = checkRateLimit(rateLimitIdentifier, rateLimitConfig);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before analyzing another photo.' },
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
    let body: AnalyzeRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { photoId, imageUrl } = body;

    // Validate input
    if (!photoId || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing photoId or imageUrl' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid image URL' },
        { status: 400 }
      );
    }

    // Update photo status to analyzing
    await supabase
      .from('photos')
      .update({ analysis_status: 'analyzing' })
      .eq('id', photoId);

    // Call GPT-4 Vision
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: VISION_PROMPT },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from Vision API');
    }

    // Parse the JSON response
    let analysis: RoofAnalysis;
    try {
      // Remove any markdown formatting if present
      const jsonContent = content.replace(/```json\n?|\n?```/g, '').trim();
      analysis = JSON.parse(jsonContent);
    } catch {
      throw new Error('Failed to parse Vision API response');
    }

    // Update photo with analysis results
    const { error: updateError } = await supabase
      .from('photos')
      .update({
        analysis_status: 'completed',
        analysis_result: analysis,
        detected_material: analysis.material,
        detected_condition: analysis.condition,
        estimated_area_sqft: analysis.estimatedAreaSqft,
        damage_detected: analysis.damageDetected,
        confidence_score: analysis.materialConfidence,
        analyzed_at: new Date().toISOString(),
      })
      .eq('id', photoId);

    if (updateError) {
      console.error('Failed to update photo:', updateError);
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Photo analysis error:', error);

    // Update photo status to failed
    const body = await request.clone().json().catch(() => ({}));
    if (body.photoId) {
      await supabase
        .from('photos')
        .update({
          analysis_status: 'failed',
          analysis_error: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', body.photoId);
    }

    return NextResponse.json(
      { error: 'Failed to analyze photo' },
      { status: 500 }
    );
  }
}
