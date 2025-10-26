import type { Metadata } from "next";
import Link from "next/link";
import { ReactNode } from "react";
import "./globals.css";
import { SearchBar } from "@/components/SearchBar";

export const metadata: Metadata = {
  title: "BlackRoad Docs & Runbooks",
  description: "Operational knowledge hub for BlackRoad teams"
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="navbar" role="banner">
          <Link href="/" aria-label="BlackRoad home">
            <strong>BlackRoad Docs</strong>
          </Link>
          <nav className="nav-links" aria-label="Primary">
            <Link href="/docs">Docs</Link>
            <Link href="/runbooks">Runbooks</Link>
            <Link href="/about">About</Link>
          </nav>
          <SearchBar />
        </header>
        <main role="main">{children}</main>
      </body>
    </html>
  );
}
