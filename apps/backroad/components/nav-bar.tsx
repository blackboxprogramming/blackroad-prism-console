'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const links = [
  { href: '/threads', label: 'Threads' },
  { href: '/rooms', label: 'Rooms' },
  { href: '/compose', label: 'Compose' },
  { href: '/settings', label: 'Settings' },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8"
      >
        <Link href="/threads" className="text-lg font-semibold text-slate-50">
          BackRoad
        </Link>
        <ul className="flex items-center gap-4">
          {links.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={clsx(
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400',
                    active
                      ? 'bg-brand-500/20 text-brand-200'
                      : 'text-slate-300 hover:text-slate-100',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
