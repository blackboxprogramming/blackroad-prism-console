import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  metadataBase: new URL("https://blackroadinc.us"),
  title: {
    default: "BlackRoad Hub",
    template: "%s | BlackRoad Hub",
  },
  description: "Operations and investor hub for BlackRoad.",
  openGraph: {
    title: "BlackRoad Hub",
    description: "Operations and investor hub for BlackRoad.",
    url: "https://blackroadinc.us/",
    siteName: "BlackRoad Hub",
  },
  twitter: {
    card: "summary_large_image",
    title: "BlackRoad Hub",
    description: "Operations and investor hub for BlackRoad.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <header className="border-b border-white/10">
          <nav className="container-x flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold">BlackRoad Hub</span>
              <ul className="hidden items-center gap-6 text-sm text-zinc-400 md:flex">
                <li><a href="/#features">Features</a></li>
                <li><a href="/#investor">Investor</a></li>
                <li><a href="/#docs">Docs</a></li>
                <li><a href="/#pricing">Pricing</a></li>
              </ul>
            </div>
            <div className="flex items-center gap-3">
              <a className="btn-ghost" href="/portal">Enter Portal</a>
              <a className="btn-primary" href="/signup">Subscribe</a>
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="mt-20 border-t border-white/10">
          <div className="container-x py-10 text-sm text-zinc-400">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span>© {new Date().getFullYear()} BlackRoad Hub. All rights reserved.</span>
              <nav className="flex gap-6">
                <a href="/status">Status</a>
                <a href="/about">About</a>
                <a href="/privacy">Privacy</a>
              </nav>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
