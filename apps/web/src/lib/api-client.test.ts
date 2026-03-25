import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { UserRole } from '@mmpi2/contracts';
import {
  fetchApi,
  fetchApiAsAdmin,
  fetchApiAsDoctor,
} from './api-client';
import {
  DEV_ADMIN_USER_ID,
  DEV_DOCTOR_USER_ID,
  DEV_PATIENT_USER_ID,
} from './dev-auth';

describe('api-client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('attaches patient dev auth headers for patient requests', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await fetchApi('/profiles/patient/me');

    expect(fetch).toHaveBeenCalledTimes(1);
    const [, options] = vi.mocked(fetch).mock.calls[0] ?? [];
    const headers = new Headers(options?.headers);
    expect(headers.get('x-mmpi2-user-id')).toBe(DEV_PATIENT_USER_ID);
    expect(headers.get('x-mmpi2-role')).toBe(UserRole.PATIENT);
  });

  it('attaches doctor dev auth headers for doctor requests', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await fetchApiAsDoctor('/workflow/sessions/session-123/scoring');

    const [, options] = vi.mocked(fetch).mock.calls[0] ?? [];
    const headers = new Headers(options?.headers);
    expect(headers.get('x-mmpi2-user-id')).toBe(DEV_DOCTOR_USER_ID);
    expect(headers.get('x-mmpi2-role')).toBe(UserRole.DOCTOR);
  });

  it('attaches admin dev auth headers for admin requests', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await fetchApiAsAdmin('/workflow/billing/settings');

    const [, options] = vi.mocked(fetch).mock.calls[0] ?? [];
    const headers = new Headers(options?.headers);
    expect(headers.get('x-mmpi2-user-id')).toBe(DEV_ADMIN_USER_ID);
    expect(headers.get('x-mmpi2-role')).toBe(UserRole.ADMIN);
  });

  it('adds a JSON content-type when sending a body', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await fetchApi('/workflow/requests', {
      method: 'POST',
      body: JSON.stringify({ purpose: 'Clinical evaluation' }),
    });

    const [, options] = vi.mocked(fetch).mock.calls[0] ?? [];
    const headers = new Headers(options?.headers);
    expect(headers.get('content-type')).toBe('application/json');
  });

  it('throws a useful error when the API responds with a failure', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('Not found', { status: 404, statusText: 'Not Found' }),
    );

    await expect(fetchApi('/workflow/missing')).rejects.toThrow(
      'API Error 404: Not Found Not found',
    );
  });
});
