/**
 * Role definitions — re-exported from @mmpi2/contracts for consistency.
 * Auth-specific helpers (hierarchy, role predicates) live here.
 */
import { UserRole } from '@mmpi2/contracts';

// Re-export the canonical role constants and type from contracts
export { UserRole } from '@mmpi2/contracts';

/**
 * Numeric hierarchy for minimum-role checks.
 * Higher value = broader privilege. Used only for coarse gating;
 * fine-grained access goes through the permission matrix + subject checks.
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  patient: 0,
  doctor: 1,
  admin: 2,
  super_admin: 3,
};

export function hasRoleOrHigher(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isPatient(role: UserRole): boolean {
  return role === UserRole.PATIENT;
}

export function isDoctor(role: UserRole): boolean {
  return role === UserRole.DOCTOR;
}

export function isAdmin(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN;
}
