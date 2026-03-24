import Link from 'next/link';
import { FileText, Download, Calendar, ArrowRight, Activity, Clock } from 'lucide-react';

export const metadata = {
  title: 'Documents & Reports | MMPI-2 Platform',
  description: 'View and download your clinical reports and assessment results',
};

// Mock data to represent the eventual API payload
const mockDocuments = [
  {
    id: 'doc_101',
    title: 'Comprehensive Evaluation Report',
    type: 'Clinical Report',
    date: 'October 12, 2023',
    provider: 'Dr. Sarah Jenkins',
    status: 'Available',
    icon: FileText,
  },
  {
    id: 'doc_102',
    title: 'MMPI-2 Profile Summary',
    type: 'Assessment Results',
    date: 'October 10, 2023',
    provider: 'Automated Scoring System',
    status: 'Available',
    icon: Activity,
  },
  {
    id: 'doc_103',
    title: 'Initial Intake Notes',
    type: 'Clinical Record',
    date: 'September 28, 2023',
    provider: 'Dr. Sarah Jenkins',
    status: 'Pending Review',
    icon: Clock,
  }
];

export default function DocumentsHubPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-[var(--color-primary)]">
          Documents & Reports
        </h1>
        <p className="mt-2 text-[var(--color-on-surface-variant)] text-lg max-w-2xl">
          Access your clinical reports, assessment summaries, and official records. These documents are securely stored for your reference.
        </p>
      </div>

      <div className="grid gap-4">
        {mockDocuments.map((doc) => {
          const Icon = doc.icon;
          const isPending = doc.status === 'Pending Review';

          return (
            <Link
              key={doc.id}
              href={`/patient/documents/${doc.id}`}
              className={`group flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[var(--radius-lg)] bg-[var(--color-surface-lowest)] shadow-[var(--shadow-ambient)] hover:shadow-md transition-all ${
                isPending ? 'opacity-80' : ''
              }`}
            >
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-full bg-[var(--color-surface-low)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--color-surface-high)] transition-colors">
                  <Icon className={`w-6 h-6 ${isPending ? 'text-[var(--color-outline-variant)]' : 'text-[var(--color-primary)]'}`} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-[var(--color-on-surface)] mb-1 group-hover:text-[var(--color-action)] transition-colors">
                    {doc.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--color-on-surface-variant)]">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      {doc.type}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {doc.date}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 md:mt-0 flex items-center justify-between md:justify-end gap-4 pl-17 md:pl-0">
                {isPending ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-surface-low)] text-[var(--color-on-surface-variant)]">
                    Pending Provider Review
                  </span>
                ) : (
                  <>
                    <button 
                      type="button"
                      className="inline-flex items-center justify-center p-2 rounded-full hover:bg-[var(--color-surface-low)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-action)] transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-5 h-5" />
                      <span className="sr-only">Download</span>
                    </button>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-surface-low)] group-hover:bg-[var(--color-primary)]/10 transition-colors">
                      <ArrowRight className="w-4 h-4 text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)]" />
                    </div>
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
