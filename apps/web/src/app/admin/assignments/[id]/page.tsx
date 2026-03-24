import Link from 'next/link';
import { ArrowLeft, Stethoscope, User, AlertCircle, Shuffle } from 'lucide-react';

export default function AdminAssignmentPage({ params }: { params: { id: string } }) {
  const caseId = params.id;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <Link href="/admin/requests" className="inline-flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Triage Queue
      </Link>

      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-[var(--color-primary)]">
          Case Triage: {caseId}
        </h1>
        <p className="text-[var(--color-on-surface-variant)] mt-1">Assign clinical personnel to completed assessment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Case Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)]/10 overflow-hidden">
            <div className="p-5 border-b border-[var(--color-outline-variant)]/15 flex items-center gap-2">
              <User className="w-5 h-5 text-[var(--color-primary)]" />
              <h2 className="font-semibold text-[var(--color-on-surface)]">Patient Profile</h2>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider block mb-1">Status</div>
                <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">Assessment Complete</span>
              </div>
              <div>
                <div className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider block mb-1">Time Elapsed</div>
                <div className="text-sm font-medium text-[var(--color-on-surface)]">45 mins</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider block mb-1">Validity Indicators</div>
                <div className="text-sm font-medium text-amber-600 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Elevated VRIN
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)]/10 overflow-hidden">
            <div className="p-5 border-b border-[var(--color-outline-variant)]/15">
              <h2 className="font-semibold text-[var(--color-on-surface)]">Clinical Assignment</h2>
            </div>
            <div className="p-5">
              <div className="text-sm font-medium text-[var(--color-on-surface)] block mb-3">Select Attending Clinician</div>
              <div className="space-y-2">
                {[
                  { id: 'dr_sconnor', name: 'Dr. Sarah Connor', load: '3 active cases', specialty: 'General' },
                  { id: 'dr_jwilson', name: 'Dr. James Wilson', load: '1 active case', specialty: 'Forensic' },
                  { id: 'dr_ablack', name: 'Dr. Anna Black', load: '5 active cases', specialty: 'Clinical' },
                ].map((doc) => (
                  <label key={doc.id} className="flex items-center justify-between p-3 border border-[var(--color-outline-variant)]/20 rounded-[var(--radius-md)] cursor-pointer hover:bg-[var(--color-surface-low)] transition-colors">
                    <div className="flex items-center gap-3">
                      <input type="radio" name="clinician" className="text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                      <div>
                        <div className="font-medium text-[var(--color-on-surface)] text-sm flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-[var(--color-on-surface-variant)]" />
                          {doc.name}
                        </div>
                        <div className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">{doc.specialty}</div>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-[var(--color-on-surface-variant)] bg-[var(--color-surface)] px-2 py-1 rounded">
                      {doc.load}
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button type="button" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-[var(--color-surface-lowest)] rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-primary-container)] transition-colors shadow-[var(--shadow-ambient)]">
                  <Shuffle className="w-4 h-4" />
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Triage Guidelines */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-[var(--color-surface-low)] p-5 rounded-xl border border-[var(--color-outline-variant)]/10">
            <h3 className="text-sm font-semibold text-[var(--color-on-surface)] mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[var(--color-primary)]" />
              Triage Rules
            </h3>
            <ul className="text-xs text-[var(--color-on-surface-variant)] space-y-3 leading-relaxed">
              <li>• Assign cases within 4 hours of completion to meet SLA.</li>
              <li>• Elevated validity scales (VRIN/TRIN) should be routed to senior clinicians.</li>
              <li>• Balance load to avoid exceeding 10 active cases per clinician.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
