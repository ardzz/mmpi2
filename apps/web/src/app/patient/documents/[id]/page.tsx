import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Download, Printer, Shield, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Report Details | MMPI-2 Platform',
  description: 'View your clinical report details',
};

// Mock data representing the detail payload
const mockDocuments = {
  'doc_101': {
    id: 'doc_101',
    title: 'Comprehensive Evaluation Report',
    type: 'Clinical Report',
    date: 'October 12, 2023',
    provider: 'Dr. Sarah Jenkins',
    status: 'Available',
    summary: 'This report contains the full clinical evaluation following your recent MMPI-2 assessment. It includes scoring validity, clinical scales interpretation, and treatment recommendations.',
    fileSize: '2.4 MB',
    pages: 12,
  },
  'doc_102': {
    id: 'doc_102',
    title: 'MMPI-2 Profile Summary',
    type: 'Assessment Results',
    date: 'October 10, 2023',
    provider: 'Automated Scoring System',
    status: 'Available',
    summary: 'A high-level summary of your T-scores and primary profile elevations. This document is intended for quick reference and does not include the detailed clinical interpretation.',
    fileSize: '1.1 MB',
    pages: 3,
  },
  'doc_103': {
    id: 'doc_103',
    title: 'Initial Intake Notes',
    type: 'Clinical Record',
    date: 'September 28, 2023',
    provider: 'Dr. Sarah Jenkins',
    status: 'Pending Review',
    summary: 'Clinical notes from your initial intake session. These are currently under review by your provider and will be available for download once finalized.',
    fileSize: '--',
    pages: 0,
  }
};

interface DocumentDetailPageProps {
  params: {
    id: string;
  };
}

export default function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const doc = mockDocuments[params.id as keyof typeof mockDocuments];

  if (!doc) {
    notFound();
  }

  const isPending = doc.status === 'Pending Review';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Navigation & Header */}
      <div>
        <Link 
          href="/patient/documents"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-on-surface-variant)] hover:text-[var(--color-action)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Documents
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-surface-low)] text-[var(--color-on-surface-variant)]">
                {doc.type}
              </span>
              {!isPending && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready for viewing
                </span>
              )}
            </div>
            <h1 className="text-3xl font-display font-bold text-[var(--color-primary)]">
              {doc.title}
            </h1>
          </div>
          
          {/* Primary Actions */}
          {!isPending && (
            <div className="flex items-center gap-3 shrink-0">
              <button type="button" className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-lowest)] border-none px-4 py-2.5 text-sm font-semibold text-[var(--color-on-surface)] shadow-[var(--shadow-ambient)] hover:bg-[var(--color-surface-low)] transition-all">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button type="button" className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-ambient)] hover:from-[var(--color-primary-container)] hover:to-[var(--color-primary)] transition-all">
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Document Overview & Placeholder */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[var(--color-surface-lowest)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-ambient)]">
            <h2 className="text-lg font-display font-semibold text-[var(--color-on-surface)] mb-3">
              About this Document
            </h2>
            <p className="text-[var(--color-on-surface-variant)] leading-relaxed">
              {doc.summary}
            </p>
          </div>

          {/* Document Preview Placeholder */}
          <div className="bg-[var(--color-surface-low)] rounded-[var(--radius-lg)] border-none flex flex-col items-center justify-center p-12 min-h-[400px]">
            {isPending ? (
              <div className="text-center max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-full bg-[var(--color-surface-lowest)] flex items-center justify-center mx-auto mb-4 shadow-[var(--shadow-ambient)]">
                  <Shield className="w-8 h-8 text-[var(--color-outline-variant)]" />
                </div>
                <h3 className="font-medium text-[var(--color-on-surface)] mb-2">Document Unavailable</h3>
                <p className="text-sm text-[var(--color-on-surface-variant)]">
                  This document is currently undergoing provider review to ensure accuracy. It will be released to your portal once finalized.
                </p>
              </div>
            ) : (
              <div className="text-center max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-full bg-[var(--color-surface-lowest)] flex items-center justify-center mx-auto mb-4 shadow-[var(--shadow-ambient)]">
                  <FileText className="w-8 h-8 text-[var(--color-primary)] opacity-50" />
                </div>
                <h3 className="font-medium text-[var(--color-on-surface)] mb-2">Preview Not Available</h3>
                <p className="text-sm text-[var(--color-on-surface-variant)] mb-6">
                  For your privacy and security, detailed clinical reports must be downloaded to be viewed in full.
                </p>
                <button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-action)] hover:underline">
                  Download to view full report <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Metadata Sidebar */}
        <div className="space-y-6">
          <div className="bg-[var(--color-surface-lowest)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-ambient)]">
            <h3 className="font-medium text-[var(--color-on-surface)] mb-4">Document Details</h3>
            <div className="space-y-4">
              <div>
                <span className="flex items-center gap-2 text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1">
                  <Calendar className="w-3.5 h-3.5" /> Date Generated
                </span>
                <span className="text-[var(--color-on-surface)]">{doc.date}</span>
              </div>
              <div>
                <span className="flex items-center gap-2 text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1">
                  <User className="w-3.5 h-3.5" /> Provided By
                </span>
                <span className="text-[var(--color-on-surface)]">{doc.provider}</span>
              </div>
              {!isPending && (
                <div>
                  <span className="flex items-center gap-2 text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1">
                    <FileText className="w-3.5 h-3.5" /> File Information
                  </span>
                  <span className="text-[var(--color-on-surface)]">
                    PDF Document • {doc.pages} pages • {doc.fileSize}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-[var(--radius-lg)] p-5">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="text-sm">
                <p className="text-blue-900 dark:text-blue-300 font-medium mb-1">Secure Record</p>
                <p className="text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                  This document is part of your official clinical record. It is encrypted and accessible only to you and authorized providers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
