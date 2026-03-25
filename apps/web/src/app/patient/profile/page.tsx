import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { fetchApi } from '../../../lib/api-client';
import { Gender } from '@mmpi2/contracts';
import type { PatientProfile, UpsertPatientProfileDto } from '@mmpi2/contracts';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export default async function PatientProfilePage() {
  let profile: PatientProfile | null = null;
  try {
    profile = await fetchApi<PatientProfile>('/profiles/patient/me');
  } catch (error) {
    console.error('Failed to load patient profile:', error);
  }

  const nameParts = profile?.fullName?.split(' ') || [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  async function updateProfile(formData: FormData) {
    'use server';
    
      const payload: UpsertPatientProfileDto = {
        fullName: `${formData.get('firstName')} ${formData.get('lastName')}`.trim(),
        dateOfBirth: formData.get('dob') ? new Date(formData.get('dob') as string) : new Date(),
        governmentId: ((formData.get('governmentId') as string | null) ?? '').trim() || undefined,
        gender:
          (formData.get('gender') as string | null) === Gender.MALE
            ? Gender.MALE
            : Gender.FEMALE,
        demographics: {
          education: ((formData.get('education') as string | null) ?? '').trim() || undefined,
          occupation: ((formData.get('occupation') as string | null) ?? '').trim() || undefined,
          phoneNumber: ((formData.get('phone') as string | null) ?? '').trim() || undefined,
          address: ((formData.get('address') as string | null) ?? '').trim() || undefined,
        },
      };

    try {
      await fetchApi('/profiles/patient/me', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      revalidatePath('/patient');
      revalidatePath('/patient/profile');
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
    
    redirect('/patient');
  }

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
        <form action={updateProfile} className="p-6 md:p-8 space-y-8">
          
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
                    defaultValue={firstName}
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
                    defaultValue={lastName}
                    className="block w-full appearance-none rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/15 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="governmentId" className="block text-sm font-medium text-[var(--color-on-surface)]">
                  Government ID
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="governmentId"
                    name="governmentId"
                    defaultValue={profile?.governmentId ?? ''}
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
                    defaultValue={profile?.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : ''}
                    className="block w-full appearance-none rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/15 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-[var(--color-on-surface)]">
                  Gender
                </label>
                <div className="mt-1">
                  <select
                    id="gender"
                    name="gender"
                    defaultValue={profile?.gender ?? Gender.FEMALE}
                    className="block w-full appearance-none rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/15 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 sm:text-sm"
                  >
                    <option value={Gender.FEMALE}>Female</option>
                    <option value={Gender.MALE}>Male</option>
                  </select>
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
                    defaultValue={profile?.demographics?.phoneNumber || ''}
                    placeholder="(555) 000-0000"
                    className="block w-full appearance-none rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/15 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="education" className="block text-sm font-medium text-[var(--color-on-surface)]">
                  Education
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="education"
                    name="education"
                    defaultValue={profile?.demographics?.education || ''}
                    className="block w-full appearance-none rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/15 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="occupation" className="block text-sm font-medium text-[var(--color-on-surface)]">
                  Occupation
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="occupation"
                    name="occupation"
                    defaultValue={profile?.demographics?.occupation || ''}
                    className="block w-full appearance-none rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/15 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 sm:text-sm"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-[var(--color-on-surface)]">
                  Address
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="address"
                    name="address"
                    defaultValue={profile?.demographics?.address || ''}
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
