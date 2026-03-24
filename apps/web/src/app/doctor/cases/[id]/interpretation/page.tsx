import { Save, AlertCircle } from 'lucide-react';

export default function InterpretationPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-[var(--color-primary)]">Narrative Interpretation</h2>
          <p className="text-[var(--color-on-surface-variant)] mt-1">Draft structured findings and clinical summary.</p>
        </div>
        <button type="button" className="hidden md:flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-surface-low)] transition-colors shadow-sm">
          <Save className="w-4 h-4 text-[var(--color-primary)]" />
          Save Draft
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Editor Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Validity & Test-Taking Attitude */}
          <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] p-6 md:p-8 flex flex-col gap-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-[var(--color-primary)] text-lg">Validity & Test-Taking Attitude</h3>
              <span className="text-xs font-medium px-2 py-1 bg-green-50 text-green-700 rounded-full">Valid</span>
            </div>
            <textarea 
              rows={4}
              placeholder="Summarize validity scale findings (L, F, K) and overall profile interpretability..."
              className="w-full resize-y p-4 bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 rounded-lg text-sm text-[var(--color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]/50 focus:border-[var(--color-action)] transition-all min-h-[100px]"
              defaultValue="The validity profile indicates a cooperative and open approach to the assessment. The patient responded to all items and showed no evidence of significant defensive responding (L=45) or symptom exaggeration (F=68)."
            />
          </div>

          {/* Section: Clinical Findings */}
          <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] p-6 md:p-8 flex flex-col gap-4">
            <div className="mb-2">
              <h3 className="font-semibold text-[var(--color-primary)] text-lg">Clinical Profile Findings</h3>
              <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">Address primary elevations and profile code type.</p>
            </div>
            <textarea 
              rows={8}
              placeholder="Detail symptom presentation, personality characteristics, and emotional functioning based on clinical scales..."
              className="w-full resize-y p-4 bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 rounded-lg text-sm text-[var(--color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]/50 focus:border-[var(--color-action)] transition-all min-h-[200px]"
              defaultValue="The clinical profile is characterized by moderate elevations on scales 2 (Depression, T=65), 7 (Psychasthenia, T=71), and 0 (Social Introversion, T=68). This 2-7/7-2 code type suggests the patient is currently experiencing significant distress, primarily characterized by anxiety, worry, and depressive symptoms..."
            />
          </div>

          {/* Section: Diagnostic Impressions */}
          <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] p-6 md:p-8 flex flex-col gap-4">
            <h3 className="font-semibold text-[var(--color-primary)] text-lg mb-2">Diagnostic Impressions & Recommendations</h3>
            <textarea 
              rows={5}
              placeholder="Outline diagnostic considerations and treatment recommendations..."
              className="w-full resize-y p-4 bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 rounded-lg text-sm text-[var(--color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]/50 focus:border-[var(--color-action)] transition-all min-h-[120px]"
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

          <button type="button" className="w-full flex md:hidden items-center justify-center gap-2 px-4 py-3 bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-surface-low)] transition-colors shadow-sm">
            <Save className="w-4 h-4 text-[var(--color-primary)]" />
            Save Draft
          </button>
        </div>
      </div>
    </div>
  );
}
