import type { ReactNode } from 'react';

export const metadata = {
  title: 'BlackRoad Console',
  description: 'BlackRoad platform console',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
