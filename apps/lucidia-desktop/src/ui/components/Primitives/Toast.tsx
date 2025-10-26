import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toasts: ToastMessage[];
  push: (message: Omit<ToastMessage, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const push = useCallback((message: Omit<ToastMessage, 'id'>) => {
    setToasts((prev) => [...prev, { ...message, id: crypto.randomUUID() }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 flex w-80 flex-col gap-3">
        {toasts.map((toast) => (
          <div key={toast.id} className="rounded-lg border border-slate-700 bg-surface-muted p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{toast.title}</p>
              <button className="text-xs text-slate-400" onClick={() => dismiss(toast.id)}>
                Close
              </button>
            </div>
            {toast.description && <p className="mt-2 text-xs text-slate-300">{toast.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};
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
