'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Estimate } from '@/lib/types';
import { formatCurrency, formatNumber } from '@/lib/calculations';
import { Download, RotateCcw } from 'lucide-react';

interface EstimateDisplayProps {
  estimate: Estimate;
  onReset: () => void;
}

export function EstimateDisplay({ estimate, onReset }: EstimateDisplayProps) {
  const estimateRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!estimateRef.current) return;

    // Dynamically import html2pdf.js (client-side only)
    const html2pdf = (await import('html2pdf.js')).default;

    const element = estimateRef.current;
    const opt = {
      margin: 0.5,
      filename: `roofing-estimate-${estimate.id}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const },
    };

    html2pdf().set(opt).from(element).save();
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
      <Card className="max-w-2xl mx-auto" ref={estimateRef}>
        <CardHeader className="border-b border-border">
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
            <div className="grid grid-cols-2 gap-3 text-sm">
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
              <div className="grid grid-cols-3 gap-4 text-center">
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

      {/* Action buttons - outside the PDF capture area */}
      <div className="flex justify-center gap-4 mt-6">
        <Button variant="outline" onClick={onReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          New Estimate
        </Button>
        <Button onClick={handleDownloadPDF} className="gap-2 bg-accent hover:bg-accent-hover">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}
