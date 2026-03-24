import type { Request } from 'express';
import type { AuthenticatedUserContext } from './auth.types';

export abstract class AuthContextResolver {
  abstract resolve(request: Request): AuthenticatedUserContext | null;
}
