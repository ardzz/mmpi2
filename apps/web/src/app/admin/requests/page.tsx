import Link from 'next/link';
import { CheckCircle, Clock, Filter, Search, ShieldAlert } from 'lucide-react';
import type { AdminRequestQueueItem } from '@mmpi2/contracts';
import { fetchApiAsAdmin } from '../../../lib/api-client';

interface AdminRequestsPageProps {
  searchParams?: Promise<{ q?: string; status?: string }>;
}

function formatRequestedDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export default async function AdminRequestsPage({ searchParams }: AdminRequestsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = resolvedSearchParams.q?.trim() ?? '';
  const status = resolvedSearchParams.status?.trim() ?? '';
  let requests: AdminRequestQueueItem[] = [];

  try {
    const params = new URLSearchParams();
    if (query) {
      params.set('q', query);
    }
    if (status) {
      params.set('status', status);
    }
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    requests = await fetchApiAsAdmin<AdminRequestQueueItem[]>(`/workflow/admin/requests${suffix}`);
  } catch (error) {
    console.error('Failed to load admin request queue:', error);
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-[var(--color-primary)]">Request Queue</h1>
          <p className="text-[var(--color-on-surface-variant)] mt-2">Review and triage persisted operational requests.</p>
        </div>
      </div>

      <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] flex flex-col min-h-[60vh] border border-[var(--color-outline-variant)]/10">
        <div className="p-4 border-b border-[var(--color-outline-variant)]/15 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <form className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-on-surface-variant)]" />
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Search requests by patient or purpose..."
                className="w-full pl-9 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
              />
            </div>
            <label className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-on-surface)]">
              <Filter className="w-4 h-4" />
              <select name="status" defaultValue={status} className="bg-transparent focus:outline-none">
                <option value="">All statuses</option>
                <option value="ready_for_admin_review">Ready for review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
          </form>
        </div>

        {requests.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-10 text-center">
            <div className="max-w-2xl">
              <ShieldAlert className="mx-auto mb-4 h-8 w-8 text-[var(--color-primary)]" />
              <h2 className="text-xl font-display font-semibold text-[var(--color-primary)]">No requests yet</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-on-surface-variant)]">
                The admin queue is now backed by the API. New assessment requests will appear here when patients move
                into the admin review part of the workflow.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-outline-variant)]/15 bg-[var(--color-surface-low)]/50">
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Request</th>
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Patient</th>
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Billing</th>
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Requested</th>
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-b border-[var(--color-outline-variant)]/10 hover:bg-[var(--color-surface-low)]/30 transition-colors">
                    <td className="p-4 text-sm text-[var(--color-on-surface)]">
                      <div className="font-medium text-[var(--color-primary)]">{request.id.slice(0, 8)}</div>
                      <div className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">{request.purpose ?? 'MMPI-2 assessment request'}</div>
                    </td>
                    <td className="p-4 text-sm text-[var(--color-on-surface)]">{request.patientFullName}</td>
                    <td className="p-4 text-sm">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-surface-dim)] text-[var(--color-on-surface)] text-xs font-medium">
                        {request.requestStatus === 'approved' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {request.requestStatus}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[var(--color-on-surface-variant)]">
                      {request.paymentRequirement} · {request.paymentSatisfied ? 'satisfied' : 'pending'}
                    </td>
                    <td className="p-4 text-sm text-[var(--color-on-surface-variant)]">{formatRequestedDate(request.requestedAt)}</td>
                    <td className="p-4 text-sm text-right">
                      <Link
                        href={`/admin/requests/${request.id}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 text-[var(--color-primary)] rounded-[var(--radius-md)] text-xs font-medium hover:bg-[var(--color-surface-low)] transition-colors"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
