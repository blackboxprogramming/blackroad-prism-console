import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import BlackRoadCopilot from "../components/BlackRoadCopilot";

export const metadata: Metadata = {
  metadataBase: new URL("https://blackroad.io"),
  title: {
    default: "BlackRoad Portals",
    template: "%s | BlackRoad Portals",
  },
  description: "BlackRoad.io portal hub",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "BlackRoad Portals",
    description: "BlackRoad.io portal hub",
    url: "https://blackroad.io",
    siteName: "BlackRoad",
    images: [
      {
        url: "https://blackroad.io/og-image.png",
        width: 1200,
        height: 630,
        alt: "BlackRoad",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BlackRoad Portals",
    description: "BlackRoad.io portal hub",
    images: ["https://blackroad.io/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gray-900 text-gray-100">
        {children}
        <BlackRoadCopilot />
      </body>
    </html>
  );
}
