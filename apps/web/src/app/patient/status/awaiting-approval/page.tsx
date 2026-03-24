import Link from 'next/link';
import { Clock, ArrowRight, FileText } from 'lucide-react';

export default function AwaitingApprovalPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-full bg-[var(--color-surface-low)] flex items-center justify-center mb-6 shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)]/10">
        <Clock className="w-8 h-8 text-[var(--color-primary)]" />
      </div>
      
      <h1 className="text-3xl font-display font-bold text-[var(--color-primary)] mb-3">
        Request Submitted
      </h1>
      
      <p className="text-lg text-[var(--color-on-surface-variant)] max-w-lg mb-8">
        Your assessment request and payment have been received. A clinician will review your request shortly to authorize your session.
      </p>

      <div className="bg-[var(--color-surface-lowest)] rounded-[var(--radius-lg)] shadow-[var(--shadow-ambient)] p-6 max-w-md w-full mb-8 text-left">
        <h3 className="font-medium text-[var(--color-on-surface)] mb-4 flex items-center gap-2 border-b border-[var(--color-outline-variant)]/15 pb-3">
          <FileText className="w-5 h-5 text-[var(--color-on-surface-variant)]" />
          Request Details
        </h3>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--color-on-surface-variant)]">Status</dt>
            <dd className="font-medium text-[var(--color-action)]">Awaiting Approval</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--color-on-surface-variant)]">Date Submitted</dt>
            <dd className="font-medium text-[var(--color-on-surface)]">March 24, 2026</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--color-on-surface-variant)]">Estimated Review</dt>
            <dd className="font-medium text-[var(--color-on-surface)]">1-2 Business Days</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Link 
          href="/patient"
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)]/15 px-8 py-3 text-sm font-semibold text-[var(--color-on-surface)] hover:bg-[var(--color-surface-low)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] transition-all"
        >
          Return to Dashboard
        </Link>
        <Link 
          href="/patient/session/ready"
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] px-8 py-3 text-sm font-semibold text-white shadow-[var(--shadow-ambient)] hover:from-[var(--color-primary-container)] hover:to-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] transition-all"
        >
          Test Approved State <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
