'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Estimate } from '@/lib/types';
import { formatCurrency, formatNumber } from '@/lib/calculations';
import { Download, Loader2, Phone, Globe, Building2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Validate branding URL - only allows http:// and https:// protocols
 * Prevents javascript:, data:, and other dangerous URL schemes
 */
function isValidBrandingUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate hex color to prevent CSS injection
 */
function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Sanitize color value - returns default if invalid
 */
function sanitizeColor(color: string | null | undefined, defaultColor: string): string {
  if (!color || !isValidHexColor(color)) {
    return defaultColor;
  }
  return color;
}

interface ContractorBranding {
  companyName: string | null;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  phone: string | null;
  website: string | null;
}

interface PublicEstimateViewProps {
  estimate: Estimate;
  customerName: string | null;
  branding?: ContractorBranding | null;
}

export function PublicEstimateView({ estimate, customerName, branding }: PublicEstimateViewProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  // Sanitize branding colors to prevent CSS injection
  const primaryColor = sanitizeColor(branding?.primaryColor, '#0f4c75');
  const accentColor = sanitizeColor(branding?.accentColor, '#3b82f6');
  const companyName = branding?.companyName || 'Roofing Estimator';

  // Validate website URL
  const validatedWebsite = useMemo(() => {
    return isValidBrandingUrl(branding?.website) ? branding?.website : null;
  }, [branding?.website]);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estimate,
          customerName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `roofing-estimate-${estimate.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const formattedDate = new Date(estimate.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const shingleTypeName =
    estimate.project.shingleType === 'three-tab'
      ? '3-Tab Asphalt'
      : estimate.project.shingleType === 'architectural'
      ? 'Architectural'
      : 'Premium Designer';

  return (
    <div className="min-h-screen bg-background">
      {/* Custom CSS variables for branding */}
      <style>{`
        .brand-primary { color: ${primaryColor}; }
        .brand-accent { color: ${accentColor}; }
        .brand-bg-primary { background-color: ${primaryColor}; }
        .brand-bg-accent { background-color: ${accentColor}; }
        .brand-border-primary { border-color: ${primaryColor}; }
      `}</style>

      {/* Header */}
      <header
        className="border-b py-4"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {branding?.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={companyName}
                className="h-10 w-10 rounded-lg object-cover bg-white"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-semibold text-white">{companyName}</h1>
              <p className="text-sm text-white/70">Roofing Estimate</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {branding?.phone && (
              <a
                href={`tel:${branding.phone}`}
                className="hidden sm:flex items-center gap-1 text-sm text-white/90 hover:text-white"
              >
                <Phone className="h-4 w-4" />
                {branding.phone}
              </a>
            )}
            <Button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              size="sm"
              className="gap-2"
              variant="secondary"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Roofing Estimate
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Generated {formattedDate}
                </p>
                {customerName && (
                  <p className="text-sm font-medium mt-2">
                    Prepared for: {customerName}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Estimate ID</p>
                <p className="text-sm font-mono">{estimate.id}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Project Summary */}
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
                Project Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <span className="ml-2 font-medium">{estimate.project.location}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Roof Area:</span>
                  <span className="ml-2 font-medium">
                    {formatNumber(estimate.roofArea)} sq ft
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pitch:</span>
                  <span className="ml-2 font-medium">{estimate.project.pitch}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Material:</span>
                  <span className="ml-2 font-medium">{shingleTypeName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Stories:</span>
                  <span className="ml-2 font-medium">{estimate.project.stories}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Squares:</span>
                  <span className="ml-2 font-medium">{estimate.squares}</span>
                </div>
              </div>
            </div>

            {/* Itemized Breakdown */}
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
                Itemized Breakdown
              </h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Description</th>
                      <th className="text-right px-4 py-2 font-medium">Qty</th>
                      <th className="text-right px-4 py-2 font-medium">Unit</th>
                      <th className="text-right px-4 py-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {estimate.lineItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground">
                              {item.description}
                            </div>
                          )}
                        </td>
                        <td className="text-right px-4 py-3">{item.quantity}</td>
                        <td className="text-right px-4 py-3 text-muted-foreground">
                          {item.unit}
                        </td>
                        <td className="text-right px-4 py-3 font-medium">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 font-semibold text-right">
                        Subtotal
                      </td>
                      <td className="px-4 py-3 font-semibold text-right">
                        {formatCurrency(estimate.subtotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Estimate Range */}
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
                Estimate Range
              </h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Low
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(estimate.lowEstimate)}
                    </p>
                  </div>
                  <div className="border-x border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Expected
                    </p>
                    <p className="text-xl font-bold text-accent">
                      {formatCurrency(estimate.midEstimate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      High
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(estimate.highEstimate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="text-xs text-muted-foreground border-t border-border pt-4">
              <p>
                This estimate is provided for planning purposes only. Actual costs may
                vary based on site inspection, material availability, and local market
                conditions. Please obtain multiple quotes from licensed contractors
                before proceeding with any work.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground space-y-2">
          {validatedWebsite && (
            <p>
              <a
                href={validatedWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
                style={{ color: primaryColor }}
              >
                <Globe className="h-4 w-4" />
                {validatedWebsite.replace(/^https?:\/\//, '')}
              </a>
            </p>
          )}
          <p>
            {branding ? (
              <>Estimate generated by {companyName}</>
            ) : (
              <>
                Powered by{' '}
                <a href="/" className="text-accent hover:underline">
                  Roofing Estimator
                </a>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
