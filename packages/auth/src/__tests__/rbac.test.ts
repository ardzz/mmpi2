import { describe, expect, it } from 'vitest';
import {
  UserRole,
  ROLE_HIERARCHY,
  hasRoleOrHigher,
  isPatient,
  isDoctor,
  isAdmin,
  isSuperAdmin,
  Permission,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  requiresMinRole,
  isResourceOwner,
  isAssignedDoctor,
  authorize,
  can,
  assertAuthorized,
  type AuthSubject,
  type ResourceContext,
} from '../index.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function subject(role: (typeof UserRole)[keyof typeof UserRole], id = 'u-1'): AuthSubject {
  return { userId: id, role };
}

function resource(opts: { ownerId?: string; assignedDoctorId?: string } = {}): ResourceContext {
  return opts;
}

const PATIENT = subject(UserRole.PATIENT, 'patient-1');
const DOCTOR = subject(UserRole.DOCTOR, 'doctor-1');
const ADMIN = subject(UserRole.ADMIN, 'admin-1');
const SUPER = subject(UserRole.SUPER_ADMIN, 'super-1');

// ---------------------------------------------------------------------------
// Role constants & predicates
// ---------------------------------------------------------------------------

describe('Role constants', () => {
  it('exports the four canonical roles', () => {
    expect(UserRole.PATIENT).toBe('patient');
    expect(UserRole.DOCTOR).toBe('doctor');
    expect(UserRole.ADMIN).toBe('admin');
    expect(UserRole.SUPER_ADMIN).toBe('super_admin');
  });

  it('defines a numeric hierarchy', () => {
    expect(ROLE_HIERARCHY.patient).toBeLessThan(ROLE_HIERARCHY.doctor);
    expect(ROLE_HIERARCHY.doctor).toBeLessThan(ROLE_HIERARCHY.admin);
    expect(ROLE_HIERARCHY.admin).toBeLessThan(ROLE_HIERARCHY.super_admin);
  });
});

describe('Role predicates', () => {
  it('isPatient', () => {
    expect(isPatient(UserRole.PATIENT)).toBe(true);
    expect(isPatient(UserRole.DOCTOR)).toBe(false);
  });

  it('isDoctor', () => {
    expect(isDoctor(UserRole.DOCTOR)).toBe(true);
    expect(isDoctor(UserRole.ADMIN)).toBe(false);
  });

  it('isAdmin includes admin and super_admin', () => {
    expect(isAdmin(UserRole.ADMIN)).toBe(true);
    expect(isAdmin(UserRole.SUPER_ADMIN)).toBe(true);
    expect(isAdmin(UserRole.DOCTOR)).toBe(false);
  });

  it('isSuperAdmin is exclusive', () => {
    expect(isSuperAdmin(UserRole.SUPER_ADMIN)).toBe(true);
    expect(isSuperAdmin(UserRole.ADMIN)).toBe(false);
  });

  it('hasRoleOrHigher', () => {
    expect(hasRoleOrHigher(UserRole.ADMIN, UserRole.DOCTOR)).toBe(true);
    expect(hasRoleOrHigher(UserRole.PATIENT, UserRole.DOCTOR)).toBe(false);
    expect(hasRoleOrHigher(UserRole.DOCTOR, UserRole.DOCTOR)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Deny-by-default matrix
// ---------------------------------------------------------------------------

describe('Permission matrix — deny by default', () => {
  it('unknown / fabricated permission is denied for every role', () => {
    const fake = 'widget:explode' as Permission;
    expect(hasPermission(UserRole.PATIENT, fake)).toBe(false);
    expect(hasPermission(UserRole.DOCTOR, fake)).toBe(false);
    expect(hasPermission(UserRole.ADMIN, fake)).toBe(false);
    // super_admin only has Permission values, not arbitrary strings
    expect(hasPermission(UserRole.SUPER_ADMIN, fake)).toBe(false);
  });

  describe('patient permissions', () => {
    const allowed: Permission[] = [
      Permission.REQUEST_CREATE,
      Permission.REQUEST_READ_OWN,
      Permission.SESSION_START,
      Permission.SESSION_SAVE_ANSWERS,
      Permission.SESSION_SUBMIT,
      Permission.SESSION_READ_OWN,
      Permission.SCORE_READ_OWN,
      Permission.REPORT_READ_OWN,
      Permission.PAYMENT_READ_OWN,
    ];

    const denied: Permission[] = [
      Permission.REQUEST_READ_ALL,
      Permission.REQUEST_APPROVE,
      Permission.SESSION_READ_ALL,
      Permission.REPORT_DRAFT,
      Permission.REPORT_PUBLISH,
      Permission.SETTINGS_MANAGE,
      Permission.AUDIT_READ,
      Permission.USER_CREATE,
    ];

    it.each(allowed)('patient IS granted %s', (p) => {
      expect(hasPermission(UserRole.PATIENT, p)).toBe(true);
    });

    it.each(denied)('patient is DENIED %s', (p) => {
      expect(hasPermission(UserRole.PATIENT, p)).toBe(false);
    });
  });

  describe('doctor permissions', () => {
    const allowed: Permission[] = [
      Permission.SESSION_READ_ASSIGNED,
      Permission.SCORE_READ_ASSIGNED,
      Permission.REPORT_DRAFT,
      Permission.REPORT_PUBLISH,
      Permission.REPORT_READ_ASSIGNED,
    ];

    const denied: Permission[] = [
      Permission.REQUEST_CREATE,
      Permission.REQUEST_APPROVE,
      Permission.SESSION_READ_ALL,
      Permission.REPORT_READ_ALL,
      Permission.SETTINGS_MANAGE,
      Permission.USER_CREATE,
      Permission.AUDIT_READ,
    ];

    it.each(allowed)('doctor IS granted %s', (p) => {
      expect(hasPermission(UserRole.DOCTOR, p)).toBe(true);
    });

    it.each(denied)('doctor is DENIED %s', (p) => {
      expect(hasPermission(UserRole.DOCTOR, p)).toBe(false);
    });
  });

  describe('admin permissions', () => {
    const allowed: Permission[] = [
      Permission.REQUEST_READ_ALL,
      Permission.REQUEST_APPROVE,
      Permission.REQUEST_REJECT,
      Permission.REQUEST_ASSIGN_DOCTOR,
      Permission.SESSION_READ_ALL,
      Permission.SCORE_TRIGGER,
      Permission.SCORE_READ_ALL,
      Permission.REPORT_READ_ALL,
      Permission.PAYMENT_READ_ALL,
      Permission.PAYMENT_MANAGE,
      Permission.SETTINGS_READ,
      Permission.SETTINGS_MANAGE,
      Permission.AUDIT_READ,
      Permission.USER_READ_ALL,
      Permission.USER_CREATE,
      Permission.USER_UPDATE,
      Permission.USER_DEACTIVATE,
    ];

    const denied: Permission[] = [
      Permission.REQUEST_CREATE,
      Permission.SESSION_START,
      Permission.SESSION_SAVE_ANSWERS,
      Permission.REPORT_DRAFT,
    ];

    it.each(allowed)('admin IS granted %s', (p) => {
      expect(hasPermission(UserRole.ADMIN, p)).toBe(true);
    });

    it.each(denied)('admin is DENIED %s', (p) => {
      expect(hasPermission(UserRole.ADMIN, p)).toBe(false);
    });
  });

  describe('super_admin permissions', () => {
    it('has every defined permission', () => {
      const allPerms = Object.values(Permission);
      for (const p of allPerms) {
        expect(hasPermission(UserRole.SUPER_ADMIN, p)).toBe(true);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Composite permission checks
// ---------------------------------------------------------------------------

describe('hasAllPermissions / hasAnyPermission', () => {
  it('hasAllPermissions succeeds when all are present', () => {
    expect(
      hasAllPermissions(UserRole.PATIENT, [Permission.REQUEST_CREATE, Permission.SESSION_START]),
    ).toBe(true);
  });

  it('hasAllPermissions fails when one is missing', () => {
    expect(
      hasAllPermissions(UserRole.PATIENT, [Permission.REQUEST_CREATE, Permission.AUDIT_READ]),
    ).toBe(false);
  });

  it('hasAnyPermission succeeds when at least one is present', () => {
    expect(
      hasAnyPermission(UserRole.PATIENT, [Permission.AUDIT_READ, Permission.REQUEST_CREATE]),
    ).toBe(true);
  });

  it('hasAnyPermission fails when none are present', () => {
    expect(
      hasAnyPermission(UserRole.PATIENT, [Permission.AUDIT_READ, Permission.SETTINGS_MANAGE]),
    ).toBe(false);
  });
});

describe('requiresMinRole', () => {
  it('admin meets doctor minimum', () => {
    expect(requiresMinRole(UserRole.ADMIN, UserRole.DOCTOR)).toBe(true);
  });

  it('patient does not meet doctor minimum', () => {
    expect(requiresMinRole(UserRole.PATIENT, UserRole.DOCTOR)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Subject / resource relationship helpers
// ---------------------------------------------------------------------------

describe('isResourceOwner', () => {
  it('returns true when userId matches ownerId', () => {
    expect(isResourceOwner(PATIENT, resource({ ownerId: 'patient-1' }))).toBe(true);
  });

  it('returns false when userId differs', () => {
    expect(isResourceOwner(PATIENT, resource({ ownerId: 'patient-2' }))).toBe(false);
  });

  it('returns false when ownerId is absent', () => {
    expect(isResourceOwner(PATIENT, resource())).toBe(false);
  });
});

describe('isAssignedDoctor', () => {
  it('returns true when userId matches assignedDoctorId', () => {
    expect(isAssignedDoctor(DOCTOR, resource({ assignedDoctorId: 'doctor-1' }))).toBe(true);
  });

  it('returns false when userId differs', () => {
    expect(isAssignedDoctor(DOCTOR, resource({ assignedDoctorId: 'doctor-2' }))).toBe(false);
  });

  it('returns false when assignedDoctorId is absent', () => {
    expect(isAssignedDoctor(DOCTOR, resource())).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// authorize() — compound subject-aware checks
// ---------------------------------------------------------------------------

describe('authorize()', () => {
  describe('super_admin bypass', () => {
    it('allows any permission regardless of matrix', () => {
      const result = authorize(SUPER, Permission.SETTINGS_MANAGE);
      expect(result.allowed).toBe(true);
    });

    it('allows even with unrelated resource context', () => {
      const result = authorize(SUPER, Permission.REQUEST_READ_OWN, resource({ ownerId: 'other' }));
      expect(result.allowed).toBe(true);
    });
  });

  describe('flat permission denial', () => {
    it('denies patient from admin-only permission', () => {
      const result = authorize(PATIENT, Permission.SETTINGS_MANAGE);
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.reason).toContain('lacks permission');
      }
    });

    it('denies doctor from patient-only permission', () => {
      const result = authorize(DOCTOR, Permission.REQUEST_CREATE);
      expect(result.allowed).toBe(false);
    });
  });

  describe('ownership scoped permissions (:own)', () => {
    it('patient can read own request', () => {
      const result = authorize(PATIENT, Permission.REQUEST_READ_OWN, resource({ ownerId: 'patient-1' }));
      expect(result.allowed).toBe(true);
    });

    it('patient cannot read another patient request', () => {
      const result = authorize(PATIENT, Permission.REQUEST_READ_OWN, resource({ ownerId: 'patient-2' }));
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.reason).toContain('does not belong');
      }
    });

    it('patient can read own session', () => {
      const result = authorize(PATIENT, Permission.SESSION_READ_OWN, resource({ ownerId: 'patient-1' }));
      expect(result.allowed).toBe(true);
    });

    it('patient cannot read another patient session', () => {
      const result = authorize(PATIENT, Permission.SESSION_READ_OWN, resource({ ownerId: 'patient-other' }));
      expect(result.allowed).toBe(false);
    });

    it('patient can read own report', () => {
      const result = authorize(PATIENT, Permission.REPORT_READ_OWN, resource({ ownerId: 'patient-1' }));
      expect(result.allowed).toBe(true);
    });

    it('patient cannot read another patient report', () => {
      const result = authorize(PATIENT, Permission.REPORT_READ_OWN, resource({ ownerId: 'patient-other' }));
      expect(result.allowed).toBe(false);
    });

    it('patient can read own scores', () => {
      const result = authorize(PATIENT, Permission.SCORE_READ_OWN, resource({ ownerId: 'patient-1' }));
      expect(result.allowed).toBe(true);
    });

    it('patient cannot read another patient scores', () => {
      const result = authorize(PATIENT, Permission.SCORE_READ_OWN, resource({ ownerId: 'patient-2' }));
      expect(result.allowed).toBe(false);
    });

    it('patient can read own payment', () => {
      const result = authorize(PATIENT, Permission.PAYMENT_READ_OWN, resource({ ownerId: 'patient-1' }));
      expect(result.allowed).toBe(true);
    });

    it('patient cannot read another patient payment', () => {
      const result = authorize(PATIENT, Permission.PAYMENT_READ_OWN, resource({ ownerId: 'patient-2' }));
      expect(result.allowed).toBe(false);
    });
  });

  describe('assignment scoped permissions (:assigned)', () => {
    it('doctor can read assigned session', () => {
      const result = authorize(DOCTOR, Permission.SESSION_READ_ASSIGNED, resource({ assignedDoctorId: 'doctor-1' }));
      expect(result.allowed).toBe(true);
    });

    it('doctor cannot read non-assigned session', () => {
      const result = authorize(DOCTOR, Permission.SESSION_READ_ASSIGNED, resource({ assignedDoctorId: 'doctor-other' }));
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.reason).toContain('not the assigned doctor');
      }
    });

    it('doctor can read assigned report', () => {
      const result = authorize(DOCTOR, Permission.REPORT_READ_ASSIGNED, resource({ assignedDoctorId: 'doctor-1' }));
      expect(result.allowed).toBe(true);
    });

    it('doctor cannot read non-assigned report', () => {
      const result = authorize(DOCTOR, Permission.REPORT_READ_ASSIGNED, resource({ assignedDoctorId: 'doctor-other' }));
      expect(result.allowed).toBe(false);
    });

    it('doctor can read assigned scores', () => {
      const result = authorize(DOCTOR, Permission.SCORE_READ_ASSIGNED, resource({ assignedDoctorId: 'doctor-1' }));
      expect(result.allowed).toBe(true);
    });

    it('doctor cannot read non-assigned scores', () => {
      const result = authorize(DOCTOR, Permission.SCORE_READ_ASSIGNED, resource({ assignedDoctorId: 'doctor-2' }));
      expect(result.allowed).toBe(false);
    });
  });

  describe('admin global permissions (no scope suffix)', () => {
    it('admin can read all requests without resource context', () => {
      const result = authorize(ADMIN, Permission.REQUEST_READ_ALL);
      expect(result.allowed).toBe(true);
    });

    it('admin can manage settings', () => {
      const result = authorize(ADMIN, Permission.SETTINGS_MANAGE);
      expect(result.allowed).toBe(true);
    });

    it('admin can read audit logs', () => {
      const result = authorize(ADMIN, Permission.AUDIT_READ);
      expect(result.allowed).toBe(true);
    });

    it('admin can manage users', () => {
      expect(authorize(ADMIN, Permission.USER_CREATE).allowed).toBe(true);
      expect(authorize(ADMIN, Permission.USER_UPDATE).allowed).toBe(true);
      expect(authorize(ADMIN, Permission.USER_DEACTIVATE).allowed).toBe(true);
    });

    it('admin can manage payments', () => {
      expect(authorize(ADMIN, Permission.PAYMENT_MANAGE).allowed).toBe(true);
    });
  });

  describe('without resource context, :own/:assigned permissions still pass flat check', () => {
    it('patient has REQUEST_READ_OWN in matrix even without resource (flat check only)', () => {
      // authorize without resource does not enforce ownership — just flat permission
      const result = authorize(PATIENT, Permission.REQUEST_READ_OWN);
      expect(result.allowed).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// can() — boolean convenience
// ---------------------------------------------------------------------------

describe('can()', () => {
  it('returns true for allowed', () => {
    expect(can(ADMIN, Permission.AUDIT_READ)).toBe(true);
  });

  it('returns false for denied', () => {
    expect(can(PATIENT, Permission.AUDIT_READ)).toBe(false);
  });

  it('respects ownership', () => {
    expect(can(PATIENT, Permission.REQUEST_READ_OWN, resource({ ownerId: 'patient-1' }))).toBe(true);
    expect(can(PATIENT, Permission.REQUEST_READ_OWN, resource({ ownerId: 'other' }))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// assertAuthorized() — throws on denial
// ---------------------------------------------------------------------------

describe('assertAuthorized()', () => {
  it('does not throw when authorized', () => {
    expect(() => assertAuthorized(ADMIN, Permission.AUDIT_READ)).not.toThrow();
  });

  it('throws with reason when denied', () => {
    expect(() => assertAuthorized(PATIENT, Permission.AUDIT_READ)).toThrow('Authorization denied');
  });

  it('throws on ownership mismatch', () => {
    expect(() =>
      assertAuthorized(PATIENT, Permission.REQUEST_READ_OWN, resource({ ownerId: 'other' })),
    ).toThrow('does not belong');
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting: deny-by-default proof
// ---------------------------------------------------------------------------

describe('deny-by-default proof', () => {
  it('no role except super_admin has the full permission set', () => {
    const allPerms = Object.values(Permission);
    const roles: (typeof UserRole)[keyof typeof UserRole][] = [
      UserRole.PATIENT,
      UserRole.DOCTOR,
      UserRole.ADMIN,
    ];
    for (const role of roles) {
      const grantedCount = allPerms.filter((p) => hasPermission(role, p)).length;
      expect(grantedCount).toBeLessThan(allPerms.length);
    }
  });

  it('super_admin has every permission', () => {
    const allPerms = Object.values(Permission);
    const grantedCount = allPerms.filter((p) => hasPermission(UserRole.SUPER_ADMIN, p)).length;
    expect(grantedCount).toBe(allPerms.length);
  });

  it('patient and doctor permission sets do not overlap', () => {
    const patientPerms = ROLE_PERMISSIONS.patient;
    const doctorPerms = ROLE_PERMISSIONS.doctor;
    for (const p of patientPerms) {
      expect(doctorPerms.has(p)).toBe(false);
    }
  });
});
