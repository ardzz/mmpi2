import Link from 'next/link';
import { CheckCircle2, FileText, ArrowRight, LayoutDashboard } from 'lucide-react';

export default function SubmittedSessionPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 md:py-20">
      <div className="bg-[var(--color-surface-lowest)] rounded-[var(--radius-lg)] shadow-[var(--shadow-ambient)] overflow-hidden text-center">
        
        {/* Success Header */}
        <div className="p-12 pb-8">
          <div className="w-24 h-24 rounded-full bg-[var(--color-surface-low)] flex items-center justify-center mx-auto mb-8 shadow-[var(--shadow-ambient)]">
            <CheckCircle2 className="w-12 h-12 text-[var(--color-action)]" />
          </div>
          
          <h1 className="text-3xl font-display font-bold text-[var(--color-primary)] mb-4">
            Assessment Submitted
          </h1>
          
          <p className="text-[var(--color-on-surface-variant)] max-w-md mx-auto text-lg">
            Thank you. Your responses have been securely recorded and are now being processed.
          </p>
        </div>

        {/* Status Info */}
        <div className="mx-8 mb-12 p-6 bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-outline-variant)]/10 text-left">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-[var(--color-surface-lowest)] rounded-full shadow-sm mt-1">
              <FileText className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
            <div>
              <h3 className="font-medium text-[var(--color-on-surface)] mb-1">Scoring in Progress</h3>
              <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed">
                Your assessment is currently being scored by our clinical system. This process usually takes a few minutes. Once complete, your referring clinician will be notified and the results will be available for their review.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-8 border-t border-[var(--color-outline-variant)]/15 bg-[var(--color-surface-low)]/50 flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            href="/patient"
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)]/15 px-6 py-3 text-sm font-semibold text-[var(--color-on-surface)] hover:bg-[var(--color-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] transition-all shadow-sm"
          >
            <LayoutDashboard className="w-4 h-4" />
            Return to Dashboard
          </Link>
          <Link
            href="/patient/requests"
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-ambient)] hover:from-[var(--color-primary-container)] hover:to-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] transition-all"
          >
            View Requests
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
      </div>
    </div>
  );
}
