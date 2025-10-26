import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ReactNode } from 'react';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogContent = ({ children }: { children: ReactNode }) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 bg-black/70" />
    <DialogPrimitive.Content className="fixed left-1/2 top-1/2 w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-700 bg-surface-muted p-6 shadow-xl">
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);

export const DialogTitle = ({ children }: { children: ReactNode }) => (
  <DialogPrimitive.Title className="text-lg font-semibold text-slate-100">{children}</DialogPrimitive.Title>
);

export const DialogDescription = ({ children }: { children: ReactNode }) => (
  <DialogPrimitive.Description className="mt-2 text-sm text-slate-300">{children}</DialogPrimitive.Description>
);
