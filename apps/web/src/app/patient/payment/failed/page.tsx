import Link from 'next/link';
import { AlertCircle, RefreshCcw, ArrowLeft } from 'lucide-react';

export default function PaymentFailedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-full bg-[var(--color-error)]/10 flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-[var(--color-error)]" />
      </div>
      
      <h1 className="text-3xl font-display font-bold text-[var(--color-primary)] mb-3">
        Payment Failed
      </h1>
      
      <p className="text-lg text-[var(--color-on-surface-variant)] max-w-md mb-8">
        We couldn't process your payment. Please check your card details and try again, or use a different payment method.
      </p>

      <div className="bg-[var(--color-surface-lowest)] rounded-[var(--radius-lg)] shadow-[var(--shadow-ambient)] p-6 max-w-md w-full mb-8 text-left">
        <h3 className="font-medium text-[var(--color-on-surface)] mb-2">Possible reasons:</h3>
        <ul className="text-sm text-[var(--color-on-surface-variant)] space-y-2 list-disc list-inside">
          <li>Incorrect card number or CVC</li>
          <li>Expired card</li>
          <li>Insufficient funds</li>
          <li>Bank declined the transaction</li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Link 
          href="/patient/payment"
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] px-8 py-3 text-sm font-semibold text-white shadow-[var(--shadow-ambient)] hover:from-[var(--color-primary-container)] hover:to-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] transition-all"
        >
          <RefreshCcw className="w-4 h-4" />
          Try Again
        </Link>
        <Link 
          href="/patient"
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)]/15 px-8 py-3 text-sm font-semibold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-low)] hover:text-[var(--color-on-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
