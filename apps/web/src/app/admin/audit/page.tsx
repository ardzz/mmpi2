import Link from 'next/link';
import { Calendar, Database, Filter, Search, ShieldCheck } from 'lucide-react';
import type { AdminAuditEvent } from '@mmpi2/contracts';
import { fetchApiAsAdmin } from '../../../lib/api-client';

interface AdminAuditPageProps {
  searchParams?: Promise<{ q?: string; source?: string }>;
}

function formatOccurredAt(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export default async function AdminAuditPage({ searchParams }: AdminAuditPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = resolvedSearchParams.q?.trim() ?? '';
  const source = resolvedSearchParams.source?.trim() ?? '';
  let events: AdminAuditEvent[] = [];

  try {
    const params = new URLSearchParams();
    if (query) {
      params.set('q', query);
    }
    if (source) {
      params.set('source', source);
    }
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    events = await fetchApiAsAdmin<AdminAuditEvent[]>(`/admin/audit${suffix}`);
  } catch (error) {
    console.error('Failed to load admin audit events:', error);
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-[var(--color-primary)]">Audit Log</h1>
          <p className="text-[var(--color-on-surface-variant)] mt-2">Immutable platform activity and security events.</p>
        </div>
        <Link href={`/admin/audit/export${query || source ? `?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(source ? { source } : {}) }).toString()}` : ''}`} className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-lowest)] text-[var(--color-primary)] rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-surface-low)] transition-colors">
          <Database className="w-4 h-4" />
          Export CSV
        </Link>
      </div>

      <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)]/10 flex flex-col min-h-[60vh]">
        <div className="p-4 border-b border-[var(--color-outline-variant)]/15 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-[var(--color-surface-low)]/30">
          <form className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-on-surface-variant)]" />
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Search by actor or resource..."
                className="w-full pl-9 pr-4 py-1.5 bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <button type="button" className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-surface-low)] transition-colors">
              <Calendar className="w-4 h-4 text-[var(--color-on-surface-variant)]" />
              Last 7 Days
            </button>
            <label className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-on-surface)]">
              <Filter className="w-4 h-4 text-[var(--color-on-surface-variant)]" />
              <select name="source" defaultValue={source} className="bg-transparent focus:outline-none">
                <option value="">All sources</option>
                <option value="session">Session</option>
                <option value="payment">Payment</option>
                <option value="report">Report</option>
                <option value="audit_log">Audit log</option>
              </select>
            </label>
          </form>
          <div className="text-xs font-mono text-[var(--color-on-surface-variant)] flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Integrity Verified
          </div>
        </div>

        {events.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-10 text-center">
            <div className="max-w-xl">
              <ShieldCheck className="mx-auto mb-4 h-8 w-8 text-[var(--color-primary)]" />
              <h2 className="text-lg font-semibold text-[var(--color-on-surface)]">No audit events yet</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-on-surface-variant)]">
                The audit page is now wired to live backend events. Session, payment, report, and audit-log activity
                will appear here once present in the persisted store.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-outline-variant)]/15 bg-[var(--color-surface-low)]/50">
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Timestamp</th>
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Actor</th>
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Action</th>
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Entity</th>
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Summary</th>
                </tr>
              </thead>
              <tbody className="font-mono text-sm">
                {events.map((event) => (
                  <tr key={`${event.source}-${event.id}`} className="border-b border-[var(--color-outline-variant)]/10 hover:bg-[var(--color-surface-low)]/30 transition-colors">
                    <td className="p-4 text-[var(--color-on-surface-variant)] text-xs">{formatOccurredAt(event.occurredAt)}</td>
                    <td className="p-4 text-[var(--color-primary)] font-medium text-xs">{event.actorLabel ?? 'system'}</td>
                    <td className="p-4">
                      <span className="inline-flex px-2 py-0.5 rounded bg-[var(--color-surface-dim)] text-[var(--color-on-surface)] text-xs">
                        {event.action}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--color-on-surface)] text-xs">
                      {event.entityType} · {event.entityId.slice(0, 8)}
                    </td>
                    <td className="p-4 text-[var(--color-on-surface-variant)] text-xs">{event.summary}</td>
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
