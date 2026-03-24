/**
 * @mmpi2/auth
 *
 * Deny-by-default RBAC helper layer for the MMPI-2 platform.
 *
 * Exports:
 *   - Role constants & predicates  (re-exported from @mmpi2/contracts)
 *   - Permission constants & matrix
 *   - Subject-aware authorization helpers (authorize, can, assertAuthorized)
 *   - Low-level permission checks (hasPermission, hasAllPermissions, etc.)
 *
 * Framework-agnostic — NestJS guards consume these helpers without coupling.
 */

// Roles: constants, hierarchy, predicates
export {
  UserRole,
  ROLE_HIERARCHY,
  hasRoleOrHigher,
  isPatient,
  isDoctor,
  isAdmin,
  isSuperAdmin,
} from './roles.js';

// Permissions: constants and matrix
export { Permission, ROLE_PERMISSIONS } from './permissions.js';

// RBAC: types, flat checks, subject-aware authorization
export {
  // Types
  type AuthSubject,
  type ResourceContext,
  type AuthResult,
  // Flat checks
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  requiresMinRole,
  // Subject-aware
  isResourceOwner,
  isAssignedDoctor,
  authorize,
  can,
  assertAuthorized,
} from './rbac.js';
