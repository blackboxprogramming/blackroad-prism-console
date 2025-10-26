import * as ToastPrimitive from '@radix-ui/react-toast';
import { ReactNode } from 'react';

export interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <ToastPrimitive.Provider swipeDirection="right" duration={4000}>
      {children}
      <ToastPrimitive.Viewport className="lucidia-toast-viewport" />
    </ToastPrimitive.Provider>
  );
}
