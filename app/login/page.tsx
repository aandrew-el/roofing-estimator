import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';
import { Suspense } from 'react';

function LoginFormFallback() {
  return (
    <div className="w-full max-w-md space-y-6 animate-pulse">
      <div className="h-8 bg-muted rounded w-48 mx-auto" />
      <div className="h-4 bg-muted rounded w-64 mx-auto" />
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-lg">R</span>
        </div>
        <span className="font-semibold text-lg">Roofing Estimator</span>
      </Link>
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
