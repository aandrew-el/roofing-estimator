'use client';

import { BrandingForm } from '@/components/dashboard/BrandingForm';

export default function BrandingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Branding</h1>
        <p className="text-muted-foreground">
          Customize your company branding for shared estimates
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <BrandingForm />
      </div>
    </div>
  );
}
