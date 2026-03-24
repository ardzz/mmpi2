import Link from 'next/link';
import { ArrowLeft, User, Mail, Building, FileText, CheckCircle, XCircle } from 'lucide-react';

export default function AdminRequestDetailPage({ params }: { params: { id: string } }) {
  // In a real app, fetch data by params.id
  const reqId = params.id;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <Link href="/admin/requests" className="inline-flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Requests
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-[var(--color-primary)]">
            Request {reqId}
          </h1>
          <p className="text-[var(--color-on-surface-variant)] mt-1">Pending Approval • Submitted 1 hr ago</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-lowest)] text-rose-600 rounded-[var(--radius-md)] text-sm font-medium hover:bg-rose-50 transition-colors">
            <XCircle className="w-4 h-4" />
            Deny
          </button>
          <button type="button" className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-surface-lowest)] rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-primary-container)] transition-colors shadow-[var(--shadow-ambient)]">
            <CheckCircle className="w-4 h-4" />
            Approve Access
          </button>
        </div>
      </div>

      <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)]/10 overflow-hidden">
        <div className="p-6 border-b border-[var(--color-outline-variant)]/15">
          <h2 className="text-lg font-semibold text-[var(--color-on-surface)]">Requester Information</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider flex items-center gap-2 mb-1">
                <User className="w-3.5 h-3.5" /> Full Name
              </div>
              <div className="text-[var(--color-on-surface)] font-medium">Dr. Jane Smith</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider flex items-center gap-2 mb-1">
                <Mail className="w-3.5 h-3.5" /> Email Address
              </div>
              <div className="text-[var(--color-on-surface)]">jane.smith@clinic.org</div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider flex items-center gap-2 mb-1">
                <Building className="w-3.5 h-3.5" /> Organization
              </div>
              <div className="text-[var(--color-on-surface)]">Metro General Hospital</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider flex items-center gap-2 mb-1">
                <FileText className="w-3.5 h-3.5" /> Credentials
              </div>
              <div className="text-[var(--color-on-surface)]">NPI: 1234567890 • State Lic: CA-98765</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)]/10 overflow-hidden">
        <div className="p-6 border-b border-[var(--color-outline-variant)]/15">
          <h2 className="text-lg font-semibold text-[var(--color-on-surface)]">Additional Context</h2>
        </div>
        <div className="p-6">
          <p className="text-[var(--color-on-surface-variant)] text-sm leading-relaxed">
            User is requesting access to the platform as a licensed psychologist. The NPI number has been verified automatically against the registry. No red flags detected in the preliminary background check. Action required to provision the clinical workspace.
          </p>
        </div>
      </div>
    </div>
  );
}
