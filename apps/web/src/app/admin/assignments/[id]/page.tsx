import Link from 'next/link';
import { AlertCircle, ArrowLeft, Shuffle, Stethoscope, User } from 'lucide-react';
import type { AdminAssignmentDetail } from '@mmpi2/contracts';
import { fetchApiAsAdmin } from '../../../../lib/api-client';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

interface AdminAssignmentPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminAssignmentPage({ params }: AdminAssignmentPageProps) {
  const { id } = await params;
  const assignment = await fetchApiAsAdmin<AdminAssignmentDetail>(`/workflow/admin/assignments/${id}`);

  async function confirmAssignment(formData: FormData) {
    'use server';

    const doctorUserId = (formData.get('doctorUserId') as string | null) ?? assignment.doctorUserId;
    if (!doctorUserId) {
      return;
    }

    await fetchApiAsAdmin(`/workflow/requests/${id}/doctor`, {
      method: 'PATCH',
      body: JSON.stringify({ doctorUserId }),
    });

    revalidatePath(`/admin/assignments/${id}`);
    revalidatePath(`/admin/requests/${id}`);
    revalidatePath('/admin/requests');
    redirect(`/admin/requests/${id}`);
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <Link href="/admin/requests" className="inline-flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Triage Queue
      </Link>

      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-[var(--color-primary)]">Case Triage: {assignment.id.slice(0, 8)}</h1>
        <p className="text-[var(--color-on-surface-variant)] mt-1">Assign the most appropriate active clinician for this request.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)]/10 overflow-hidden">
            <div className="p-5 border-b border-[var(--color-outline-variant)]/15 flex items-center gap-2">
              <User className="w-5 h-5 text-[var(--color-primary)]" />
              <h2 className="font-semibold text-[var(--color-on-surface)]">Patient & Request Overview</h2>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider block mb-1">Patient</div>
                <div className="text-[var(--color-on-surface)] font-medium">{assignment.patientFullName}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider block mb-1">Workflow</div>
                <div className="text-[var(--color-on-surface)] font-medium">{assignment.requestStatus}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider block mb-1">Payment</div>
                <div className="text-[var(--color-on-surface)] font-medium">{assignment.paymentRequirement} · {assignment.paymentSatisfied ? 'satisfied' : 'pending'}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider block mb-1">Session</div>
                <div className="text-[var(--color-on-surface)] font-medium">{assignment.sessionStatus ?? 'No session yet'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider block mb-1">Purpose</div>
                <div className="text-[var(--color-on-surface)]">{assignment.purpose ?? 'MMPI-2 assessment request'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider block mb-1">Admin note</div>
                <div className="text-[var(--color-on-surface)]">{assignment.adminNote ?? 'No admin note recorded.'}</div>
              </div>
            </div>
          </div>

          <form action={confirmAssignment} className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)]/10 overflow-hidden">
            <div className="p-5 border-b border-[var(--color-outline-variant)]/15">
              <h2 className="font-semibold text-[var(--color-on-surface)]">Clinical Assignment</h2>
            </div>
            <div className="p-5">
              <div className="text-sm font-medium text-[var(--color-on-surface)] block mb-3">Available Clinicians</div>
              <div className="space-y-2">
                {assignment.candidates.map((doctor) => (
                  <label key={doctor.userId} className="flex items-center justify-between p-3 border border-[var(--color-outline-variant)]/20 rounded-[var(--radius-md)] cursor-pointer hover:bg-[var(--color-surface-low)] transition-colors">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="doctorUserId"
                        value={doctor.userId}
                        defaultChecked={doctor.userId === assignment.doctorUserId}
                        className="text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      />
                      <div>
                        <div className="font-medium text-[var(--color-on-surface)] text-sm flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-[var(--color-on-surface-variant)]" />
                          {doctor.fullName}
                        </div>
                        <div className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">
                          {doctor.specialty ?? 'Clinical Psychology'} • {doctor.licenseNumber ?? 'License pending'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-[var(--color-on-surface-variant)] bg-[var(--color-surface)] px-2 py-1 rounded">
                      {doctor.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-[var(--color-surface-lowest)] rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-primary-container)] transition-colors shadow-[var(--shadow-ambient)]">
                  <Shuffle className="w-4 h-4" />
                  Confirm Assignment
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="md:col-span-1 space-y-4">
          <div className="bg-[var(--color-surface-low)] p-5 rounded-xl border border-[var(--color-outline-variant)]/10">
            <h3 className="text-sm font-semibold text-[var(--color-on-surface)] mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[var(--color-primary)]" />
              Triage Guidance
            </h3>
            <ul className="text-xs text-[var(--color-on-surface-variant)] space-y-3 leading-relaxed">
              <li>• Prefer currently active clinicians with a matching specialty.</li>
              <li>• Review payment and session status before assigning urgent review work.</li>
              <li>• Use the request queue and audit views for broader operational history.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
