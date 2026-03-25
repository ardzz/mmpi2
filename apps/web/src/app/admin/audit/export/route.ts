import { NextResponse } from 'next/server';
import { DEV_ADMIN_AUTH } from '../../../../lib/dev-auth';

const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function GET() {
  const response = await fetch(`${API_BASE_URL}/admin/audit/export`, {
    headers: {
      'x-mmpi2-user-id': DEV_ADMIN_AUTH.userId,
      'x-mmpi2-role': DEV_ADMIN_AUTH.role,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await response.text();
    return NextResponse.json({ message }, { status: response.status });
  }

  const csv = await response.text();

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="audit-log.csv"',
    },
  });
}
