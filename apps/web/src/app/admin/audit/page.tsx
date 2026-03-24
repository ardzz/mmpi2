import { Search, Filter, ShieldCheck, Database, Calendar } from 'lucide-react';

const MOCK_AUDIT = [
  { id: 'aud_8892', actor: 'sysadmin', action: 'Config_Update', resource: 'Billing_Mode', timestamp: '2026-03-24 14:32:01', ip: '192.168.1.1' },
  { id: 'aud_8891', actor: 'dr_sconnor', action: 'Report_Access', resource: 'Case_C-2026-081', timestamp: '2026-03-24 14:15:22', ip: '10.0.0.45' },
  { id: 'aud_8890', actor: 'system', action: 'Backup_Complete', resource: 'DB_Cluster_Primary', timestamp: '2026-03-24 12:00:00', ip: 'internal' },
  { id: 'aud_8889', actor: 'j_doe_patient', action: 'Assessment_Submit', resource: 'Case_C-2026-085', timestamp: '2026-03-24 11:45:10', ip: '203.0.113.8' },
  { id: 'aud_8888', actor: 'dr_sconnor', action: 'Login_Success', resource: 'Session_Auth', timestamp: '2026-03-24 09:00:15', ip: '10.0.0.45' },
];

export default function AdminAuditPage() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-[var(--color-primary)]">Audit Log</h1>
          <p className="text-[var(--color-on-surface-variant)] mt-2">Immutable platform activity and security events.</p>
        </div>
        <button type="button" className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-lowest)] text-[var(--color-primary)] rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-surface-low)] transition-colors">
          <Database className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)]/10 flex flex-col min-h-[60vh]">
        <div className="p-4 border-b border-[var(--color-outline-variant)]/15 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-[var(--color-surface-low)]/30">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-on-surface-variant)]" />
              <input 
                type="text"
                placeholder="Search by actor or resource..."
                className="w-full pl-9 pr-4 py-1.5 bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <button type="button" className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-surface-low)] transition-colors">
              <Calendar className="w-4 h-4 text-[var(--color-on-surface-variant)]" />
              Last 7 Days
            </button>
            <button type="button" className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-surface-low)] transition-colors">
              <Filter className="w-4 h-4 text-[var(--color-on-surface-variant)]" />
              Event Type
            </button>
          </div>
          <div className="text-xs font-mono text-[var(--color-on-surface-variant)] flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Integrity Verified
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-outline-variant)]/15 bg-[var(--color-surface-low)]/50">
                <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Timestamp</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Actor</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Action</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Resource</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              {MOCK_AUDIT.map((a) => (
                <tr key={a.id} className="border-b border-[var(--color-outline-variant)]/10 hover:bg-[var(--color-surface-low)]/30 transition-colors">
                  <td className="p-4 text-[var(--color-on-surface-variant)] text-xs">{a.timestamp}</td>
                  <td className="p-4 text-[var(--color-primary)] font-medium">{a.actor}</td>
                  <td className="p-4">
                    <span className="inline-flex px-2 py-0.5 rounded bg-[var(--color-surface-dim)] text-[var(--color-on-surface)] text-xs">
                      {a.action}
                    </span>
                  </td>
                  <td className="p-4 text-[var(--color-on-surface)] text-xs">{a.resource}</td>
                  <td className="p-4 text-[var(--color-on-surface-variant)] text-right text-xs">{a.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
