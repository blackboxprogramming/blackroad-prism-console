import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { QueryClientProvider } from '@/components/query-client-provider';
import { NavBar } from '@/components/nav-bar';
import { OfflineBanner } from '@/components/offline-banner';

export const metadata: Metadata = {
  title: 'BackRoad Web',
  description: 'Credibility-safe social layer for thoughtful conversations.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <QueryClientProvider>
          <div className="flex min-h-screen flex-col">
            <OfflineBanner className="border-b border-slate-800" />
            <NavBar />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </QueryClientProvider>
      </body>
    </html>
  );
}
