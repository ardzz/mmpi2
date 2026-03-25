import {
  CreditCard,
  DollarSign,
  Repeat,
  Search,
  Settings,
} from 'lucide-react';
import type {
  AppBillingSettings,
  BillingMode,
} from '@mmpi2/contracts';
import { fetchApiAsAdmin } from '../../../lib/api-client';
import { revalidatePath } from 'next/cache';

export default async function AdminBillingPage() {
  let billingSettings: AppBillingSettings | null = null;

  try {
    billingSettings = await fetchApiAsAdmin<AppBillingSettings>('/workflow/billing/settings');
  } catch (error) {
    console.error('Failed to load billing settings:', error);
  }

  async function saveBillingSettings(formData: FormData) {
    'use server';

    const billingMode = (formData.get('billing_mode') as BillingMode | null) ?? 'disabled';

    await fetchApiAsAdmin('/workflow/billing/settings', {
      method: 'PATCH',
      body: JSON.stringify({ billingMode }),
    });

    revalidatePath('/admin/billing');
  }

  const activeBillingMode = billingSettings?.billingMode ?? 'disabled';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-[var(--color-primary)]">
          Billing & Events
        </h1>
        <p className="text-[var(--color-on-surface-variant)] mt-2">
          Configure platform billing behavior and review what is already backed by the live API.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)]/10 p-5">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-5 h-5 text-[var(--color-primary)]" />
              <h2 className="font-semibold text-[var(--color-on-surface)]">Billing Mode</h2>
            </div>

            <form action={saveBillingSettings} className="space-y-4">
              <label className="flex items-start gap-3 p-3 border border-[var(--color-action)] bg-[var(--color-action)]/5 rounded-[var(--radius-md)] cursor-pointer">
                <input
                  type="radio"
                  name="billing_mode"
                  value="disabled"
                  className="mt-1"
                  defaultChecked={activeBillingMode === 'disabled'}
                />
                <div>
                  <div className="font-medium text-[var(--color-on-surface)] flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-[var(--color-action)]" />
                    Disabled / Free Access
                  </div>
                  <div className="text-xs text-[var(--color-on-surface-variant)] mt-1">
                    Requests are satisfied immediately without creating provider payment rows.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-[var(--color-outline-variant)]/20 rounded-[var(--radius-md)] cursor-pointer hover:bg-[var(--color-surface-low)] transition-colors">
                <input
                  type="radio"
                  name="billing_mode"
                  value="midtrans"
                  className="mt-1"
                  defaultChecked={activeBillingMode === 'midtrans'}
                />
                <div>
                  <div className="font-medium text-[var(--color-on-surface)] flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[var(--color-on-surface-variant)]" />
                    Midtrans Gateway
                  </div>
                  <div className="text-xs text-[var(--color-on-surface-variant)] mt-1">
                    New requests require a Midtrans-backed payment before clinical review.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-[var(--color-outline-variant)]/20 rounded-[var(--radius-md)] cursor-pointer hover:bg-[var(--color-surface-low)] transition-colors">
                <input
                  type="radio"
                  name="billing_mode"
                  value="xendit"
                  className="mt-1"
                  defaultChecked={activeBillingMode === 'xendit'}
                />
                <div>
                  <div className="font-medium text-[var(--color-on-surface)] flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[var(--color-on-surface-variant)]" />
                    Xendit Gateway
                  </div>
                  <div className="text-xs text-[var(--color-on-surface-variant)] mt-1">
                    New requests require a Xendit-backed payment before clinical review.
                  </div>
                </div>
              </label>

              <button
                type="submit"
                className="w-full mt-6 py-2.5 bg-[var(--color-primary)] text-[var(--color-surface-lowest)] rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-primary-container)] transition-colors"
              >
                Save Configuration
              </button>
            </form>
          </div>

          <div className="bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)]/10 p-5">
            <h2 className="font-semibold text-[var(--color-on-surface)] mb-4">Live Settings Snapshot</h2>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1">
                  Default Currency
                </div>
                <div className="text-2xl font-bold text-[var(--color-primary)] flex items-center gap-1">
                  <DollarSign className="w-5 h-5 text-[var(--color-action)]" />
                  {billingSettings?.defaultCurrency ?? 'IDR'}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1">
                  Default Amount
                </div>
                <div className="text-lg font-medium text-[var(--color-on-surface)]">
                  {billingSettings?.defaultAmount ?? 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-[var(--color-surface-lowest)] rounded-xl shadow-[var(--shadow-ambient)] border border-[var(--color-outline-variant)]/10 flex flex-col">
          <div className="p-4 border-b border-[var(--color-outline-variant)]/15 flex justify-between items-center">
            <h2 className="font-semibold text-[var(--color-on-surface)]">Billing Event Feed</h2>
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-on-surface-variant)]" />
              <input
                type="text"
                placeholder="Search events..."
                className="w-full pl-9 pr-4 py-1.5 bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-md)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-10 text-center">
            <div className="max-w-xl">
              <h3 className="font-medium text-[var(--color-on-surface)] mb-2">Settings are real, event history is not yet exposed</h3>
              <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed">
                The billing mode on this page is backed by the persisted admin billing endpoint. Payment event
                listing and revenue analytics still need dedicated read endpoints before this area can show real
                operational data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
