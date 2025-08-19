import "./globals.css";
import type { ReactNode } from "react";
import BlackRoadCopilot from "@/components/BlackRoadCopilot";

export const metadata = {
  title: "BlackRoad Portals",
  description: "BlackRoad.io portal hub",
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
