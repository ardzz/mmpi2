import { Settings, CreditCard, Repeat, Search, DollarSign } from 'lucide-react';

const MOCK_EVENTS = [
  { id: 'evt_101', type: 'charge.succeeded', amount: '$45.00', status: 'Succeeded', date: 'Oct 24, 2026 14:32' },
  { id: 'evt_102', type: 'charge.succeeded', amount: '$45.00', status: 'Succeeded', date: 'Oct 24, 2026 10:15' },
  { id: 'evt_103', type: 'invoice.paid', amount: '$450.00', status: 'Succeeded', date: 'Oct 23, 2026 00:00' },
  { id: 'evt_104', type: 'charge.failed', amount: '$45.00', status: 'Failed', date: 'Oct 22, 2026 16:45' },
];

export default function AdminBillingPage() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-[var(--color-primary)]">Billing & Events</h1>
        <p className="text-[var(--color-on-surface-variant)] mt-2">Configure platform monetization and view transaction logs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)]/10 p-5">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-5 h-5 text-[var(--color-primary)]" />
              <h2 className="font-semibold text-[var(--color-on-surface)]">Monetization Mode</h2>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-start gap-3 p-3 border border-[var(--color-action)] bg-[var(--color-action)]/5 rounded-[var(--radius-md)] cursor-pointer">
                <input type="radio" name="billing_mode" className="mt-1" defaultChecked />
                <div>
                  <div className="font-medium text-[var(--color-on-surface)] flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-[var(--color-action)]" />
                    Subscription (B2B)
                  </div>
                  <div className="text-xs text-[var(--color-on-surface-variant)] mt-1">Clinics pay monthly. Patients take assessments for free.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-[var(--color-outline-variant)]/20 rounded-[var(--radius-md)] cursor-pointer hover:bg-[var(--color-surface-low)] transition-colors">
                <input type="radio" name="billing_mode" className="mt-1" />
                <div>
                  <div className="font-medium text-[var(--color-on-surface)] flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[var(--color-on-surface-variant)]" />
                    Pay-Per-Assessment (B2C)
                  </div>
                  <div className="text-xs text-[var(--color-on-surface-variant)] mt-1">Patients pay per test directly before beginning.</div>
                </div>
              </label>
            </div>

            <button type="button" className="w-full mt-6 py-2.5 bg-[var(--color-primary)] text-[var(--color-surface-lowest)] rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-primary-container)] transition-colors">
              Save Configuration
            </button>
          </div>

          <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)]/10 p-5">
            <h2 className="font-semibold text-[var(--color-on-surface)] mb-4">Quick Stats</h2>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1">Total Revenue (30d)</div>
                <div className="text-2xl font-bold text-[var(--color-primary)] flex items-center gap-1">
                  <DollarSign className="w-5 h-5 text-[var(--color-action)]" />
                  45,200
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1">Active Subscriptions</div>
                <div className="text-lg font-medium text-[var(--color-on-surface)]">142 Clinics</div>
              </div>
            </div>
          </div>
        </div>

        {/* Events Table */}
        <div className="md:col-span-2 bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)]/10 flex flex-col">
          <div className="p-4 border-b border-[var(--color-outline-variant)]/15 flex justify-between items-center">
            <h2 className="font-semibold text-[var(--color-on-surface)]">Recent Stripe Events</h2>
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-on-surface-variant)]" />
              <input 
                type="text"
                placeholder="Search events..."
                className="w-full pl-9 pr-4 py-1.5 bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-outline-variant)]/15 bg-[var(--color-surface-low)]/50">
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Event ID</th>
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Type</th>
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Amount</th>
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_EVENTS.map((e) => (
                  <tr key={e.id} className="border-b border-[var(--color-outline-variant)]/10 hover:bg-[var(--color-surface-low)]/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-[var(--color-on-surface)]">{e.id}</td>
                    <td className="p-4 text-sm text-[var(--color-on-surface-variant)] font-mono text-xs">{e.type}</td>
                    <td className="p-4 text-sm text-[var(--color-on-surface)] font-medium">{e.amount}</td>
                    <td className="p-4 text-sm">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        e.status === 'Succeeded' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[var(--color-on-surface-variant)] text-right">{e.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
