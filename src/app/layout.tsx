import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { ThemeStyles } from '@/seams/theme';

import './globals.css';

export const metadata: Metadata = {
  title: 'Café rota',
  description: 'Who is working when at the café, and swaps the manager has approved.',
  // A private preview: keep it out of search engines.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ThemeStyles />
      </head>
      <body>{children}</body>
    </html>
  );
}
