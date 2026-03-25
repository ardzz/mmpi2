import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Download, Shield, UserRound } from 'lucide-react';
import type {
  PatientDocumentDetail,
  PatientDocumentDownload,
} from '@mmpi2/contracts';
import { fetchApi } from '../../../../lib/api-client';

export const metadata = {
  title: 'Report Details | MMPI-2 Platform',
  description: 'View your clinical report details',
};

interface DocumentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

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

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  let document: PatientDocumentDetail | null = null;
  let download: PatientDocumentDownload | null = null;
  try {
    document = await fetchApi<PatientDocumentDetail>(`/workflow/patient/documents/${id}`);
    if (document.hasDownload) {
      download = await fetchApi<PatientDocumentDownload>(`/workflow/patient/documents/${id}/download`);
    }
  } catch (error) {
    console.error('Failed to load patient document detail:', error);
  }

  if (document === null) {
    notFound();
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <Link
          href="/patient/documents"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-on-surface-variant)] hover:text-[var(--color-action)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Documents
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-[var(--color-primary)]">{document.title}</h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--color-on-surface-variant)]">
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

          {download ? (
            <a
              href={`data:${download.contentType};base64,${download.bodyBase64}`}
              download={download.fileName}
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 px-4 py-2.5 text-sm font-semibold text-[var(--color-on-surface)] shadow-[var(--shadow-ambient)]"
            >
              <Download className="w-4 h-4" />
              Download report
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 px-4 py-2.5 text-sm font-semibold text-[var(--color-on-surface)] shadow-[var(--shadow-ambient)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Download pending
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[var(--color-surface-lowest)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-ambient)]">
            <h2 className="text-lg font-display font-semibold text-[var(--color-on-surface)] mb-3">
              Interpretation summary
            </h2>
            <p className="text-[var(--color-on-surface-variant)] leading-relaxed">
              {document.interpretationSummary ?? 'No summary was attached to this published report.'}
            </p>
          </div>

          <div className="bg-[var(--color-surface-lowest)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-ambient)]">
            <h2 className="text-lg font-display font-semibold text-[var(--color-on-surface)] mb-3">
              Narrative report
            </h2>
            <p className="text-[var(--color-on-surface-variant)] leading-relaxed whitespace-pre-line">
              {document.narrative ?? 'No narrative body was attached to this published report.'}
            </p>
          </div>

          {document.supplementalObservations ? (
            <div className="bg-[var(--color-surface-lowest)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-ambient)]">
              <h2 className="text-lg font-display font-semibold text-[var(--color-on-surface)] mb-3">
                Supplemental observations
              </h2>
              <pre className="whitespace-pre-wrap text-sm text-[var(--color-on-surface-variant)] font-sans leading-relaxed">
                {JSON.stringify(document.supplementalObservations, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="bg-[var(--color-surface-lowest)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-ambient)]">
            <h3 className="font-medium text-[var(--color-on-surface)] mb-4">Document details</h3>
            <div className="space-y-3 text-sm text-[var(--color-on-surface-variant)]">
              <p>
                Session reference: <span className="font-medium text-[var(--color-on-surface)]">{document.examSessionId}</span>
              </p>
              <p>
                Report status: <span className="font-medium text-[var(--color-on-surface)]">{document.reportStatus}</span>
              </p>
              {document.amendedFromId ? (
                <p>
                  Amended from: <span className="font-medium text-[var(--color-on-surface)]">{document.amendedFromId}</span>
                </p>
              ) : null}
            </div>
          </div>

          <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-[var(--radius-lg)] p-5">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="text-sm">
                <p className="text-blue-900 dark:text-blue-300 font-medium mb-1">Secure Record</p>
                <p className="text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                  This document is part of your official clinical record and is only visible to you and authorized
                  clinicians.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
