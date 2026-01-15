'use client';

import { StatsCards } from '@/components/dashboard/StatsCards';
import { useContractor } from '@/hooks/useContractor';

export default function DashboardPage() {
  const { contractor, isLoading } = useContractor();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back{contractor?.company_name ? `, ${contractor.company_name}` : ''}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your roofing estimates
        </p>
      </div>

      <StatsCards />

      {!isLoading && !contractor?.company_name && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-2">Complete Your Profile</h2>
          <p className="text-muted-foreground mb-4">
            Add your company name and logo to personalize your estimates and
            build trust with customers.
          </p>
          <a
            href="/dashboard/branding"
            className="text-primary hover:underline font-medium"
          >
            Set up branding &rarr;
          </a>
        </div>
      )}
    </div>
  );
}
