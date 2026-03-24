import { Users, Inbox, CreditCard, Activity } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-[var(--color-primary)]">Operations Dashboard</h1>
        <p className="text-[var(--color-on-surface-variant)] mt-2">Platform overview and high-level metrics.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending Requests', value: '14', icon: Inbox, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Active Users', value: '1,204', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Monthly Revenue', value: '$45.2k', icon: CreditCard, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'System Status', value: 'Nominal', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' }
        ].map((metric) => (
          <div key={metric.label} className="bg-[var(--color-surface-lowest)] p-5 rounded-xl shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)]/10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">{metric.label}</p>
                <p className="text-2xl font-bold text-[var(--color-on-surface)] mt-2">{metric.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center ${metric.bg}`}>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4 bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)]/10">
          <div className="p-5 border-b border-[var(--color-outline-variant)]/15">
            <h2 className="font-semibold text-[var(--color-on-surface)]">Recent Audit Events</h2>
          </div>
          <div className="p-0">
            <table className="w-full text-left border-collapse">
              <tbody>
                {[
                  { user: 'sysadmin', action: 'Modified Billing Mode', target: 'Stripe Integration', time: '10 min ago' },
                  { user: 'dr_smith', action: 'Approved Case', target: 'C-2026-081', time: '45 min ago' },
                  { user: 'system', action: 'Automated Backup', target: 'DB Primary', time: '2 hrs ago' },
                ].map((log, i) => (
                  <tr key={`${log.action}-${i}`} className="border-b last:border-0 border-[var(--color-outline-variant)]/10 hover:bg-[var(--color-surface-low)]/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-[var(--color-on-surface)]">{log.action}</td>
                    <td className="p-4 text-sm text-[var(--color-on-surface-variant)]">{log.target}</td>
                    <td className="p-4 text-sm text-[var(--color-on-surface-variant)]">{log.user}</td>
                    <td className="p-4 text-sm text-[var(--color-on-surface-variant)] text-right">{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-[var(--color-outline-variant)]/15 text-center">
            <Link href="/admin/audit" className="text-sm font-medium text-[var(--color-action)] hover:text-[var(--color-action-hover)]">
              View All Audit Logs
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[var(--color-surface-lowest)] p-5 rounded-xl shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)]/10">
            <h2 className="font-semibold text-[var(--color-on-surface)] mb-4">Quick Links</h2>
            <div className="space-y-2">
              <Link href="/admin/requests" className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-low)] border border-[var(--color-outline-variant)]/15 transition-colors">
                <span className="text-sm font-medium text-[var(--color-on-surface)]">Review Requests</span>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">14 pending</span>
              </Link>
              <Link href="/admin/users" className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-low)] border border-[var(--color-outline-variant)]/15 transition-colors">
                <span className="text-sm font-medium text-[var(--color-on-surface)]">Manage Users</span>
              </Link>
              <Link href="/admin/billing" className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-low)] border border-[var(--color-outline-variant)]/15 transition-colors">
                <span className="text-sm font-medium text-[var(--color-on-surface)]">Configure Billing</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
