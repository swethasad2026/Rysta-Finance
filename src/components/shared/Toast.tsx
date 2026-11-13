import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/utils/cn';

export type ToastVariant = 'default' | 'success' | 'destructive' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  title?: string;
  description: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  toast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = 'default', duration = 4500 }: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast: ToastMessage = { id, title, description, variant, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          const icons = {
            default: <Info className="h-5 w-5 text-primary shrink-0" />,
            success: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
            destructive: <AlertCircle className="h-5 w-5 text-destructive shrink-0" />,
            warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
            info: <Info className="h-5 w-5 text-sky-500 shrink-0" />,
          };

          return (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-lg border bg-card p-4 shadow-lg transition-all animate-in slide-in-from-bottom-5',
                t.variant === 'destructive' && 'border-destructive/30 bg-destructive/10 text-destructive',
                t.variant === 'success' && 'border-emerald-500/30 bg-emerald-500/10 text-foreground',
                t.variant === 'warning' && 'border-amber-500/30 bg-amber-500/10 text-foreground'
              )}
            >
              {icons[t.variant || 'default']}
              <div className="flex-1 text-sm">
                {t.title && <div className="font-semibold">{t.title}</div>}
                <div className="text-muted-foreground">{t.description}</div>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-muted-foreground hover:text-foreground shrink-0 rounded-sm opacity-70 hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
