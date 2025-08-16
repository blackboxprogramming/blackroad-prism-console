"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ReactNode } from "react";

interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
}

export function Tabs({ tabs }: { tabs: TabItem[] }) {
  return (
    <TabsPrimitive.Root defaultValue={tabs[0]?.value} className="flex flex-col">
      <TabsPrimitive.List className="mb-4 flex space-x-2 border-b border-gray-700">
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            className="px-3 py-2 text-sm text-gray-300 data-[state=active]:border-b-2 data-[state=active]:border-[#FFB000]"
          >
            {tab.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {tabs.map((tab) => (
        <TabsPrimitive.Content key={tab.value} value={tab.value}>
          {tab.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}
