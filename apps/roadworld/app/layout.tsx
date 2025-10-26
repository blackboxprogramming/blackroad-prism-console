import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RoadWorld Editor',
  description: '3D authoring shell for deterministic RoadWorld scenes',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
