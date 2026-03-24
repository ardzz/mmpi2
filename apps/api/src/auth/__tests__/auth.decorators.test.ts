import { Permission } from '@mmpi2/auth';
import { UserRole } from '@mmpi2/contracts';
import { describe, expect, it } from 'vitest';
import {
  IS_PUBLIC_KEY,
  REQUIRED_MIN_ROLE_KEY,
  REQUIRED_PERMISSIONS_KEY,
} from '../auth.constants';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { Public } from '../decorators/public.decorator';
import { RequireMinRole } from '../decorators/roles.decorator';

describe('auth decorators', () => {
  it('sets public metadata', () => {
    class TestController {
      @Public()
      list(): void {}
    }

    const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, TestController.prototype.list);
    expect(metadata).toBe(true);
  });

  it('sets required permissions metadata', () => {
    class TestController {
      @RequirePermissions(Permission.REQUEST_CREATE, Permission.REQUEST_READ_OWN)
      list(): void {}
    }

    const metadata = Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, TestController.prototype.list);
    expect(metadata).toEqual([Permission.REQUEST_CREATE, Permission.REQUEST_READ_OWN]);
  });

  it('sets minimum role metadata', () => {
    class TestController {
      @RequireMinRole(UserRole.ADMIN)
      list(): void {}
    }

    const metadata = Reflect.getMetadata(REQUIRED_MIN_ROLE_KEY, TestController.prototype.list);
    expect(metadata).toBe(UserRole.ADMIN);
  });
});
