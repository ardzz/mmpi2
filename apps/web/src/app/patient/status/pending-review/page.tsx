import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function PendingReviewPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-full bg-[var(--color-surface-low)] flex items-center justify-center mb-6 shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)]/10">
        <AlertCircle className="w-8 h-8 text-[var(--color-action)]" />
      </div>
      
      <h1 className="text-3xl font-display font-bold text-[var(--color-primary)] mb-3">
        Clinical Review Required
      </h1>
      
      <p className="text-lg text-[var(--color-on-surface-variant)] max-w-lg mb-8">
        Your assessment is currently paused pending a routine clinical review. This is a standard procedure to ensure all requirements are met before proceeding.
      </p>

      <div className="bg-[var(--color-surface-lowest)] rounded-[var(--radius-lg)] shadow-[var(--shadow-ambient)] p-6 max-w-md w-full mb-8 text-left">
        <h3 className="font-medium text-[var(--color-on-surface)] mb-2">What happens next?</h3>
        <p className="text-sm text-[var(--color-on-surface-variant)] mb-4">
          A clinician will review your file and either authorize you to continue or contact you if additional information is needed. You will be notified via email once the review is complete.
        </p>
        <div className="bg-[var(--color-surface-low)] rounded-[var(--radius-md)] p-4 text-sm text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/10">
          <span className="font-medium">Current Status:</span> Pending manual review
        </div>
      </div>

      <Link 
        href="/patient"
        className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)]/15 px-8 py-3 text-sm font-semibold text-[var(--color-on-surface)] hover:bg-[var(--color-surface-low)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  );
}
