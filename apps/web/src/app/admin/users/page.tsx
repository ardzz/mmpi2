import { Filter, Search, Shield, UserCog } from 'lucide-react';
import type { AdminUserDirectoryItem, UserRole } from '@mmpi2/contracts';
import { fetchApiAsAdmin } from '../../../lib/api-client';
import { revalidatePath } from 'next/cache';

const ALL_ROLES: UserRole[] = ['patient', 'doctor', 'admin', 'super_admin'];

interface AdminUsersPageProps {
  searchParams?: Promise<{ q?: string; role?: UserRole | 'all' }>;
}

function formatJoinedDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  let users: AdminUserDirectoryItem[] = [];
  const query = resolvedSearchParams.q?.trim() ?? '';
  const role = resolvedSearchParams.role ?? 'all';

  try {
    const params = new URLSearchParams();
    if (query) {
      params.set('q', query);
    }
    if (role && role !== 'all') {
      params.set('role', role);
    }
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    users = await fetchApiAsAdmin<AdminUserDirectoryItem[]>(`/profiles/admin/users${suffix}`);
  } catch (error) {
    console.error('Failed to load admin user directory:', error);
  }

  async function updateRoles(formData: FormData) {
    'use server';

    const userId = formData.get('userId');
    if (typeof userId !== 'string' || userId.length === 0) {
      return;
    }

    const roles = ALL_ROLES.filter((role) => formData.getAll('roles').includes(role));
    if (roles.length === 0) {
      return;
    }

    await fetchApiAsAdmin(`/profiles/admin/users/${userId}/roles`, {
      method: 'PUT',
      body: JSON.stringify({ roles }),
    });

    revalidatePath('/admin/users');
  }

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
          <form className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-on-surface-variant)]" />
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Search users..."
                className="w-full pl-9 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <label className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-on-surface)]">
              <Filter className="w-4 h-4" />
              <select name="role" defaultValue={role} className="bg-transparent focus:outline-none">
                <option value="all">All roles</option>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </label>
          </form>
        </div>

        {users.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-10 text-center">
            <div className="max-w-xl">
              <UserCog className="mx-auto mb-4 h-8 w-8 text-[var(--color-primary)]" />
              <h2 className="text-lg font-semibold text-[var(--color-on-surface)]">No users available</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-on-surface-variant)]">
                The user directory is now wired to the API. Once accounts exist in the persisted store, they will
                appear here with their assigned roles and profile state.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-outline-variant)]/15 bg-[var(--color-surface-low)]/50">
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">User</th>
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Role</th>
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Profile State</th>
                  <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-[var(--color-outline-variant)]/10 hover:bg-[var(--color-surface-low)]/30 transition-colors">
                    <td className="p-4 text-sm">
                      <div className="font-medium text-[var(--color-on-surface)]">{user.fullName}</div>
                      <div className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">{user.email}</div>
                    </td>
                    <td className="p-4 text-sm">
                      <form action={updateRoles} className="space-y-2">
                        <input type="hidden" name="userId" value={user.id} />
                        <div className="flex flex-wrap gap-2">
                          {ALL_ROLES.map((role) => {
                            const selected = user.roles.includes(role);

                            return (
                              <label key={role} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${selected ? 'border-[var(--color-primary)] bg-[var(--color-surface-dim)] text-[var(--color-on-surface)]' : 'border-[var(--color-outline-variant)]/30 bg-[var(--color-surface)] text-[var(--color-on-surface-variant)]'}`}>
                                <input
                                  type="checkbox"
                                  name="roles"
                                  value={role}
                                  defaultChecked={selected}
                                  className="sr-only"
                                />
                                {role === 'admin' || role === 'super_admin' ? <Shield className="w-3 h-3 text-[var(--color-action)]" /> : null}
                                {role}
                              </label>
                            );
                          })}
                        </div>
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-surface-low)] transition-colors"
                        >
                          Save roles
                        </button>
                      </form>
                    </td>
                    <td className="p-4 text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user.accountStatus === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {user.accountStatus}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[var(--color-on-surface-variant)]">
                      {user.isProfileComplete === null ? 'No patient profile' : user.isProfileComplete ? 'Complete' : 'Incomplete'}
                      {user.doctorLicenseNumber ? (
                        <div className="text-xs mt-1 text-[var(--color-on-surface-variant)]">
                          {user.doctorLicenseNumber}
                          {user.doctorSpecialty ? ` · ${user.doctorSpecialty}` : ''}
                        </div>
                      ) : null}
                    </td>
                    <td className="p-4 text-sm text-[var(--color-on-surface-variant)]">{formatJoinedDate(user.createdAt)}</td>
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
