import "./styles.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lucidia Auto-Box",
  description:
    "Paste notes, preview explainable topic suggestions, and stay in control of your data.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
