import type { ReactNode } from 'react';
import Link from 'next/link';
import { Activity, User, FileText, Settings, LogOut, LayoutDashboard } from 'lucide-react';

export default function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[var(--color-surface-low)] flex-shrink-0 flex flex-col min-h-[4rem] md:min-h-screen relative z-10">
        <div className="p-4 md:p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-primary)] flex items-center justify-center">
            <Activity className="w-5 h-5 text-[var(--color-surface-lowest)]" />
          </div>
          <span className="font-display font-semibold text-lg text-[var(--color-primary)]">
            MMPI-2 Portal
          </span>
        </div>

        <nav className="flex-1 px-4 pb-4 overflow-y-auto flex flex-row md:flex-col gap-1 md:gap-2">
          <Link 
            href="/patient" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface-lowest)] text-[var(--color-primary)] font-medium shadow-sm transition-all"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="hidden md:inline">Dashboard</span>
          </Link>
          
          <Link 
            href="/patient/profile" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-lowest)]/50 hover:text-[var(--color-on-surface)] font-medium transition-all"
          >
            <User className="w-5 h-5" />
            <span className="hidden md:inline">My Profile</span>
          </Link>

          <div className="md:mt-6 hidden md:block">
            <div className="px-3 mb-2 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">
              Assessments
            </div>
            {/* Disabled states for future implementation */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-[var(--color-outline-variant)] font-medium cursor-not-allowed">
              <FileText className="w-5 h-5" />
              <span>Results & Reports</span>
            </div>
          </div>
        </nav>

        <div className="p-4 hidden md:block mt-auto">
          <div className="pt-4 border-t border-[var(--color-outline-variant)]/10">
            <Link 
              href="/patient/settings" 
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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative min-w-0 pb-12 md:pb-0">
        {/* Top Header for mobile */}
        <header className="md:hidden bg-[var(--color-surface-lowest)] h-14 border-b border-[var(--color-outline-variant)]/15 flex items-center px-4 justify-between">
           <span className="font-medium text-[var(--color-on-surface)]">Patient Portal</span>
           <User className="w-6 h-6 text-[var(--color-on-surface-variant)]" />
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
          <div className="max-w-4xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
