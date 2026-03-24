import Link from 'next/link';
import { FileCheck, ShieldAlert, Send, Eye } from 'lucide-react';

export default function FinalizePage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center mb-10 mt-6">
        <div className="w-16 h-16 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto mb-4">
          <FileCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl md:text-3xl font-display font-bold text-[var(--color-primary)]">Finalize & Publish</h2>
        <p className="text-[var(--color-on-surface-variant)] mt-2">Review final document and confirm publication to patient portal.</p>
      </div>

      {/* Review Checklist */}
      <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] overflow-hidden">
        <div className="p-6 md:p-8 border-b border-[var(--color-outline-variant)]/10">
          <h3 className="font-semibold text-[var(--color-primary)] text-lg mb-1">Pre-publication Checklist</h3>
          <p className="text-sm text-[var(--color-on-surface-variant)]">Please verify the following before releasing the report.</p>
        </div>
        
        <div className="p-6 md:p-8 space-y-4">
          <label className="flex items-start gap-4 p-4 bg-[var(--color-surface-low)]/50 rounded-xl border border-[var(--color-outline-variant)]/10 cursor-pointer hover:bg-[var(--color-surface-low)] transition-colors">
            <input type="checkbox" className="mt-1 w-5 h-5 rounded text-[var(--color-action)] border-[var(--color-outline-variant)] focus:ring-[var(--color-action)]" />
            <div>
              <span className="block text-sm font-semibold text-[var(--color-on-surface)]">Interpretive Narrative Completed</span>
              <span className="block text-xs text-[var(--color-on-surface-variant)] mt-1">All required sections of the narrative summary have been drafted and reviewed.</span>
            </div>
          </label>
          
          <label className="flex items-start gap-4 p-4 bg-[var(--color-surface-low)]/50 rounded-xl border border-[var(--color-outline-variant)]/10 cursor-pointer hover:bg-[var(--color-surface-low)] transition-colors">
            <input type="checkbox" className="mt-1 w-5 h-5 rounded text-[var(--color-action)] border-[var(--color-outline-variant)] focus:ring-[var(--color-action)]" />
            <div>
              <span className="block text-sm font-semibold text-[var(--color-on-surface)]">Diagnostic Accuracy Confirmed</span>
              <span className="block text-xs text-[var(--color-on-surface-variant)] mt-1">Findings align with validity indicators and clinical scale configurations.</span>
            </div>
          </label>

          <label className="flex items-start gap-4 p-4 bg-[var(--color-surface-low)]/50 rounded-xl border border-[var(--color-outline-variant)]/10 cursor-pointer hover:bg-[var(--color-surface-low)] transition-colors">
            <input type="checkbox" className="mt-1 w-5 h-5 rounded text-[var(--color-action)] border-[var(--color-outline-variant)] focus:ring-[var(--color-action)]" />
            <div>
              <span className="block text-sm font-semibold text-[var(--color-on-surface)]">Patient Identity Verified</span>
              <span className="block text-xs text-[var(--color-on-surface-variant)] mt-1">Confirm that this report accurately corresponds to the intended patient record.</span>
            </div>
          </label>
        </div>
      </div>

      {/* Attestation & Action */}
      <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] p-6 md:p-8 flex flex-col items-center text-center">
        <ShieldAlert className="w-8 h-8 text-amber-600 mb-4" />
        <h4 className="font-semibold text-[var(--color-primary)] text-lg mb-2">Clinical Attestation</h4>
        <p className="text-sm text-[var(--color-on-surface-variant)] mb-8 max-w-2xl">
          By publishing this report, I attest that the interpretation is based on standard clinical guidelines for the MMPI-2 and represents my professional evaluation of the raw data provided. Once published, this document will be securely available to the patient.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <button type="button" className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface)] rounded-[var(--radius-md)] text-sm font-semibold hover:bg-[var(--color-surface-low)] transition-all">
            <Eye className="w-4 h-4" />
            Preview PDF
          </button>
          <Link 
            href="/doctor/cases"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-[var(--color-surface-lowest)] rounded-[var(--radius-md)] text-sm font-semibold hover:bg-[var(--color-primary-container)] transition-all shadow-md hover:shadow-lg"
          >
            <Send className="w-4 h-4" />
            Publish Report
          </Link>
        </div>
      </div>
    </div>
  );
}
