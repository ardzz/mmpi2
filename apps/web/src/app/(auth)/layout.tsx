import type { ReactNode } from 'react';
import Link from 'next/link';
import { Activity } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary)] flex items-center justify-center shadow-[var(--shadow-ambient)] group-hover:bg-[var(--color-action)] transition-colors">
              <Activity className="w-6 h-6 text-[var(--color-surface-lowest)]" />
            </div>
            <span className="font-display font-semibold text-xl tracking-tight text-[var(--color-primary)]">
              MMPI-2 Platform
            </span>
          </Link>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[var(--color-surface-lowest)] py-8 px-4 shadow-[var(--shadow-ambient)] sm:rounded-[var(--radius-lg)] sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
