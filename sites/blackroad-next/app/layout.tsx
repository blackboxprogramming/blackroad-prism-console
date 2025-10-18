import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: {
    default: 'Blackroad',
    template: '%s | Blackroad'
  },
  description: 'Login hub for Blackroad accounts.',
  metadataBase: new URL('https://blackroad.com'),
  openGraph: {
    title: 'Blackroad',
    description: 'Login hub for Blackroad accounts.',
    url: 'https://blackroad.com/',
    siteName: 'Blackroad'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blackroad',
    description: 'Login hub for Blackroad accounts.'
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
