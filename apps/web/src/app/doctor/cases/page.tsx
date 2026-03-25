import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Filter,
  Search,
} from 'lucide-react';
import type { DoctorCaseQueueItem } from '@mmpi2/contracts';
import { fetchApiAsDoctor } from '../../../lib/api-client';

interface AssessmentQueuePageProps {
  searchParams?: Promise<{ q?: string }>;
}

function formatRelativeSubmission(date: Date | string | null): string {
  if (date === null) {
    return 'Awaiting submission';
  }

  const submittedAt = new Date(date);
  const diffMs = Date.now() - submittedAt.getTime();
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));

  if (diffHours < 24) {
    return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

export default async function AssessmentQueuePage({ searchParams }: AssessmentQueuePageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = resolvedSearchParams.q?.trim() ?? '';
  let cases: DoctorCaseQueueItem[] = [];

  try {
    const suffix = query ? `?q=${encodeURIComponent(query)}` : '';
    cases = await fetchApiAsDoctor<DoctorCaseQueueItem[]>(`/workflow/doctor/cases${suffix}`);
  } catch (error) {
    console.error('Failed to load doctor case queue:', error);
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-[var(--color-primary)]">Assessment Queue</h1>
        <p className="text-[var(--color-on-surface-variant)] mt-2">Manage and review persisted patient assessments assigned to you.</p>
      </div>

      <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] flex flex-col min-h-[60vh]">
        <div className="p-4 border-b border-[var(--color-outline-variant)]/20 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <form className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-on-surface-variant)]" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by case or patient..."
              className="w-full pl-9 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] text-sm focus:outline-none focus:border-[var(--color-action)] focus:ring-1 focus:ring-[var(--color-action)]"
            />
          </form>
          <button type="button" className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-surface-low)] transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {cases.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-10 text-center">
            <div className="max-w-xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-low)]">
                <FileText className="h-7 w-7 text-[var(--color-outline-variant)]" />
              </div>
              <h2 className="text-xl font-display font-semibold text-[var(--color-primary)]">No assigned cases yet</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-on-surface-variant)]">
                Your doctor queue is now backed by the API. Once an approved request is assigned to your account, it
                will appear here with its latest workflow and validity state.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-outline-variant)]/20 bg-[var(--color-surface-low)]/50">
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Session</th>
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Patient</th>
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Workflow</th>
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Validity</th>
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Submitted</th>
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((item) => {
                  const needsReview = item.validityLabel === 'review_recommended';

                  return (
                    <tr key={item.sessionId} className="border-b border-[var(--color-outline-variant)]/10 hover:bg-[var(--color-surface-low)]/30 transition-colors">
                      <td className="p-4 text-sm font-medium text-[var(--color-primary)]">{item.sessionId.slice(0, 8)}</td>
                      <td className="p-4 text-sm text-[var(--color-on-surface)]">
                        <div className="font-medium">{item.patientFullName}</div>
                        <div className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">{item.purpose ?? 'MMPI-2 clinical review'}</div>
                      </td>
                      <td className="p-4 text-sm">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-[var(--color-surface-dim)] text-[var(--color-on-surface)] text-xs font-medium">
                          {item.sessionStatus}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${needsReview ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                          {needsReview ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          {needsReview ? 'Review Recommended' : item.validityLabel === 'pending' ? 'Pending Score Review' : 'Valid'}
                        </span>
                        {item.validitySummary ? (
                          <div className="mt-1 text-xs text-[var(--color-on-surface-variant)] max-w-52">{item.validitySummary}</div>
                        ) : null}
                      </td>
                      <td className="p-4 text-sm text-[var(--color-on-surface-variant)] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {formatRelativeSubmission(item.submittedAt)}
                      </td>
                      <td className="p-4 text-sm text-right">
                        <Link
                          href={`/doctor/cases/${item.sessionId}/workstation`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--color-primary)] text-[var(--color-surface-lowest)] rounded-[var(--radius-md)] text-xs font-medium hover:bg-[var(--color-primary-container)] transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Review
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
