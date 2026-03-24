import Link from 'next/link';
import { Search, Filter, Clock, AlertCircle, FileText, CheckCircle } from 'lucide-react';

const MOCK_CASES = [
  {
    id: 'C-2026-081',
    patient: 'John Doe',
    status: 'Ready for Review',
    submittedAt: '2 hrs ago',
    validity: 'Valid',
    priority: 'Normal',
  },
  {
    id: 'C-2026-082',
    patient: 'Alice Smith',
    status: 'Ready for Review',
    submittedAt: '4 hrs ago',
    validity: 'Review Recommended',
    priority: 'High',
  },
  {
    id: 'C-2026-079',
    patient: 'Michael Brown',
    status: 'In Progress',
    submittedAt: '1 day ago',
    validity: 'Valid',
    priority: 'Normal',
  },
];

export default function AssessmentQueuePage() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-[var(--color-primary)]">Assessment Queue</h1>
        <p className="text-[var(--color-on-surface-variant)] mt-2">Manage and review pending patient assessments.</p>
      </div>

      <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] flex flex-col min-h-[60vh]">
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--color-outline-variant)]/20 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-on-surface-variant)]" />
            <input 
              type="text"
              placeholder="Search by Case ID or Patient..."
              className="w-full pl-9 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] text-sm focus:outline-none focus:border-[var(--color-action)] focus:ring-1 focus:ring-[var(--color-action)]"
            />
          </div>
          <button type="button" className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-surface-low)] transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-outline-variant)]/20 bg-[var(--color-surface-low)]/50">
                <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Case ID</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Patient</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Validity Indicator</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Submitted</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_CASES.map((c) => (
                <tr key={c.id} className="border-b border-[var(--color-outline-variant)]/10 hover:bg-[var(--color-surface-low)]/30 transition-colors">
                  <td className="p-4 text-sm font-medium text-[var(--color-primary)]">{c.id}</td>
                  <td className="p-4 text-sm text-[var(--color-on-surface)]">{c.patient}</td>
                  <td className="p-4 text-sm">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-[var(--color-surface-dim)] text-[var(--color-on-surface)] text-xs font-medium">
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${c.validity === 'Valid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      {c.validity === 'Valid' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {c.validity}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-[var(--color-on-surface-variant)] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> {c.submittedAt}
                  </td>
                  <td className="p-4 text-sm text-right">
                    <Link 
                      href={`/doctor/cases/${c.id}/workstation`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--color-primary)] text-[var(--color-surface-lowest)] rounded-[var(--radius-md)] text-xs font-medium hover:bg-[var(--color-primary-container)] transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination mock */}
        <div className="p-4 border-t border-[var(--color-outline-variant)]/20 flex justify-between items-center text-sm text-[var(--color-on-surface-variant)]">
          <span>Showing 1 to 3 of 3 entries</span>
          <div className="flex gap-2">
            <button type="button" className="px-3 py-1 border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] opacity-50 cursor-not-allowed">Previous</button>
            <button type="button" className="px-3 py-1 border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] opacity-50 cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
