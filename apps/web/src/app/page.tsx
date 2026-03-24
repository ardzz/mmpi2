import Link from 'next/link';
import { Activity, Shield, ClipboardCheck, Lock } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)]">
      {/* Header */}
      <header className="bg-[var(--color-surface-lowest)] border-b border-[var(--color-outline-variant)]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-primary)] flex items-center justify-center">
              <Activity className="w-5 h-5 text-[var(--color-surface-lowest)]" />
            </div>
            <span className="font-display font-semibold text-lg text-[var(--color-primary)]">
              MMPI-2 Platform
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-action)] transition-colors"
            >
              Sign in
            </Link>
            <Link 
              href="/register" 
              className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-primary-container)] transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col">
        <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-[var(--color-primary)] tracking-tight max-w-4xl mx-auto">
            Professional clinical assessment, delivered securely.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-[var(--color-on-surface-variant)] max-w-2xl mx-auto">
            A trusted platform for completing your requested MMPI-2 evaluation. 
            Designed for clarity, privacy, and clinical precision.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/register" 
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] px-8 py-3.5 text-base font-semibold text-white shadow-[var(--shadow-ambient)] hover:from-[var(--color-primary-container)] hover:to-[var(--color-primary)] transition-all"
            >
              Start Assessment
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)]/15 px-8 py-3.5 text-base font-semibold text-[var(--color-primary)] hover:bg-[var(--color-surface-low)] transition-all"
            >
              Resume Session
            </Link>
          </div>
        </section>

        {/* Feature grid */}
        <section className="bg-[var(--color-surface-lowest)] border-t border-[var(--color-outline-variant)]/15 py-16 lg:py-24 flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--color-surface-low)] flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-[var(--color-action)]" />
                </div>
                <h3 className="text-xl font-display font-semibold text-[var(--color-primary)] mb-2">
                  Clinically Validated
                </h3>
                <p className="text-[var(--color-on-surface-variant)]">
                  Administered strictly adhering to official testing protocols and scoring methodologies.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--color-surface-low)] flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-[var(--color-action)]" />
                </div>
                <h3 className="text-xl font-display font-semibold text-[var(--color-primary)] mb-2">
                  HIPAA Compliant
                </h3>
                <p className="text-[var(--color-on-surface-variant)]">
                  Your data is encrypted end-to-end and stored securely in our isolated clinical vault.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--color-surface-low)] flex items-center justify-center mb-4">
                  <ClipboardCheck className="w-6 h-6 text-[var(--color-action)]" />
                </div>
                <h3 className="text-xl font-display font-semibold text-[var(--color-primary)] mb-2">
                  Clear Workflow
                </h3>
                <p className="text-[var(--color-on-surface-variant)]">
                  Step-by-step guidance, autosaving progress, and straightforward result delivery to your clinician.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[var(--color-surface-lowest)] py-8 border-t border-[var(--color-outline-variant)]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-[var(--color-on-surface-variant)]">
          <p>&copy; {new Date().getFullYear()} MMPI-2 Clinical Assessment Platform. For authorized clinical use only.</p>
        </div>
      </footer>
    </div>
  );
}
