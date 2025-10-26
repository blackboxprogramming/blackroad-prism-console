import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ReactNode } from 'react';

export interface DialogProps {
  trigger?: ReactNode;
  title: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Dialog({ trigger, title, children, open, onOpenChange }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="lucidia-dialog-overlay" />
        <DialogPrimitive.Content className="lucidia-dialog-content">
          <DialogPrimitive.Title className="lucidia-dialog-title">
            {title}
          </DialogPrimitive.Title>
          <div className="lucidia-dialog-body">{children}</div>
          <DialogPrimitive.Close className="lucidia-dialog-close">×</DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
