import type { UserRole } from '@mmpi2/contracts';
import {
  DEV_ADMIN_AUTH,
  DEV_DOCTOR_AUTH,
  DEV_PATIENT_AUTH,
} from './dev-auth';

const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

interface DevAuthContext {
  userId: string;
  role: UserRole;
}

function buildApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

function withDevAuthHeaders(headers: Headers, auth: DevAuthContext) {
  headers.set('x-mmpi2-user-id', auth.userId);
  headers.set('x-mmpi2-role', auth.role);
}

async function requestApi<T>(endpoint: string, options: RequestInit, auth: DevAuthContext): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  withDevAuthHeaders(headers, auth);

  const res = await fetch(buildApiUrl(endpoint), {
    ...options,
    headers,
    cache: options.cache ?? 'no-store',
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`API Error ${res.status}: ${res.statusText} ${errorText}`.trim());
  }

  if (res.status === 204) {
    return null as T;
  }

  return res.json() as Promise<T>;
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return requestApi<T>(endpoint, options, DEV_PATIENT_AUTH);
}

export async function fetchApiAsAdmin<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return requestApi<T>(endpoint, options, DEV_ADMIN_AUTH);
}

export async function fetchApiAsDoctor<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return requestApi<T>(endpoint, options, DEV_DOCTOR_AUTH);
}
