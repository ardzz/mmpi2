import type { UserRole } from '@mmpi2/contracts';
import { SetMetadata } from '@nestjs/common';
import { REQUIRED_MIN_ROLE_KEY } from '../auth.constants';

export const RequireMinRole = (role: UserRole): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRED_MIN_ROLE_KEY, role);
