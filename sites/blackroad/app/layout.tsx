import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "BlackRoad.io — A lucid creative portal guided by AI",
  description: "Build, ship, and evolve with a dark, precise stack.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <header className="border-b border-white/10">
          <nav className="container-x flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold">BlackRoad.io</span>
              <ul className="hidden items-center gap-6 text-sm text-zinc-400 md:flex">
                <li>
                  <Link href="/#features">Features</Link>
                </li>
                <li>
                  <Link href="/#investor">Investor</Link>
                </li>
                <li>
                  <Link href="/#docs">Docs</Link>
                </li>
                <li>
                  <Link href="/#pricing">Pricing</Link>
                </li>
              </ul>
            </div>
            <div className="flex items-center gap-3">
              <Link className="btn-ghost" href="/portal">
                Enter Portal
              </Link>
              <Link className="btn-primary" href="/signup">
                Subscribe
              </Link>
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="mt-20 border-t border-white/10">
          <div className="container-x py-10 text-sm text-zinc-400">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span>© {new Date().getFullYear()} BlackRoad.io. All rights reserved.</span>
              <nav className="flex gap-6">
                <Link href="/status">Status</Link>
                <Link href="/about">About</Link>
                <Link href="/privacy">Privacy</Link>
              </nav>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
