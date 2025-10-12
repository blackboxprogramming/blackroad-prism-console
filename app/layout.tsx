import type { ReactNode } from 'react';
import DebugConsole from '@/components/debug/DebugConsole';

export const metadata = {
  title: 'BlackRoad Console',
  description: 'BlackRoad platform console',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <DebugConsole />
      </body>
    </html>
  );
}
