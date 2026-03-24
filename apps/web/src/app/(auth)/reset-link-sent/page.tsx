import Link from 'next/link';
import { MailCheck } from 'lucide-react';

export default function ResetLinkSentPage() {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-low)] mb-4">
        <MailCheck className="h-6 w-6 text-[var(--color-action)]" />
      </div>
      <h2 className="mb-2 font-display text-2xl font-bold tracking-tight text-[var(--color-primary)]">
        Check your email
      </h2>
      <p className="mb-6 text-sm text-[var(--color-on-surface-variant)]">
        We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
      </p>
      
      <div className="space-y-4">
        <Link
          href="/login"
          className="flex w-full justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)]/15 px-3 py-2 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-surface-low)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] transition-all"
        >
          Return to sign in
        </Link>
        
        <p className="text-sm text-[var(--color-on-surface-variant)]">
          Didn't receive the email?{' '}
          <Link href="/forgot-password" className="font-medium text-[var(--color-action)] hover:text-[var(--color-primary)] transition-colors">
            Try again
          </Link>
        </p>
      </div>
    </div>
  );
}
