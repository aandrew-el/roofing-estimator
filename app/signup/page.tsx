import { SignupForm } from '@/components/auth/SignupForm';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-lg">R</span>
        </div>
        <span className="font-semibold text-lg">Roofing Estimator</span>
      </Link>
      <SignupForm />
    </div>
  );
}
