import { AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function WorkstationPage() {
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
          <CheckCircle className="w-5 h-5 text-green-600" />
          Validity Profile
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cannot Say */}
          <div className="bg-[var(--color-surface-low)] rounded-lg p-5">
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-[var(--color-primary)]">Cannot Say (?)</span>
              <span className="text-xl font-bold">2</span>
            </div>
            <p className="text-sm text-[var(--color-on-surface-variant)]">Raw Score</p>
            <div className="mt-4 pt-4 border-t border-[var(--color-outline-variant)]/20">
              <p className="text-xs text-green-700 font-medium">Valid. Few omitted items.</p>
            </div>
          </div>
          
          {/* L Scale */}
          <div className="bg-[var(--color-surface-low)] rounded-lg p-5">
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-[var(--color-primary)]">Lie (L)</span>
              <span className="text-xl font-bold">45</span>
            </div>
            <p className="text-sm text-[var(--color-on-surface-variant)]">T-Score</p>
            <div className="mt-4 pt-4 border-t border-[var(--color-outline-variant)]/20">
              <p className="text-xs text-green-700 font-medium">Valid. Average defensive responding.</p>
            </div>
          </div>

          {/* F Scale */}
          <div className="bg-[var(--color-surface-low)] rounded-lg p-5 ring-1 ring-amber-500/30">
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-[var(--color-primary)]">Infrequency (F)</span>
              <span className="text-xl font-bold text-amber-700">68</span>
            </div>
            <p className="text-sm text-[var(--color-on-surface-variant)]">T-Score</p>
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
              {[
                { id: '1', name: 'Hs (Hypochondriasis)', raw: 14, tScore: 58 },
                { id: '2', name: 'D (Depression)', raw: 25, tScore: 65, highlight: true },
                { id: '3', name: 'Hy (Hysteria)', raw: 22, tScore: 55 },
                { id: '4', name: 'Pd (Psychopathic Deviate)', raw: 18, tScore: 50 },
                { id: '5', name: 'Mf (Masculinity/Femininity)', raw: 29, tScore: 48 },
                { id: '6', name: 'Pa (Paranoia)', raw: 11, tScore: 52 },
                { id: '7', name: 'Pt (Psychasthenia)', raw: 32, tScore: 71, highlight: true, alert: true },
                { id: '8', name: 'Sc (Schizophrenia)', raw: 28, tScore: 62 },
                { id: '9', name: 'Ma (Hypomania)', raw: 15, tScore: 45 },
                { id: '0', name: 'Si (Social Introversion)', raw: 42, tScore: 68, highlight: true },
              ].map((scale) => (
                <tr key={scale.id} className="border-b border-[var(--color-outline-variant)]/5 hover:bg-[var(--color-surface-low)]/30 transition-colors">
                  <td className="p-4 pl-6 md:pl-8 text-sm font-medium text-[var(--color-primary)]">
                    {scale.name}
                  </td>
                  <td className="p-4 text-sm text-[var(--color-on-surface-variant)] text-right">{scale.raw}</td>
                  <td className="p-4 pr-6 md:pr-8 text-right">
                    <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-[var(--radius-md)] text-sm font-bold ${
                      scale.alert ? 'bg-amber-100 text-amber-800' :
                      scale.highlight ? 'bg-[var(--color-surface-dim)] text-[var(--color-primary)]' : 
                      'text-[var(--color-on-surface)]'
                    }`}>
                      {scale.tScore}
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
          <p className="opacity-90">This workstation displays standardized unadjusted T-Scores. K-corrected scores should be referenced in the full profile export if applicable for the patient demographic.</p>
        </div>
      </div>
    </div>
  );
}
