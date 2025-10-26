import * as TabsPrimitive from '@radix-ui/react-tabs';
import { clsx } from 'clsx';
import { ReactNode } from 'react';

export const Tabs = TabsPrimitive.Root;
export const TabsList = ({ children }: { children: ReactNode }) => (
  <TabsPrimitive.List className="flex gap-2 rounded-md bg-surface-muted p-1 text-sm text-slate-300">
    {children}
  </TabsPrimitive.List>
);

export const TabsTrigger = ({ value, children }: { value: string; children: ReactNode }) => (
  <TabsPrimitive.Trigger
    className={clsx(
      'flex-1 rounded-md px-3 py-2 text-center transition-colors data-[state=active]:bg-slate-800 data-[state=active]:text-white',
      'data-[state=inactive]:text-slate-400 hover:data-[state=inactive]:text-slate-200'
    )}
    value={value}
  >
    {children}
  </TabsPrimitive.Trigger>
);

export const TabsContent = ({ value, children }: { value: string; children: ReactNode }) => (
  <TabsPrimitive.Content value={value} className="mt-4">
    {children}
  </TabsPrimitive.Content>
);
import { ReactNode } from 'react';

export interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}

export function Tabs({ value, onValueChange, children }: TabsProps) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={onValueChange} className="tabs">
      {children}
    </TabsPrimitive.Root>
  );
}

export const TabList = TabsPrimitive.List;
export const TabTrigger = TabsPrimitive.Trigger;
export const TabContent = TabsPrimitive.Content;
