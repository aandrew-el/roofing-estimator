'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { useContractor } from '@/hooks/useContractor';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LayoutDashboard, Palette, FileText, LogOut } from 'lucide-react';

export function UserMenu() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { contractor } = useContractor();

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const displayName = contractor?.company_name || user.email?.split('@')[0] || 'User';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          {contractor?.logo_url ? (
            <img
              src={contractor.logo_url}
              alt={displayName}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
              <User className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
          <span className="hidden sm:inline max-w-[120px] truncate">
            {displayName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/dashboard')}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/dashboard/branding')}>
          <Palette className="mr-2 h-4 w-4" />
          Branding
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/dashboard/estimates')}>
          <FileText className="mr-2 h-4 w-4" />
          Estimates
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
