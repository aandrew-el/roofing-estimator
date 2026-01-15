'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useContractor } from '@/hooks/useContractor';
import {
  LayoutDashboard,
  Palette,
  FileText,
  ArrowLeft,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: LayoutDashboard,
  },
  {
    href: '/dashboard/branding',
    label: 'Branding',
    icon: Palette,
  },
  {
    href: '/dashboard/estimates',
    label: 'Estimates',
    icon: FileText,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { contractor } = useContractor();

  return (
    <div className="w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          {contractor?.logo_url ? (
            <img
              src={contractor.logo_url}
              alt={contractor.company_name || 'Logo'}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm truncate">
              {contractor?.company_name || 'Your Company'}
            </h2>
            <p className="text-xs text-muted-foreground">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3',
                  isActive
                    ? 'bg-sidebar-item-active text-sidebar-text'
                    : 'text-sidebar-text-muted hover:bg-sidebar-item-hover hover:text-sidebar-text'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Back to app */}
      <div className="p-3 border-t border-sidebar-border">
        <Link href="/">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-text-muted hover:text-sidebar-text"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Estimator
          </Button>
        </Link>
      </div>
    </div>
  );
}
