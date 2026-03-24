import Link from 'next/link';
import { ArrowLeft, Lock, CreditCard } from 'lucide-react';

export default function PaymentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/patient/requests/new" className="p-2 rounded-full hover:bg-[var(--color-surface-low)] transition-colors text-[var(--color-on-surface-variant)]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-[var(--color-primary)]">
            Complete Payment
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            Secure checkout for your MMPI-2 assessment.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-[var(--color-surface-lowest)] rounded-[var(--radius-lg)] shadow-[var(--shadow-ambient)] p-6 md:p-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--color-outline-variant)]/15">
              <h2 className="text-lg font-medium text-[var(--color-on-surface)]">
                Payment Method
              </h2>
              <div className="flex items-center gap-2 text-[var(--color-success)] bg-[var(--color-success)]/10 px-3 py-1 rounded-full text-xs font-medium">
                <Lock className="w-3 h-3" />
                Secure Checkout
              </div>
            </div>

            <form className="space-y-6">
              {/* Payment Details Form */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[var(--color-on-surface)] mb-1">
                    Name on card
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="block w-full appearance-none rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2.5 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/15 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 sm:text-sm"
                    placeholder="Alex Doe"
                  />
                </div>

                <div>
                  <label htmlFor="card" className="block text-sm font-medium text-[var(--color-on-surface)] mb-1">
                    Card information
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CreditCard className="h-5 w-5 text-[var(--color-on-surface-variant)]" />
                    </div>
                    <input
                      type="text"
                      id="card"
                      className="block w-full appearance-none rounded-[var(--radius-md)] bg-[var(--color-surface)] pl-10 pr-3 py-2.5 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/15 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 sm:text-sm"
                      placeholder="0000 0000 0000 0000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="expiry" className="block text-sm font-medium text-[var(--color-on-surface)] mb-1">
                      Expiry date
                    </label>
                    <input
                      type="text"
                      id="expiry"
                      className="block w-full appearance-none rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2.5 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/15 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 sm:text-sm"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <label htmlFor="cvc" className="block text-sm font-medium text-[var(--color-on-surface)] mb-1">
                      CVC
                    </label>
                    <input
                      type="text"
                      id="cvc"
                      className="block w-full appearance-none rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2.5 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/15 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 sm:text-sm"
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-8 flex flex-col sm:flex-row gap-4 sm:justify-end">
                <Link 
                  href="/patient/payment/failed"
                  className="inline-flex justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)]/15 px-6 py-2.5 text-sm font-semibold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-low)] hover:text-[var(--color-on-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] transition-all"
                >
                  Test Failure
                </Link>
                <Link 
                  href="/patient/status/awaiting-approval"
                  className="inline-flex justify-center items-center gap-2 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] px-8 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-ambient)] hover:from-[var(--color-primary-container)] hover:to-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] transition-all"
                >
                  Pay $150.00
                </Link>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-[var(--color-surface-lowest)] rounded-[var(--radius-lg)] shadow-[var(--shadow-ambient)] p-6 sticky top-6">
            <h3 className="font-medium text-[var(--color-on-surface)] mb-4">
              Order Summary
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-[var(--color-on-surface)]">MMPI-2 Assessment</p>
                  <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">Standard Clinical Evaluation</p>
                </div>
                <span className="text-sm font-medium text-[var(--color-on-surface)]">$150.00</span>
              </div>
              
              <div className="pt-4 border-t border-[var(--color-outline-variant)]/15 flex justify-between items-center">
                <span className="font-semibold text-[var(--color-on-surface)]">Total</span>
                <span className="font-display font-semibold text-lg text-[var(--color-primary)]">$150.00</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--color-outline-variant)]/15">
              <p className="text-xs text-[var(--color-on-surface-variant)] text-center">
                By completing this payment, you agree to our Terms of Service and Privacy Policy. Refunds are subject to clinical approval.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
