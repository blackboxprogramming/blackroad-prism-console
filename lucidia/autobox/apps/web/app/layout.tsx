import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Lucidia Auto-Box",
  description: "Paste messy notes and preview transparent box assignments.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="app-body">
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
