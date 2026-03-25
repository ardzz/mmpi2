import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { fetchApiAsDoctor } from '../../../../../lib/api-client';

interface DoctorScoringState {
  resultSet: {
    status: string;
    scoredAt: string | Date | null;
  };
  scaleResults: Array<{
    id: string;
    scaleCode: string;
    groupCode: string;
    rawScore: number;
    tScore: number | null;
    severityBand: string | null;
  }>;
  validityFlags: Array<{
    id: string;
    flagCode: string;
    severity: 'info' | 'warning' | 'critical';
    description: string;
  }>;
}

interface WorkstationPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkstationPage({ params }: WorkstationPageProps) {
  const { id } = await params;

  let scoringState: DoctorScoringState | null = null;
  try {
    scoringState = await fetchApiAsDoctor<DoctorScoringState>(`/workflow/sessions/${id}/scoring`);
  } catch (error) {
    console.error('Failed to load scoring workstation data:', error);
  }

  const validityFlags = scoringState?.validityFlags ?? [];
  const scaleResults = scoringState?.scaleResults ?? [];
  const validitySeverity = validityFlags.some((flag) => flag.severity === 'critical')
    ? 'critical'
    : validityFlags.some((flag) => flag.severity === 'warning')
      ? 'warning'
      : 'valid';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-[var(--color-primary)]">Score Workstation</h2>
          <p className="text-[var(--color-on-surface-variant)] mt-1">Review validity indicators and clinical scales.</p>
        </div>
      </div>

      {/* Validity Overview Panel */}
      <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] p-6 md:p-8">
          <h3 className="text-lg font-semibold text-[var(--color-primary)] flex items-center gap-2 mb-6">
          {validitySeverity === 'valid' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600" />
          )}
          Validity Profile
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cannot Say */}
          <div className="bg-[var(--color-surface-low)] rounded-lg p-5">
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-[var(--color-primary)]">Result Status</span>
              <span className="text-xl font-bold">{scoringState?.resultSet.status ?? 'Unavailable'}</span>
            </div>
            <p className="text-sm text-[var(--color-on-surface-variant)]">Pipeline state</p>
            <div className="mt-4 pt-4 border-t border-[var(--color-outline-variant)]/20">
              <p className="text-xs text-[var(--color-on-surface-variant)] font-medium">
                {validityFlags[0]?.description ?? 'No validity issues were returned for this session.'}
              </p>
            </div>
          </div>
          
          {/* L Scale */}
          <div className="bg-[var(--color-surface-low)] rounded-lg p-5">
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-[var(--color-primary)]">Validity Flags</span>
              <span className="text-xl font-bold">{validityFlags.length}</span>
            </div>
            <p className="text-sm text-[var(--color-on-surface-variant)]">Returned flags</p>
            <div className="mt-4 pt-4 border-t border-[var(--color-outline-variant)]/20">
              <p className="text-xs text-[var(--color-on-surface-variant)] font-medium">
                {validityFlags.length === 0 ? 'Valid profile with no flagged thresholds.' : 'Review listed flags before publication.'}
              </p>
            </div>
          </div>

          {/* F Scale */}
          <div className="bg-[var(--color-surface-low)] rounded-lg p-5 ring-1 ring-amber-500/30">
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-[var(--color-primary)]">Scale Results</span>
              <span className="text-xl font-bold text-amber-700">{scaleResults.length}</span>
            </div>
            <p className="text-sm text-[var(--color-on-surface-variant)]">Computed rows</p>
            <div className="mt-4 pt-4 border-t border-[var(--color-outline-variant)]/20">
              <p className="text-xs text-amber-700 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Moderately elevated. Review recommended.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Scales List */}
      <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] overflow-hidden">
        <div className="p-6 md:p-8 border-b border-[var(--color-outline-variant)]/10 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-[var(--color-primary)]">Clinical Scales</h3>
        </div>
        
        <div className="p-0">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--color-surface-low)]/50 border-b border-[var(--color-outline-variant)]/10">
                <th className="p-4 pl-6 md:pl-8 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase">Scale</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase text-right">Raw</th>
                <th className="p-4 pr-6 md:pr-8 text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase text-right">T-Score</th>
              </tr>
            </thead>
            <tbody>
              {scaleResults.map((scale) => (
                <tr key={scale.id} className="border-b border-[var(--color-outline-variant)]/5 hover:bg-[var(--color-surface-low)]/30 transition-colors">
                  <td className="p-4 pl-6 md:pl-8 text-sm font-medium text-[var(--color-primary)]">
                    {scale.scaleCode} ({scale.groupCode})
                  </td>
                  <td className="p-4 text-sm text-[var(--color-on-surface-variant)] text-right">{scale.rawScore}</td>
                  <td className="p-4 pr-6 md:pr-8 text-right">
                    <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-[var(--radius-md)] text-sm font-bold ${
                      scale.severityBand === 'very_high' || scale.severityBand === 'high' ? 'bg-amber-100 text-amber-800' :
                      scale.severityBand === 'moderate' ? 'bg-[var(--color-surface-dim)] text-[var(--color-primary)]' : 
                      'text-[var(--color-on-surface)]'
                    }`}>
                      {scale.tScore ?? '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Notice Card */}
      <div className="bg-blue-50 text-blue-900 rounded-xl p-4 md:p-6 flex items-start gap-4">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-700" />
        <div className="text-sm">
          <p className="font-semibold mb-1">Clinical Context Note</p>
          <p className="opacity-90">This workstation now reflects persisted scoring output. Additional queue/list endpoints are still needed for a fully connected doctor inbox.</p>
        </div>
      </div>
    </div>
  );
}
