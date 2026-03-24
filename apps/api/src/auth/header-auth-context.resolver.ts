import { Injectable } from '@nestjs/common';
import { UserRoleSchema, type UserRole } from '@mmpi2/contracts';
import type { Request } from 'express';
import { AuthContextResolver } from './auth-context-resolver';
import type { AuthenticatedUserContext } from './auth.types';

@Injectable()
export class HeaderAuthContextResolver extends AuthContextResolver {
  resolve(request: Request): AuthenticatedUserContext | null {
    const userId = this.getHeaderValue(request, 'x-mmpi2-user-id');
    const roleValue = this.getHeaderValue(request, 'x-mmpi2-role');

    if (userId === undefined || roleValue === undefined) {
      return null;
    }

    const parsedRole = UserRoleSchema.safeParse(roleValue);
    if (!parsedRole.success) {
      return null;
    }

    const roles = this.parseRoles(this.getHeaderValue(request, 'x-mmpi2-roles'), parsedRole.data);

    return {
      userId,
      role: parsedRole.data,
      roles,
      email: this.getHeaderValue(request, 'x-mmpi2-email'),
      profileId: this.getHeaderValue(request, 'x-mmpi2-profile-id'),
      profileComplete: this.parseBoolean(this.getHeaderValue(request, 'x-mmpi2-profile-complete')),
    };
  }

  private getHeaderValue(request: Request, headerName: string): string | undefined {
    const value = request.headers[headerName];
    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value)) {
      return value[0];
    }

    return undefined;
  }

  private parseRoles(rolesHeader: string | undefined, fallbackRole: UserRole): UserRole[] {
    if (rolesHeader === undefined) {
      return [fallbackRole];
    }

    const parsedRoles: UserRole[] = [];

    for (const entry of rolesHeader.split(',')) {
      const candidate = entry.trim();
      if (candidate.length === 0) {
        continue;
      }

      const parsed = UserRoleSchema.safeParse(candidate);
      if (parsed.success) {
        parsedRoles.push(parsed.data);
      }
    }

    if (parsedRoles.length === 0) {
      return [fallbackRole];
    }

    return parsedRoles;
  }

  private parseBoolean(value: string | undefined): boolean | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return undefined;
  }
}
