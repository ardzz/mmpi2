import Link from 'next/link';
import { Search, Filter, Clock, CheckCircle, ShieldAlert } from 'lucide-react';

const MOCK_REQUESTS = [
  {
    id: 'REQ-091',
    user: 'Dr. Jane Smith',
    email: 'jane.smith@clinic.org',
    type: 'Account Access',
    status: 'Pending',
    submittedAt: '1 hr ago',
  },
  {
    id: 'REQ-092',
    user: 'Metro General Hosp.',
    email: 'admin@metro.org',
    type: 'Billing Tier Upgrade',
    status: 'Pending',
    submittedAt: '3 hrs ago',
  },
  {
    id: 'REQ-088',
    user: 'Dr. John Doe',
    email: 'jdoe@practice.com',
    type: 'Account Access',
    status: 'Approved',
    submittedAt: '2 days ago',
  },
];

export default function AdminRequestsPage() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-[var(--color-primary)]">Request Queue</h1>
          <p className="text-[var(--color-on-surface-variant)] mt-2">Manage access and escalation requests.</p>
        </div>
      </div>

      <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] flex flex-col min-h-[60vh] border border-[var(--color-outline-variant)]/10">
        <div className="p-4 border-b border-[var(--color-outline-variant)]/15 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-on-surface-variant)]" />
            <input 
              type="text"
              placeholder="Search requests by ID, email or user..."
              className="w-full pl-9 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>
          <button type="button" className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-surface-low)] transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-outline-variant)]/15 bg-[var(--color-surface-low)]/50">
                <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Request ID</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Requester</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Type</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Submitted</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_REQUESTS.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-outline-variant)]/10 hover:bg-[var(--color-surface-low)]/30 transition-colors">
                  <td className="p-4 text-sm font-medium text-[var(--color-primary)]">{r.id}</td>
                  <td className="p-4 text-sm">
                    <div className="text-[var(--color-on-surface)] font-medium">{r.user}</div>
                    <div className="text-[var(--color-on-surface-variant)] text-xs mt-0.5">{r.email}</div>
                  </td>
                  <td className="p-4 text-sm text-[var(--color-on-surface)]">{r.type}</td>
                  <td className="p-4 text-sm">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      r.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {r.status === 'Approved' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-[var(--color-on-surface-variant)]">{r.submittedAt}</td>
                  <td className="p-4 text-sm text-right">
                    <Link 
                      href={`/admin/requests/${r.id}`}
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
        
        <div className="p-4 border-t border-[var(--color-outline-variant)]/15 flex justify-between items-center text-sm text-[var(--color-on-surface-variant)]">
          <span>Showing 1 to 3 of 12 requests</span>
          <div className="flex gap-2">
            <button type="button" className="px-3 py-1.5 border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] opacity-50 cursor-not-allowed bg-[var(--color-surface)]">Previous</button>
            <button type="button" className="px-3 py-1.5 border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-low)] transition-colors text-[var(--color-on-surface)]">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
