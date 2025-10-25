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
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prism Console Web",
  description: "Web operator cockpit for BlackRoad Prism ecosystem"
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="bg-slate-950">
      <body className={`${inter.className} min-h-screen bg-slate-950 text-slate-50`}>
        <Providers>
          <div className="mx-auto flex min-h-screen max-w-6xl flex-col">
            <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur-sm">
              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <h1 className="text-xl font-semibold text-white">Prism Console</h1>
                  <p className="text-sm text-slate-400">Control and observability for the BlackRoad Prism stack</p>
                </div>
                <nav className="flex items-center gap-4 text-sm text-slate-300">
                  <Link href="/" className="hover:text-white">
                    Overview
                  </Link>
                  <Link href="/agents" className="hover:text-white">
                    Agents
                  </Link>
                  <Link href="/runbooks" className="hover:text-white">
                    Runbooks
                  </Link>
                  <Link href="/settings" className="hover:text-white">
                    Settings
                  </Link>
                </nav>
              </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="border-t border-slate-800 px-6 py-4 text-sm text-slate-500">
              BlackRoad Prism Console • All systems observed.
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
