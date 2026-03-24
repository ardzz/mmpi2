import Link from 'next/link';
import { FileText, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function PatientDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-[var(--color-primary)]">
          Welcome, Alex
        </h1>
        <p className="mt-2 text-[var(--color-on-surface-variant)] text-lg">
          Manage your clinical assessments and view your results.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Next Action Card (Tonal Layering - High Importance) */}
        <div className="md:col-span-2 bg-[var(--color-surface-lowest)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-ambient)]">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--color-surface-low)] flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-[var(--color-action)]" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-xl text-[var(--color-primary)] mb-1">
                  Ready for Assessment
                </h3>
                <p className="text-[var(--color-on-surface-variant)] mb-4 max-w-md">
                  Your profile is complete. You can now request a new MMPI-2 assessment session.
                </p>
              </div>
            </div>
          </div>
          <div className="pl-16">
            <Link 
              href="/patient/requests/new"
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-ambient)] hover:from-[var(--color-primary-container)] hover:to-[var(--color-primary)] transition-all"
            >
              Request Assessment <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Status Summary Card */}
        <div className="bg-[var(--color-surface-lowest)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-ambient)]">
          <h3 className="font-medium text-[var(--color-on-surface)] mb-4">Your Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-on-surface-variant)]">Assessments taken</span>
              <span className="font-semibold text-[var(--color-on-surface)]">0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-on-surface-variant)]">Active requests</span>
              <span className="font-semibold text-[var(--color-on-surface)]">0</span>
            </div>
            <div className="pt-4 border-t border-[var(--color-outline-variant)]/15">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-surface-low)] text-[var(--color-on-surface-variant)]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Account active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent History / Placeholder List */}
      <div>
        <h2 className="text-xl font-display font-semibold text-[var(--color-primary)] mb-4">
          Assessment History
        </h2>
        <div className="bg-[var(--color-surface-lowest)] rounded-[var(--radius-lg)] shadow-[var(--shadow-ambient)] overflow-hidden">
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-surface-low)] flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-[var(--color-outline-variant)]" />
            </div>
            <h3 className="font-medium text-[var(--color-on-surface)] mb-1">No assessments yet</h3>
            <p className="text-sm text-[var(--color-on-surface-variant)] max-w-sm mx-auto">
              Once you have requested and completed an assessment, your results and history will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
