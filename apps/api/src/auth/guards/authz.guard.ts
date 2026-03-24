import {
  UnauthorizedException,
  ForbiddenException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { authorize, requiresMinRole, type Permission } from '@mmpi2/auth';
import type { UserRole } from '@mmpi2/contracts';
import type { Reflector } from '@nestjs/core';
import {
  IS_PUBLIC_KEY,
  REQUIRED_MIN_ROLE_KEY,
  REQUIRED_PERMISSIONS_KEY,
} from '../auth.constants';
import type { AuthContextResolver } from '../auth-context-resolver';
import type { AuthenticatedRequest } from '../auth.types';

export class AuthzGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authContextResolver: AuthContextResolver,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic =
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]) ??
      false;

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = this.authContextResolver.resolve(request);

    if (user === null) {
      throw new UnauthorizedException('Authentication required.');
    }

    request.user = user;

    const requiredPermissions =
      this.reflector.getAllAndMerge<Permission[]>(REQUIRED_PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const requiredMinRole =
      this.reflector.getAllAndOverride<UserRole>(REQUIRED_MIN_ROLE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? null;

    if (requiredPermissions.length === 0 && requiredMinRole === null) {
      throw new ForbiddenException('Route is not configured with authorization metadata.');
    }

    if (requiredMinRole !== null && !requiresMinRole(user.role, requiredMinRole)) {
      throw new ForbiddenException(
        `Role '${user.role}' does not meet minimum role '${requiredMinRole}'.`,
      );
    }

    for (const permission of requiredPermissions) {
      const result = authorize(user, permission);
      if (!result.allowed) {
        throw new ForbiddenException(result.reason);
      }
    }

    return true;
  }
}
