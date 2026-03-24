import type { ReactNode } from 'react';
import Link from 'next/link';
import { Stethoscope, ClipboardList, Settings, LogOut, CheckCircle } from 'lucide-react';

export default function DoctorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-[var(--color-surface-low)] flex-shrink-0 flex flex-col min-h-[4rem] md:min-h-screen relative z-10 border-r border-[var(--color-outline-variant)]/20">
        <div className="p-4 md:p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-primary)] flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-[var(--color-surface-lowest)]" />
          </div>
          <span className="font-display font-semibold text-lg text-[var(--color-primary)]">
            Clinical Workspace
          </span>
        </div>

        <nav className="flex-1 px-4 pb-4 overflow-x-auto md:overflow-y-auto flex flex-row md:flex-col gap-1 md:gap-2">
          <Link 
            href="/doctor/cases" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface-lowest)] text-[var(--color-primary)] font-medium shadow-[var(--shadow-ambient)] transition-all flex-shrink-0"
          >
            <ClipboardList className="w-5 h-5" />
            <span className="md:inline">Assessment Queue</span>
          </Link>
          
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-[var(--color-on-surface-variant)] opacity-50 cursor-not-allowed font-medium transition-all flex-shrink-0">
            <CheckCircle className="w-5 h-5" />
            <span className="md:inline">Completed Cases</span>
          </div>
        </nav>

        <div className="p-4 hidden md:block mt-auto">
          <div className="pt-4 border-t border-[var(--color-outline-variant)]/15">
            <Link 
              href="/doctor/settings" 
              className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-all"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Link>
            <button type="button" className="w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-all mt-1">
              <LogOut className="w-5 h-5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative min-w-0 pb-12 md:pb-0 h-[100dvh] overflow-hidden">
        <header className="md:hidden bg-[var(--color-surface-lowest)] h-14 border-b border-[var(--color-outline-variant)]/15 flex items-center px-4 justify-between flex-shrink-0">
           <span className="font-medium text-[var(--color-on-surface)]">Clinical Workspace</span>
        </header>

        <div className="flex-1 overflow-y-auto bg-[var(--color-surface)]">
          {children}
        </div>
      </main>
    </div>
  );
}
