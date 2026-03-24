'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, LayoutPanelLeft, PenTool, CheckSquare } from 'lucide-react';

export default function CaseLayout({ 
  children,
  params
}: { 
  children: ReactNode;
  params: { id: string };
}) {
  const pathname = usePathname();

  const isWorkstation = pathname.includes('/workstation');
  const isInterpretation = pathname.includes('/interpretation');
  const isFinalize = pathname.includes('/finalize');

  return (
    <div className="flex flex-col min-h-full">
      {/* Case Header & Subnav */}
      <div className="bg-[var(--color-surface-lowest)] border-b border-[var(--color-outline-variant)]/20 px-4 md:px-8 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/doctor/cases"
              className="p-1.5 rounded-full hover:bg-[var(--color-surface-low)] text-[var(--color-on-surface-variant)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-display font-semibold text-[var(--color-primary)]">Case {params.id}</h1>
              <p className="text-xs text-[var(--color-on-surface-variant)]">Patient: John Doe • Submitted: 2 hrs ago</p>
            </div>
          </div>

          <nav className="flex gap-6 border-b border-[var(--color-outline-variant)]/15 -mb-4">
            <Link 
              href={`/doctor/cases/${params.id}/workstation`}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                isWorkstation 
                  ? 'border-[var(--color-action)] text-[var(--color-primary)]' 
                  : 'border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]'
              }`}
            >
              <LayoutPanelLeft className="w-4 h-4" />
              Workstation
            </Link>
            <Link 
              href={`/doctor/cases/${params.id}/interpretation`}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                isInterpretation 
                  ? 'border-[var(--color-action)] text-[var(--color-primary)]' 
                  : 'border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]'
              }`}
            >
              <PenTool className="w-4 h-4" />
              Interpretation
            </Link>
            <Link 
              href={`/doctor/cases/${params.id}/finalize`}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                isFinalize 
                  ? 'border-[var(--color-action)] text-[var(--color-primary)]' 
                  : 'border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              Finalize
            </Link>
          </nav>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </div>
    </div>
  );
}
