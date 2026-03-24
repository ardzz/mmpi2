import type { AuthSubject } from '@mmpi2/auth';
import type { UserRole } from '@mmpi2/contracts';
import type { Request } from 'express';

export interface AuthenticatedUserContext extends AuthSubject {
  readonly roles: readonly UserRole[];
  readonly email?: string;
  readonly profileId?: string;
  readonly profileComplete?: boolean;
}

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUserContext;
};
