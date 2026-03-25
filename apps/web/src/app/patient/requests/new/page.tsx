import Link from 'next/link';
import { ArrowLeft, ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import { fetchApi } from '../../../../lib/api-client';
import { redirect } from 'next/navigation';
import type { CreateAssessmentRequestDto, AssessmentRequest } from '@mmpi2/contracts';

export default function NewRequestPage() {
  async function createRequest(formData: FormData) {
    'use server';
    
    const payload: CreateAssessmentRequestDto = {
      purpose: ((formData.get('reason') as string | null) ?? '').trim() || undefined,
    };

    let request: AssessmentRequest;
    try {
      request = await fetchApi<AssessmentRequest>('/workflow/requests', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Failed to create request:', error);
      // In a real app we'd show an error state, for now redirect back
      redirect('/patient');
    }
    
    // Redirect to payment with the request ID
    redirect(`/patient/payment?requestId=${request.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/patient" className="p-2 rounded-full hover:bg-[var(--color-surface-low)] transition-colors text-[var(--color-on-surface-variant)]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-[var(--color-primary)]">
            Request Assessment
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            Initiate a new MMPI-2 clinical assessment.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--color-surface-lowest)] rounded-[var(--radius-lg)] shadow-[var(--shadow-ambient)] p-6 md:p-8">
            <h2 className="text-lg font-medium text-[var(--color-on-surface)] mb-6 border-b border-[var(--color-outline-variant)]/15 pb-2">
              Assessment Details
            </h2>
            
            <form action={createRequest} className="space-y-6">
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-[var(--color-on-surface)]">
                  Primary reason for assessment
                </label>
                <p className="text-xs text-[var(--color-on-surface-variant)] mt-1 mb-2">
                  This helps clinicians contextualize your results.
                </p>
                <div className="mt-1">
                  <select
                    id="reason"
                    name="reason"
                    className="block w-full appearance-none rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2.5 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/15 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 sm:text-sm"
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="Clinical Evaluation">Clinical Evaluation</option>
                    <option value="Pre-employment Screening">Pre-employment Screening</option>
                    <option value="Legal / Court Ordered">Legal / Court Ordered</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-[var(--color-on-surface)]">
                  Additional Notes (Optional)
                </label>
                <div className="mt-1">
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    className="block w-full appearance-none rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/15 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 sm:text-sm"
                    placeholder="Any specific context you would like to share..."
                  />
                </div>
              </div>

              <div className="bg-[var(--color-surface-low)] rounded-[var(--radius-md)] p-4 flex gap-3">
                <ShieldCheck className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-[var(--color-on-surface)]">Privacy & Confidentiality</p>
                  <p className="text-[var(--color-on-surface-variant)] mt-1">
                    Your assessment results and personal information are strictly confidential and will only be shared with authorized clinical personnel.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-[var(--color-outline-variant)]/15 flex justify-end">
                <button 
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] px-6 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-ambient)] hover:from-[var(--color-primary-container)] hover:to-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] transition-all"
                >
                  Continue to Payment <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[var(--color-surface-lowest)] rounded-[var(--radius-lg)] shadow-[var(--shadow-ambient)] p-6">
            <h3 className="font-medium text-[var(--color-on-surface)] mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[var(--color-on-surface-variant)]" />
              What to expect
            </h3>
            <ul className="space-y-4 text-sm text-[var(--color-on-surface-variant)]">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-surface-low)] flex items-center justify-center text-[var(--color-primary)] font-medium text-xs">1</span>
                <span>Complete payment to secure your assessment session.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-surface-low)] flex items-center justify-center text-[var(--color-primary)] font-medium text-xs">2</span>
                <span>Wait for clinical approval (typically 1-2 business days).</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-surface-low)] flex items-center justify-center text-[var(--color-primary)] font-medium text-xs">3</span>
                <span>Complete the 567-question MMPI-2 assessment in one sitting.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-surface-low)] flex items-center justify-center text-[var(--color-primary)] font-medium text-xs">4</span>
                <span>Review your results securely in the patient portal.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
