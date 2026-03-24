import Link from 'next/link';
import { PlayCircle, Clock, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ResumeSessionPage() {
  // In a real implementation, these would come from server state/context
  const totalQuestions = 567;
  const answeredQuestions = 142;
  const progressPercentage = Math.round((answeredQuestions / totalQuestions) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/patient" className="p-2 rounded-full hover:bg-[var(--color-surface-low)] transition-colors text-[var(--color-on-surface-variant)]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-[var(--color-primary)]">
            Resume Assessment
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            You have an assessment in progress.
          </p>
        </div>
      </div>

      <div className="bg-[var(--color-surface-lowest)] rounded-[var(--radius-lg)] shadow-[var(--shadow-ambient)] overflow-hidden">
        {/* Header Area */}
        <div className="p-8 border-b border-[var(--color-outline-variant)]/15 text-center">
          <div className="w-20 h-20 rounded-full bg-[var(--color-surface-low)] flex items-center justify-center mx-auto mb-6 shadow-[var(--shadow-ambient)]">
            <Clock className="w-10 h-10 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-2xl font-display font-bold text-[var(--color-primary)] mb-2">
            MMPI-2 Clinical Assessment
          </h2>
          <p className="text-[var(--color-on-surface-variant)] max-w-lg mx-auto">
            Your progress has been securely saved. You may resume your assessment from where you left off.
          </p>
        </div>

        {/* Progress Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--color-outline-variant)]/15 bg-[var(--color-surface)]/50">
          <div className="p-6 flex flex-col items-center text-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-[var(--color-on-surface-variant)]" />
            <h3 className="font-medium text-[var(--color-on-surface)] text-sm">Progress Saved</h3>
            <p className="text-xs text-[var(--color-on-surface-variant)]">{answeredQuestions} of {totalQuestions} statements completed</p>
          </div>
          <div className="p-6 flex flex-col items-center justify-center gap-3">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-xs font-medium text-[var(--color-on-surface-variant)]">
                <span>{progressPercentage}% Complete</span>
                <span>{totalQuestions - answeredQuestions} remaining</span>
              </div>
              <div className="w-full h-2 bg-[var(--color-surface-low)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500 ease-in-out" 
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-8 border-t border-[var(--color-outline-variant)]/15">
          <h3 className="font-medium text-[var(--color-on-surface)] mb-4">Before You Continue</h3>
          <ul className="space-y-3 text-sm text-[var(--color-on-surface-variant)] list-disc list-outside pl-5 mb-8">
            <li>Ensure you still have enough uninterrupted time to complete the remaining statements.</li>
            <li>Remember to answer each statement based on your own perspective.</li>
            <li>Do not overthink your responses; your initial reaction is preferred.</li>
          </ul>

          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Link 
              href="/patient"
              className="inline-flex justify-center rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/15 px-6 py-3 text-sm font-semibold text-[var(--color-on-surface)] hover:bg-[var(--color-surface-low)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] transition-all"
            >
              Return to Dashboard
            </Link>
            <Link
              href="/patient/session/active"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] px-8 py-3 text-sm font-semibold text-white shadow-[var(--shadow-ambient)] hover:from-[var(--color-primary-container)] hover:to-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] transition-all"
            >
              <PlayCircle className="w-4 h-4" />
              Resume Assessment
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
