import { Search, Filter, Shield, UserCog, MoreHorizontal } from 'lucide-react';

const MOCK_USERS = [
  { id: 'usr_101', name: 'Dr. Sarah Connor', email: 'sarah.connor@clinic.org', role: 'Doctor', status: 'Active', joined: 'Jan 15, 2026' },
  { id: 'usr_102', name: 'John Doe', email: 'john.doe@email.com', role: 'Patient', status: 'Active', joined: 'Mar 10, 2026' },
  { id: 'usr_103', name: 'Admin User', email: 'admin@system.io', role: 'Admin', status: 'Active', joined: 'Dec 01, 2025' },
  { id: 'usr_104', name: 'Dr. James Wilson', email: 'j.wilson@hospital.org', role: 'Doctor', status: 'Suspended', joined: 'Feb 20, 2026' },
];

export default function AdminUsersPage() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-[var(--color-primary)]">Users & Roles</h1>
          <p className="text-[var(--color-on-surface-variant)] mt-2">Manage accounts, permissions, and system access.</p>
        </div>
        <button type="button" className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-surface-lowest)] rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-primary-container)] transition-colors shadow-[var(--shadow-ambient)]">
          <UserCog className="w-4 h-4" />
          Invite User
        </button>
      </div>

      <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)]/10 flex flex-col min-h-[60vh]">
        <div className="p-4 border-b border-[var(--color-outline-variant)]/15 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-on-surface-variant)]" />
            <input 
              type="text"
              placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-surface-low)] transition-colors">
              <Filter className="w-4 h-4" />
              Role
            </button>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-outline-variant)]/15 bg-[var(--color-surface-low)]/50">
                <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">User</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Role</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Joined</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_USERS.map((u) => (
                <tr key={u.id} className="border-b border-[var(--color-outline-variant)]/10 hover:bg-[var(--color-surface-low)]/30 transition-colors">
                  <td className="p-4 text-sm">
                    <div className="font-medium text-[var(--color-on-surface)]">{u.name}</div>
                    <div className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">{u.email}</div>
                  </td>
                  <td className="p-4 text-sm">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-surface-dim)] text-[var(--color-on-surface)]">
                      {u.role === 'Admin' && <Shield className="w-3 h-3 text-[var(--color-action)]" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-[var(--color-on-surface-variant)]">{u.joined}</td>
                  <td className="p-4 text-sm text-right">
                    <button type="button" className="p-1.5 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-low)] rounded-md transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
