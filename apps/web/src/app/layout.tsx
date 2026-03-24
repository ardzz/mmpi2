import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MMPI-2 Clinical Assessment Platform',
  description: 'Patient intake, assessment delivery, scoring, and clinical report management.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body className="bg-[var(--color-surface)] text-[var(--color-on-surface)] font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
