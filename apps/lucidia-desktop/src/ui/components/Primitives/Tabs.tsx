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
