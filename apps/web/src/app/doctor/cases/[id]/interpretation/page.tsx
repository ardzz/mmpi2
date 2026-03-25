import { Save, AlertCircle } from 'lucide-react';
import { fetchApiAsDoctor } from '../../../../../lib/api-client';
import type { SaveDraftReportDto } from '@mmpi2/contracts';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

interface ReportAuthoringStateResponse {
  report: {
    interpretationSummary: string | null;
    narrative: string | null;
    supplementalObservations: Record<string, unknown> | null;
  } | null;
}

interface InterpretationPageProps {
  params: Promise<{ id: string }>;
}

export default async function InterpretationPage({ params }: InterpretationPageProps) {
  const { id } = await params;

  let reportState: ReportAuthoringStateResponse | null = null;
  try {
    reportState = await fetchApiAsDoctor<ReportAuthoringStateResponse>(`/workflow/sessions/${id}/report`);
  } catch (error) {
    console.error('Failed to load doctor report state:', error);
  }

  async function saveDraft(formData: FormData) {
    'use server';

    const payload: SaveDraftReportDto = {
      interpretationSummary: ((formData.get('validitySummary') as string | null) ?? '').trim() || undefined,
      narrative: ((formData.get('clinicalFindings') as string | null) ?? '').trim() || undefined,
      supplementalObservations: ((formData.get('diagnosticImpressions') as string | null) ?? '').trim()
        ? { conclusion: (formData.get('diagnosticImpressions') as string).trim() }
        : undefined,
    };

    await fetchApiAsDoctor(`/workflow/sessions/${id}/report/draft`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    revalidatePath(`/doctor/cases/${id}/interpretation`);
    revalidatePath(`/doctor/cases/${id}/finalize`);
    redirect(`/doctor/cases/${id}/finalize`);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-[var(--color-primary)]">Narrative Interpretation</h2>
          <p className="text-[var(--color-on-surface-variant)] mt-1">Draft structured findings and clinical summary.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-on-surface-variant)] shadow-sm">
          <Save className="w-4 h-4 text-[var(--color-primary)]" />
          Drafts save through the report API
        </div>
      </div>

      <form action={saveDraft} className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Editor Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Validity & Test-Taking Attitude */}
          <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] p-6 md:p-8 flex flex-col gap-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-[var(--color-primary)] text-lg">Validity & Test-Taking Attitude</h3>
              <span className="text-xs font-medium px-2 py-1 bg-green-50 text-green-700 rounded-full">Valid</span>
            </div>
            <textarea 
              name="validitySummary"
              rows={4}
              placeholder="Summarize validity scale findings (L, F, K) and overall profile interpretability..."
              className="w-full resize-y p-4 bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 rounded-lg text-sm text-[var(--color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]/50 focus:border-[var(--color-action)] transition-all min-h-[100px]"
              defaultValue={reportState?.report?.interpretationSummary ?? ''}
            />
          </div>

          {/* Section: Clinical Findings */}
          <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] p-6 md:p-8 flex flex-col gap-4">
            <div className="mb-2">
              <h3 className="font-semibold text-[var(--color-primary)] text-lg">Clinical Profile Findings</h3>
              <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">Address primary elevations and profile code type.</p>
            </div>
            <textarea 
              name="clinicalFindings"
              rows={8}
              placeholder="Detail symptom presentation, personality characteristics, and emotional functioning based on clinical scales..."
              className="w-full resize-y p-4 bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 rounded-lg text-sm text-[var(--color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]/50 focus:border-[var(--color-action)] transition-all min-h-[200px]"
              defaultValue={reportState?.report?.narrative ?? ''}
            />
          </div>

          {/* Section: Diagnostic Impressions */}
          <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] p-6 md:p-8 flex flex-col gap-4">
            <h3 className="font-semibold text-[var(--color-primary)] text-lg mb-2">Diagnostic Impressions & Recommendations</h3>
            <textarea 
              name="diagnosticImpressions"
              rows={5}
              placeholder="Outline diagnostic considerations and treatment recommendations..."
              className="w-full resize-y p-4 bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 rounded-lg text-sm text-[var(--color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]/50 focus:border-[var(--color-action)] transition-all min-h-[120px]"
              defaultValue={typeof reportState?.report?.supplementalObservations?.conclusion === 'string' ? reportState.report.supplementalObservations.conclusion : ''}
            />
          </div>
        </div>

        {/* Sidebar Context */}
        <div className="space-y-6">
          <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] p-6 border-t-4 border-[var(--color-primary)]">
            <h4 className="font-semibold text-[var(--color-primary)] mb-4 text-sm uppercase tracking-wider">Clinical Reference</h4>
            
            <div className="space-y-4">
              <div className="p-3 bg-[var(--color-surface-low)] rounded-lg">
                <span className="block text-xs font-semibold text-[var(--color-on-surface-variant)] mb-1">Code Type</span>
                <span className="block text-lg font-bold text-[var(--color-primary)]">2-7 / 7-2</span>
              </div>
              
              <div className="p-3 bg-[var(--color-surface-low)] rounded-lg">
                <span className="block text-xs font-semibold text-[var(--color-on-surface-variant)] mb-1">Significant Elevations (T &ge; 65)</span>
                <ul className="mt-2 space-y-1">
                  <li className="text-sm font-medium flex justify-between">
                    <span>Pt (7)</span> <span className="text-[var(--color-primary)]">71</span>
                  </li>
                  <li className="text-sm font-medium flex justify-between">
                    <span>Si (0)</span> <span className="text-[var(--color-primary)]">68</span>
                  </li>
                  <li className="text-sm font-medium flex justify-between">
                    <span>D (2)</span> <span className="text-[var(--color-primary)]">65</span>
                  </li>
                </ul>
              </div>

              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg text-amber-900 border border-amber-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <div className="text-xs font-medium">
                  Notice: Scale 7 (Pt) elevation suggests significant acute distress. Prioritize evaluating for anxiety disorders.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] p-6">
            <h4 className="font-semibold text-[var(--color-primary)] mb-4 text-sm uppercase tracking-wider">Report Components</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-2 hover:bg-[var(--color-surface-low)] rounded-lg cursor-pointer transition-colors">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[var(--color-action)] border-[var(--color-outline-variant)] focus:ring-[var(--color-action)]" />
                <span className="text-sm text-[var(--color-on-surface)]">Include Standard Validity Section</span>
              </label>
              <label className="flex items-center gap-3 p-2 hover:bg-[var(--color-surface-low)] rounded-lg cursor-pointer transition-colors">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[var(--color-action)] border-[var(--color-outline-variant)] focus:ring-[var(--color-action)]" />
                <span className="text-sm text-[var(--color-on-surface)]">Include Clinical Scale Scores</span>
              </label>
              <label className="flex items-center gap-3 p-2 hover:bg-[var(--color-surface-low)] rounded-lg cursor-pointer transition-colors">
                <input type="checkbox" className="w-4 h-4 rounded text-[var(--color-action)] border-[var(--color-outline-variant)] focus:ring-[var(--color-action)]" />
                <span className="text-sm text-[var(--color-on-surface)]">Include Content Scale Appendix</span>
              </label>
            </div>
          </div>

          <button type="submit" className="w-full flex md:hidden items-center justify-center gap-2 px-4 py-3 bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-surface-low)] transition-colors shadow-sm">
            <Save className="w-4 h-4 text-[var(--color-primary)]" />
            Save Draft
          </button>
        </div>
      </form>
    </div>
  );
}
