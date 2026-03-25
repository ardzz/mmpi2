import Link from 'next/link';
import { ArrowLeft, Calendar, CheckCircle, CreditCard, UserRound, XCircle } from 'lucide-react';
import type { AdminRequestDetail } from '@mmpi2/contracts';
import { fetchApiAsAdmin } from '../../../../lib/api-client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

interface AdminRequestDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatRequestedDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export default async function AdminRequestDetailPage({ params }: AdminRequestDetailPageProps) {
  const { id } = await params;

  const request = await fetchApiAsAdmin<AdminRequestDetail>(`/workflow/admin/requests/${id}`);

  async function reviewRequest(formData: FormData) {
    'use server';

    const decision = formData.get('decision');
    const adminNote = ((formData.get('adminNote') as string | null) ?? '').trim();
    if (decision !== 'approved' && decision !== 'rejected') {
      return;
    }

    await fetchApiAsAdmin(`/workflow/requests/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({
        decision,
        adminNote: adminNote.length > 0 ? adminNote : undefined,
      }),
    });

    revalidatePath('/admin/requests');
    revalidatePath(`/admin/requests/${id}`);
    redirect(`/admin/requests/${id}`);
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <Link href="/admin/requests" className="inline-flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Requests
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-[var(--color-primary)]">Request {request.id.slice(0, 8)}</h1>
          <p className="text-[var(--color-on-surface-variant)] mt-1">{request.requestStatus} • requested {formatRequestedDate(request.requestedAt)}</p>
        </div>
        <form action={reviewRequest} className="flex flex-col gap-3 md:min-w-[22rem]">
          <textarea
            name="adminNote"
            defaultValue={request.adminNote ?? ''}
            placeholder="Add an internal review note for billing, assignment, or follow-up context..."
            className="min-h-24 rounded-[var(--radius-md)] border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-lowest)] px-3 py-2 text-sm text-[var(--color-on-surface)] shadow-[var(--shadow-ambient)] focus:outline-none focus:border-[var(--color-primary)]"
          />
          <div className="flex items-center gap-3">
            <button type="submit" name="decision" value="rejected" className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-lowest)] text-rose-600 rounded-[var(--radius-md)] text-sm font-medium hover:bg-rose-50 transition-colors">
              <XCircle className="w-4 h-4" />
              Deny
            </button>
            <button type="submit" name="decision" value="approved" className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-surface-lowest)] rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-primary-container)] transition-colors shadow-[var(--shadow-ambient)]">
              <CheckCircle className="w-4 h-4" />
              Approve Access
            </button>
          </div>
        </form>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)]/10 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--color-on-surface)]">Patient & assignment</h2>
          <p className="text-sm text-[var(--color-on-surface-variant)] inline-flex items-center gap-2">
            <UserRound className="w-4 h-4" />
            {request.patientFullName}
          </p>
          <p className="text-sm text-[var(--color-on-surface-variant)]">Assigned doctor: {request.doctorName ?? 'Unassigned'}</p>
          <p className="text-sm text-[var(--color-on-surface-variant)]">Purpose: {request.purpose ?? 'MMPI-2 assessment request'}</p>
          <p className="text-sm text-[var(--color-on-surface-variant)]">Admin note: {request.adminNote ?? 'No note recorded yet.'}</p>
        </div>

        <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)]/10 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--color-on-surface)]">Workflow & billing</h2>
          <p className="text-sm text-[var(--color-on-surface-variant)] inline-flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Requested on {formatRequestedDate(request.requestedAt)}
          </p>
          <p className="text-sm text-[var(--color-on-surface-variant)]">Session status: {request.sessionStatus ?? 'No session yet'}</p>
          <p className="text-sm text-[var(--color-on-surface-variant)] inline-flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            {request.paymentRequirement} · {request.paymentSatisfied ? 'billing satisfied' : 'billing pending'}
          </p>
          {request.paymentStatus ? (
            <p className="text-sm text-[var(--color-on-surface-variant)]">
              Payment state: {request.paymentStatus} {request.paymentAmount !== null ? `(${request.paymentCurrency} ${request.paymentAmount})` : ''}
            </p>
          ) : null}
          {request.latestPaymentEventType ? (
            <p className="text-sm text-[var(--color-on-surface-variant)]">
              Latest payment event: {request.latestPaymentEventType}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
