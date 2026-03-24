import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';

export default function PatientProfilePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/patient" className="p-2 rounded-full hover:bg-[var(--color-surface-low)] transition-colors text-[var(--color-on-surface-variant)]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-[var(--color-primary)]">
            Clinical Profile
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            Please ensure this information is accurate for clinical records.
          </p>
        </div>
      </div>

      <div className="bg-[var(--color-surface-lowest)] rounded-[var(--radius-lg)] shadow-[var(--shadow-ambient)]">
        <form className="p-6 md:p-8 space-y-8">
          
          {/* Section 1: Personal Info */}
          <div>
            <h2 className="text-lg font-medium text-[var(--color-on-surface)] mb-4 border-b border-[var(--color-outline-variant)]/15 pb-2">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-[var(--color-on-surface)]">
                  First name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    defaultValue="Alex"
                    className="block w-full appearance-none rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/15 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 sm:text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-[var(--color-on-surface)]">
                  Last name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    defaultValue="Doe"
                    className="block w-full appearance-none rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/15 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-[var(--color-on-surface)]">
                  Date of Birth
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    id="dob"
                    name="dob"
                    className="block w-full appearance-none rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/15 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[var(--color-on-surface)]">
                  Phone number
                </label>
                <div className="mt-1">
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="(555) 000-0000"
                    className="block w-full appearance-none rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/15 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Details */}
          <div>
            <h2 className="text-lg font-medium text-[var(--color-on-surface)] mb-4 border-b border-[var(--color-outline-variant)]/15 pb-2">
              Clinical Context
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="reason" className="block text-sm font-medium text-[var(--color-on-surface)]">
                  Primary reason for assessment (Optional)
                </label>
                <div className="mt-1">
                  <textarea
                    id="reason"
                    name="reason"
                    rows={3}
                    className="block w-full appearance-none rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/15 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 sm:text-sm"
                    placeholder="Briefly describe why you are seeking this assessment..."
                  />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="referring" className="block text-sm font-medium text-[var(--color-on-surface)]">
                  Referring Clinician (If applicable)
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="referring"
                    name="referring"
                    placeholder="Dr. Smith"
                    className="block w-full appearance-none rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/15 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[var(--color-outline-variant)]/15 gap-3">
            <Link 
              href="/patient"
              className="inline-flex justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)]/15 px-4 py-2 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-surface-low)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-ambient)] hover:from-[var(--color-primary-container)] hover:to-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] transition-all"
            >
              <Save className="w-4 h-4" />
              Save Profile
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
