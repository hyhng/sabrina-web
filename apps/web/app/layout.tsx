import type { Metadata } from 'next';
import { Lora } from 'next/font/google';
import type { ReactNode } from 'react';

import './globals.css';

/**
 * Lora, the one typeface on the site (docs/DESIGN.md → Typografie).
 *
 * next/font downloads it at build time and serves it from our own domain, so
 * a visitor's browser never talks to fonts.googleapis.com — that is CLAUDE.md
 * rule 7, and it is why there is no cookie banner to argue about.
 * latin-ext carries the diacritics Czech credits need.
 */
const lora = Lora({
  weight: ['400', '500'],
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-lora',
});

export const metadata: Metadata = {
  title: 'Sabrina Kulhankova',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={lora.variable}>
      <body>{children}</body>
    </html>
  );
}
