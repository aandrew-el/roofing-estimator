import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { PublicEstimateView } from '@/components/PublicEstimateView';
import type { Estimate } from '@/lib/types';
import type { Contractor } from '@/lib/database.types';

// Create a server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PageProps {
  params: Promise<{ token: string }>;
}

interface ContractorBranding {
  companyName: string | null;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  phone: string | null;
  website: string | null;
}

async function getEstimateByToken(token: string): Promise<{
  estimate: Estimate;
  customerName: string | null;
  branding: ContractorBranding | null;
} | null> {
  // Get the share token and related estimate
  const { data: shareToken, error: tokenError } = await supabase
    .from('share_tokens')
    .select('estimate_id, expires_at, view_count')
    .eq('token', token)
    .single();

  if (tokenError || !shareToken) {
    return null;
  }

  // Check if token is expired
  if (shareToken.expires_at && new Date(shareToken.expires_at) < new Date()) {
    return null;
  }

  // Get the estimate with contractor_id
  const { data: estimateRow, error: estimateError } = await supabase
    .from('estimates')
    .select('estimate_data, customer_name, contractor_id')
    .eq('id', shareToken.estimate_id)
    .single();

  if (estimateError || !estimateRow) {
    return null;
  }

  // Get contractor branding if available
  let branding: ContractorBranding | null = null;
  if (estimateRow.contractor_id) {
    const { data: contractor } = await supabase
      .from('contractors')
      .select('company_name, logo_url, primary_color, accent_color, phone, website')
      .eq('id', estimateRow.contractor_id)
      .single();

    if (contractor) {
      branding = {
        companyName: contractor.company_name,
        logoUrl: contractor.logo_url,
        primaryColor: contractor.primary_color || '#0f4c75',
        accentColor: contractor.accent_color || '#3b82f6',
        phone: contractor.phone,
        website: contractor.website,
      };
    }
  }

  // Increment view count (non-blocking)
  supabase
    .from('share_tokens')
    .update({ view_count: (shareToken.view_count || 0) + 1 })
    .eq('token', token)
    .then(() => {});

  return {
    estimate: estimateRow.estimate_data as unknown as Estimate,
    customerName: estimateRow.customer_name,
    branding,
  };
}

export default async function SharePage({ params }: PageProps) {
  const { token } = await params;
  const result = await getEstimateByToken(token);

  if (!result) {
    notFound();
  }

  return (
    <PublicEstimateView
      estimate={result.estimate}
      customerName={result.customerName}
      branding={result.branding}
    />
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const { token } = await params;
  const result = await getEstimateByToken(token);

  if (!result) {
    return {
      title: 'Estimate Not Found',
    };
  }

  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(result.estimate.midEstimate);

  return {
    title: `Roofing Estimate - ${amount}`,
    description: `Roofing estimate for ${result.estimate.project.location}. Estimated cost: ${amount}`,
  };
}
