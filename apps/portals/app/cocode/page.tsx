"use client";

import { Sidebar } from "../../components/ui/sidebar";
import { Topbar } from "../../components/ui/topbar";
import { Tabs } from "../../components/ui/tabs";

export default function CoCodePage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar title="Co-Coding Workspace" />
        <main className="flex-1 p-4">
          <Tabs
            tabs={[
              {
                value: "editor",
                label: "Editor",
                content: (
                  <textarea className="h-96 w-full rounded bg-gray-800 p-2 font-mono" />
                ),
              },
              {
                value: "preview",
                label: "Preview",
                content: (
                  <div className="h-96 w-full rounded bg-gray-800 p-2">
                    Preview area
                  </div>
                ),
              },
            ]}
          />
        </main>
      </div>
    </div>
  );
}
