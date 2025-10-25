import './globals.css';
import type { Metadata } from 'next';
import { Providers } from './providers';
import { SkipToContent } from '@/components/navigation/SkipToContent';
import { ThemeToggle } from '@/components/navigation/ThemeToggle';
import { OfflineBanner } from '@/components/utils/OfflineBanner';

export const metadata: Metadata = {
  title: 'RoadWork Learning Portal',
  description: 'Competency-based adaptive learning for every builder.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <Providers>
          <SkipToContent />
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <a href="/" className="text-xl font-semibold text-brand-600">
              RoadWork
            </a>
            <ThemeToggle />
          </header>
          <OfflineBanner />
          <main id="main" className="mx-auto max-w-5xl px-6 py-10">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
