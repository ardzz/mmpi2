import { Permission } from '@mmpi2/auth';
import {
  UnauthorizedException,
  ForbiddenException,
  type ExecutionContext,
  type Type,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@mmpi2/contracts';
import type { Request } from 'express';
import { describe, expect, it } from 'vitest';
import {
  IS_PUBLIC_KEY,
  REQUIRED_MIN_ROLE_KEY,
  REQUIRED_PERMISSIONS_KEY,
} from '../auth.constants';
import type { AuthContextResolver } from '../auth-context-resolver';
import type { AuthenticatedUserContext } from '../auth.types';
import { AuthzGuard } from '../guards/authz.guard';

class StaticAuthContextResolver implements AuthContextResolver {
  constructor(private readonly user: AuthenticatedUserContext | null) {}

  resolve(_request: Request): AuthenticatedUserContext | null {
    return this.user;
  }
}

class TestController {
  list(): void {}
}

function createContext(
  handler: () => unknown,
  controllerClass: Type<unknown>,
): ExecutionContext {
  const request: { user?: AuthenticatedUserContext; headers: Record<string, string> } = {
    headers: {},
  };

  const context: Pick<ExecutionContext, 'getHandler' | 'getClass' | 'switchToHttp'> = {
    getHandler: () => handler,
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
    userId: '11111111-1111-1111-1111-111111111111',
    role,
    roles: [role],
    email: 'tester@mmpi2.local',
  };
}

describe('AuthzGuard', () => {
  it('allows public routes without user context', () => {
    const reflector = new Reflector();

    class PublicController {
      route(): void {}
    }

    Reflect.defineMetadata(IS_PUBLIC_KEY, true, PublicController.prototype.route);

    const guard = new AuthzGuard(reflector, new StaticAuthContextResolver(null));
    const context = createContext(PublicController.prototype.route, PublicController);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects unauthenticated access to protected routes', () => {
    const reflector = new Reflector();
    Reflect.defineMetadata(
      REQUIRED_PERMISSIONS_KEY,
      [Permission.REQUEST_CREATE],
      TestController.prototype.list,
    );

    const guard = new AuthzGuard(reflector, new StaticAuthContextResolver(null));
    const context = createContext(TestController.prototype.list, TestController);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects authenticated routes without explicit authorization metadata', () => {
    const reflector = new Reflector();
    const guard = new AuthzGuard(reflector, new StaticAuthContextResolver(makeUser(UserRole.ADMIN)));
    const context = createContext(TestController.prototype.list, TestController);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows when role has required permission', () => {
    const reflector = new Reflector();
    Reflect.defineMetadata(
      REQUIRED_PERMISSIONS_KEY,
      [Permission.REQUEST_CREATE],
      TestController.prototype.list,
    );

    const guard = new AuthzGuard(reflector, new StaticAuthContextResolver(makeUser(UserRole.PATIENT)));
    const context = createContext(TestController.prototype.list, TestController);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies when role lacks required permission', () => {
    const reflector = new Reflector();
    Reflect.defineMetadata(REQUIRED_PERMISSIONS_KEY, [Permission.AUDIT_READ], TestController.prototype.list);

    const guard = new AuthzGuard(reflector, new StaticAuthContextResolver(makeUser(UserRole.PATIENT)));
    const context = createContext(TestController.prototype.list, TestController);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('denies when role is below required minimum role', () => {
    const reflector = new Reflector();
    Reflect.defineMetadata(REQUIRED_MIN_ROLE_KEY, UserRole.ADMIN, TestController.prototype.list);

    const guard = new AuthzGuard(reflector, new StaticAuthContextResolver(makeUser(UserRole.DOCTOR)));
    const context = createContext(TestController.prototype.list, TestController);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
