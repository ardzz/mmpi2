import Link from 'next/link';
import { ArrowRight, Calendar, FileText, UserRound } from 'lucide-react';
import type { PatientDocumentSummary } from '@mmpi2/contracts';
import { fetchApi } from '../../../lib/api-client';

export const metadata = {
  title: 'Documents & Reports | MMPI-2 Platform',
  description: 'View and download your clinical reports and assessment results',
};

function formatPublishedDate(date: Date | string | null): string {
  if (date === null) {
    return 'Pending publication';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export default async function DocumentsHubPage() {
  let documents: PatientDocumentSummary[] = [];

  try {
    documents = await fetchApi<PatientDocumentSummary[]>('/workflow/patient/documents');
  } catch (error) {
    console.error('Failed to load patient documents:', error);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-[var(--color-primary)]">Documents & Reports</h1>
        <p className="mt-2 text-[var(--color-on-surface-variant)] text-lg max-w-2xl">
          Access the reports your clinician has released to your patient record.
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="bg-[var(--color-surface-lowest)] rounded-[var(--radius-lg)] shadow-[var(--shadow-ambient)] overflow-hidden">
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-surface-low)] flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-[var(--color-outline-variant)]" />
            </div>
            <h3 className="font-medium text-[var(--color-on-surface)] mb-2">No released documents yet</h3>
            <p className="text-sm text-[var(--color-on-surface-variant)] max-w-xl mx-auto leading-relaxed">
              Published reports will appear here once your clinician completes review and releases them to your
              patient portal.
            </p>
            <Link
              href="/patient"
              className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-ambient)] hover:from-[var(--color-primary-container)] hover:to-[var(--color-primary)] transition-all"
            >
              Return to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((document) => (
            <Link
              key={document.id}
              href={`/patient/documents/${document.id}`}
              className="block rounded-[var(--radius-lg)] bg-[var(--color-surface-lowest)] p-6 shadow-[var(--shadow-ambient)] transition-all hover:bg-[var(--color-surface-low)]"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-on-surface-variant)]">
                      Clinical report
                    </p>
                    <h2 className="mt-1 text-xl font-display font-semibold text-[var(--color-primary)]">
                      {document.title}
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-[var(--color-on-surface-variant)]">
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatPublishedDate(document.publishedAt)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <UserRound className="h-4 w-4" />
                      {document.authorName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    Published
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-action)]">
                    Open document <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
