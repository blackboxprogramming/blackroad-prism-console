import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ReactNode } from 'react';
import { QueryClientProvider } from '@/features/query-client';
import { TelemetryProvider } from '@/lib/telemetry';

export const metadata: Metadata = {
  title: 'Prism Console',
  description: 'Operator cockpit for the BlackRoad platform'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100">
        <TelemetryProvider>
          <QueryClientProvider>
            <main className="min-h-screen">
              <header className="px-8 py-4 border-b border-slate-800 flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Prism Console</h1>
                <nav aria-label="Primary">
                  <ul className="flex gap-6 text-sm text-slate-300">
                    <li>
                      <Link href="/">Overview</Link>
                    </li>
                    <li>
                      <Link href="/agents">Agents</Link>
                    </li>
                    <li>
                      <Link href="/runbooks">Runbooks</Link>
                    </li>
                    <li>
                      <Link href="/settings">Settings</Link>
                    </li>
                  </ul>
                </nav>
              </header>
              <section className="px-8 py-6 space-y-8">{children}</section>
            </main>
          </QueryClientProvider>
        </TelemetryProvider>
      </body>
    </html>
  );
}
