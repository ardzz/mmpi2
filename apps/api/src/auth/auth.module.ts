import { Module } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { AuthContextResolver } from './auth-context-resolver';
import { AuthzGuard } from './guards/authz.guard';
import { HeaderAuthContextResolver } from './header-auth-context.resolver';

@Module({
  providers: [
    HeaderAuthContextResolver,
    {
      provide: AuthContextResolver,
      useExisting: HeaderAuthContextResolver,
    },
    {
      provide: AuthzGuard,
      useFactory: (reflector: Reflector, authContextResolver: AuthContextResolver) =>
        new AuthzGuard(reflector, authContextResolver),
      inject: [Reflector, AuthContextResolver],
    },
    {
      provide: APP_GUARD,
      useExisting: AuthzGuard,
    },
  ],
  exports: [AuthContextResolver, AuthzGuard],
})
export class AuthModule {}
