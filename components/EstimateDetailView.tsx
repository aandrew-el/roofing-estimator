'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatNumber } from '@/lib/calculations';
import { useShareLink } from '@/hooks/useShareLink';
import { Download, Loader2, Share2, Copy, Check, ExternalLink, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Estimate } from '@/lib/types';

interface EstimateDetailViewProps {
  estimateId: string;
  onBack: () => void;
}

export function EstimateDetailView({ estimateId, onBack }: EstimateDetailViewProps) {
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);

  const { createShareLink } = useShareLink();

  // Fetch estimate data
  useEffect(() => {
    async function fetchEstimate() {
      try {
        const { data, error } = await supabase
          .from('estimates')
          .select('estimate_data, customer_name')
          .eq('id', estimateId)
          .single();

        if (error) throw error;

        if (data?.estimate_data) {
          setEstimate(data.estimate_data as unknown as Estimate);
          setCustomerName(data.customer_name);
        }
      } catch (err) {
        console.error('Error fetching estimate:', err);
        toast.error('Failed to load estimate');
      } finally {
        setIsLoading(false);
      }
    }

    fetchEstimate();
  }, [estimateId]);

  const handleShare = async () => {
    setShowShareDialog(true);
    setIsGeneratingLink(true);

    try {
      const result = await createShareLink(estimateId);
      if (result) {
        setShareUrl(result.url);
      } else {
        throw new Error('Failed to create share link');
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to generate share link. Please try again.');
      setShowShareDialog(false);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPDF = async () => {
    if (!estimate) return;

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
      toast.success('PDF downloaded');
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Estimate not found</p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

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
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-2xl mx-auto">
        {/* Back button and actions */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Estimates
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="gap-2 bg-accent hover:bg-accent-hover"
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

        {/* Customer name if available */}
        {customerName && (
          <p className="text-sm text-muted-foreground mb-4">
            Prepared for: <span className="font-medium text-foreground">{customerName}</span>
          </p>
        )}

        {/* Estimate Card */}
        <Card className="shadow-lg">
          <CardHeader className="border-b border-border/50">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Roofing Estimate
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Generated {formattedDate}
                </p>
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
              <div className="border border-border/50 rounded-xl overflow-hidden">
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

        {/* Share Dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share Estimate</DialogTitle>
              <DialogDescription>
                Anyone with this link can view the estimate.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {isGeneratingLink ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : shareUrl ? (
                <>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={shareUrl}
                      className="flex-1 text-sm"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleCopyLink}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => window.open(shareUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in New Tab
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
