import * as TabsPrimitive from '@radix-ui/react-tabs';
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
