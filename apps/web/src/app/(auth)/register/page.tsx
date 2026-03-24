import Link from 'next/link';

export default function RegisterPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-center font-display text-2xl font-bold tracking-tight text-[var(--color-primary)]">
          Create a patient account
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--color-on-surface-variant)]">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-[var(--color-action)] hover:text-[var(--color-primary)] transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      <form className="space-y-6" action="#" method="POST">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[var(--color-on-surface)]">
            Full name
          </label>
          <div className="mt-1">
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className="block w-full appearance-none rounded-[var(--radius-md)] bg-[var(--color-surface-lowest)] px-3 py-2 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/15 placeholder-[var(--color-on-surface-variant)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 sm:text-sm"
            />
          </div>
        </div>

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
          <label htmlFor="password" className="block text-sm font-medium text-[var(--color-on-surface)]">
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
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
            Create account
          </button>
        </div>
      </form>
    </>
  );
}
