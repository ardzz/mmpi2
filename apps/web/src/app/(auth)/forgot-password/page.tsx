import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-center font-display text-2xl font-bold tracking-tight text-[var(--color-primary)]">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--color-on-surface-variant)]">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form className="space-y-6" action="/reset-link-sent" method="GET">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--color-on-surface)]">
            Email address
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full appearance-none rounded-[var(--radius-md)] bg-[var(--color-surface-lowest)] px-3 py-2 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/15 placeholder-[var(--color-on-surface-variant)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            className="flex w-full justify-center rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] px-3 py-2 text-sm font-semibold text-white shadow-[var(--shadow-ambient)] hover:from-[var(--color-primary-container)] hover:to-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] transition-all"
          >
            Send reset link
          </button>
        </div>
        
        <div className="text-center text-sm">
          <Link href="/login" className="font-medium text-[var(--color-action)] hover:text-[var(--color-primary)] transition-colors">
            Return to sign in
          </Link>
        </div>
      </form>
    </>
  );
}
