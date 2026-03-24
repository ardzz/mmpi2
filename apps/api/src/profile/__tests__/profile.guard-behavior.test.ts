import {
  ForbiddenException,
  UnauthorizedException,
  type ExecutionContext,
  type Type,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@mmpi2/contracts';
import type { Request } from 'express';
import { describe, expect, it } from 'vitest';
import { AuthzGuard } from '../../auth';
import type { AuthContextResolver } from '../../auth/auth-context-resolver';
import type { AuthenticatedUserContext } from '../../auth/auth.types';
import { ProfileController } from '../profile.controller';

class StaticAuthContextResolver implements AuthContextResolver {
  constructor(private readonly user: AuthenticatedUserContext | null) {}

  resolve(_request: Request): AuthenticatedUserContext | null {
    return this.user;
  }
}

function createContext(
  handler: unknown,
  controllerClass: Type<unknown>,
): ExecutionContext {
  const request: { user?: AuthenticatedUserContext; headers: Record<string, string> } = {
    headers: {},
  };

  const context: Pick<ExecutionContext, 'getHandler' | 'getClass' | 'switchToHttp'> = {
    getHandler: () => handler as () => unknown,
    getClass: <T = unknown>() => controllerClass as Type<T>,
    switchToHttp: () => ({
      getRequest: <T>() => request as T,
      getResponse: <T>() => ({} as T),
      getNext: <T>() => ({} as T),
    }),
  };

  return context as ExecutionContext;
}

function makeUser(role: (typeof UserRole)[keyof typeof UserRole]): AuthenticatedUserContext {
  return {
    userId: '33333333-3333-3333-3333-333333333333',
    role,
    roles: [role],
    email: 'test-profile@mmpi2.local',
  };
}

describe('Profile routes authz integration', () => {
  it('requires authentication for patient self profile endpoint', () => {
    const guard = new AuthzGuard(new Reflector(), new StaticAuthContextResolver(null));
    const context = createContext(ProfileController.prototype.getMyPatientProfile, ProfileController);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('allows patient on patient self profile endpoint', () => {
    const guard = new AuthzGuard(
      new Reflector(),
      new StaticAuthContextResolver(makeUser(UserRole.PATIENT)),
    );
    const context = createContext(ProfileController.prototype.getMyPatientProfile, ProfileController);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('blocks patient on doctor self profile endpoint due to min-role metadata', () => {
    const guard = new AuthzGuard(
      new Reflector(),
      new StaticAuthContextResolver(makeUser(UserRole.PATIENT)),
    );
    const context = createContext(ProfileController.prototype.getMyDoctorProfile, ProfileController);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows admin on admin profile read endpoint', () => {
    const guard = new AuthzGuard(new Reflector(), new StaticAuthContextResolver(makeUser(UserRole.ADMIN)));
    const context = createContext(ProfileController.prototype.getPatientProfileByUserId, ProfileController);

    expect(guard.canActivate(context)).toBe(true);
  });
});
