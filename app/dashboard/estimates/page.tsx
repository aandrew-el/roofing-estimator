'use client';

import Link from 'next/link';
import { EstimatesTable } from '@/components/dashboard/EstimatesTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function EstimatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estimates</h1>
          <p className="text-muted-foreground">
            Manage all your roofing estimates
          </p>
        </div>
        <Link href="/">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Estimate
          </Button>
        </Link>
      </div>

      <EstimatesTable />
    </div>
  );
}
