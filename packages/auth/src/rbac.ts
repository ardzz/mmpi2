import { type UserRole, ROLE_HIERARCHY, UserRole as Roles } from './roles.js';
import { type Permission, ROLE_PERMISSIONS } from './permissions.js';

// ---------------------------------------------------------------------------
// Auth subject — the authenticated user making a request
// ---------------------------------------------------------------------------

export interface AuthSubject {
  /** User id (UUID). */
  readonly userId: string;
  /** Primary role for RBAC decisions. */
  readonly role: UserRole;
}

// ---------------------------------------------------------------------------
// Resource context — describes the resource being accessed
// ---------------------------------------------------------------------------

/**
 * Lightweight descriptor attached to a domain resource so the auth layer
 * can evaluate ownership and assignment without coupling to Prisma models.
 *
 * - `ownerId`       — the patient who owns the resource (request, session, report, payment).
 * - `assignedDoctorId` — the doctor assigned to evaluate / draft the report.
 *
 * Both fields are optional because not every resource has both (e.g. clinic settings).
 */
export interface ResourceContext {
  readonly ownerId?: string;
  readonly assignedDoctorId?: string;
}

// ---------------------------------------------------------------------------
// Flat permission checks (deny-by-default)
// ---------------------------------------------------------------------------

/**
 * Check whether a role has a specific permission.
 * This is the primary flat authorization check — deny by default.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions?.has(permission) ?? false;
}

/**
 * Check whether a role has **all** of the specified permissions.
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Check whether a role has **any** of the specified permissions.
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Assert a role meets a minimum hierarchy level.
 */
export function requiresMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

// ---------------------------------------------------------------------------
// Subject-aware authorization helpers
// ---------------------------------------------------------------------------

/**
 * Check whether `subject` is the resource owner.
 * Returns `false` when `ownerId` is not present on the resource context.
 */
export function isResourceOwner(subject: AuthSubject, resource: ResourceContext): boolean {
  return resource.ownerId !== undefined && subject.userId === resource.ownerId;
}

/**
 * Check whether `subject` is the doctor assigned to the resource.
 * Returns `false` when `assignedDoctorId` is not present on the resource context.
 */
export function isAssignedDoctor(subject: AuthSubject, resource: ResourceContext): boolean {
  return resource.assignedDoctorId !== undefined && subject.userId === resource.assignedDoctorId;
}

// ---------------------------------------------------------------------------
// Compound authorization — permission + subject relationship
// ---------------------------------------------------------------------------

/**
 * Authorisation result. `denied` carries a reason string that guards can
 * forward to error responses without leaking internals.
 */
export type AuthResult =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason: string };

const ALLOWED: AuthResult = { allowed: true };

function denied(reason: string): AuthResult {
  return { allowed: false, reason };
}

/**
 * Primary subject-aware check. Evaluates deny-by-default logic:
 *
 * 1. super_admin → always allowed (global override).
 * 2. Flat permission check against the RBAC matrix.
 * 3. If the permission is scoped (`:own`, `:assigned`), verify the
 *    corresponding subject relationship on the resource context.
 *
 * Guards should call this rather than composing low-level helpers manually.
 */
export function authorize(
  subject: AuthSubject,
  permission: Permission,
  resource?: ResourceContext,
): AuthResult {
  // 1. super_admin bypass
  if (subject.role === Roles.SUPER_ADMIN) {
    return ALLOWED;
  }

  // 2. Flat permission gate
  if (!hasPermission(subject.role, permission)) {
    return denied(`Role '${subject.role}' lacks permission '${permission}'.`);
  }

  // 3. Scope-aware relationship checks
  if (resource !== undefined) {
    if (permission.endsWith(':own')) {
      if (!isResourceOwner(subject, resource)) {
        return denied('Resource does not belong to the requesting user.');
      }
    }

    if (permission.endsWith(':assigned')) {
      if (!isAssignedDoctor(subject, resource)) {
        return denied('User is not the assigned doctor for this resource.');
      }
    }
  }

  return ALLOWED;
}

/**
 * Convenience predicate wrapping `authorize` for simple boolean contexts.
 */
export function can(
  subject: AuthSubject,
  permission: Permission,
  resource?: ResourceContext,
): boolean {
  return authorize(subject, permission, resource).allowed;
}

/**
 * Throws if authorization fails. Useful in domain services where a failed
 * check should halt execution immediately. The thrown error is a plain
 * `Error` — framework adapters (NestJS guards) can catch and remap to HTTP.
 */
export function assertAuthorized(
  subject: AuthSubject,
  permission: Permission,
  resource?: ResourceContext,
): void {
  const result = authorize(subject, permission, resource);
  if (!result.allowed) {
    throw new Error(`Authorization denied: ${result.reason}`);
  }
}
