import Link from 'next/link';
import { PlayCircle, Clock, Shield, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function ReadyToStartPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/patient" className="p-2 rounded-full hover:bg-[var(--color-surface-low)] transition-colors text-[var(--color-on-surface-variant)]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-[var(--color-primary)]">
            Assessment Ready
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            Your MMPI-2 assessment has been approved and is ready to begin.
          </p>
        </div>
      </div>

      <div className="bg-[var(--color-surface-lowest)] rounded-[var(--radius-lg)] shadow-[var(--shadow-ambient)] overflow-hidden">
        {/* Header Area */}
        <div className="p-8 border-b border-[var(--color-outline-variant)]/15 text-center">
          <div className="w-20 h-20 rounded-full bg-[var(--color-surface-low)] flex items-center justify-center mx-auto mb-6 shadow-[var(--shadow-ambient)]">
            <PlayCircle className="w-10 h-10 text-[var(--color-primary)] ml-1" />
          </div>
          <h2 className="text-2xl font-display font-bold text-[var(--color-primary)] mb-2">
            MMPI-2 Clinical Assessment
          </h2>
          <p className="text-[var(--color-on-surface-variant)] max-w-lg mx-auto">
            This assessment contains 567 True/False questions and typically takes 60-90 minutes to complete.
          </p>
        </div>

        {/* Requirements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--color-outline-variant)]/15 bg-[var(--color-surface)]/50">
          <div className="p-6 flex flex-col items-center text-center gap-3">
            <Clock className="w-6 h-6 text-[var(--color-on-surface-variant)]" />
            <h3 className="font-medium text-[var(--color-on-surface)] text-sm">Time Required</h3>
            <p className="text-xs text-[var(--color-on-surface-variant)]">Please ensure you have 60-90 minutes of uninterrupted time.</p>
          </div>
          <div className="p-6 flex flex-col items-center text-center gap-3">
            <Shield className="w-6 h-6 text-[var(--color-on-surface-variant)]" />
            <h3 className="font-medium text-[var(--color-on-surface)] text-sm">Privacy</h3>
            <p className="text-xs text-[var(--color-on-surface-variant)]">Find a quiet, private space where you will not be disturbed.</p>
          </div>
          <div className="p-6 flex flex-col items-center text-center gap-3">
            <AlertTriangle className="w-6 h-6 text-[var(--color-on-surface-variant)]" />
            <h3 className="font-medium text-[var(--color-on-surface)] text-sm">One Sitting</h3>
            <p className="text-xs text-[var(--color-on-surface-variant)]">While progress is saved, it is best to complete in one sitting.</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-8 border-t border-[var(--color-outline-variant)]/15">
          <h3 className="font-medium text-[var(--color-on-surface)] mb-4">Important Instructions</h3>
          <ul className="space-y-3 text-sm text-[var(--color-on-surface-variant)] list-disc list-outside pl-5 mb-8">
            <li>Read each statement and decide whether it is <strong>True</strong> or <strong>False</strong> as applied to you.</li>
            <li>Do not spend too much time on any one statement. Your first reaction is usually the best.</li>
            <li>Answer every statement. If a statement does not apply to you or is something you don't know about, make your best guess.</li>
            <li>Try to give the truest picture of yourself possible. Do not try to answer the way you think others would want you to answer.</li>
          </ul>

          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Link 
              href="/patient"
              className="inline-flex justify-center rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/15 px-6 py-3 text-sm font-semibold text-[var(--color-on-surface)] hover:bg-[var(--color-surface-low)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] transition-all"
            >
              Start Later
            </Link>
            <Link
              href="/patient/session/active"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] px-8 py-3 text-sm font-semibold text-white shadow-[var(--shadow-ambient)] hover:from-[var(--color-primary-container)] hover:to-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] transition-all"
            >
              Begin Assessment
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
