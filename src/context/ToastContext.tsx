import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 4500) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const toast: Toast = { id, message, type, duration };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const error = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const warning = useCallback((message: string) => showToast(message, 'warning'), [showToast]);
  const info = useCallback((message: string) => showToast(message, 'info'), [showToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        success,
        error,
        warning,
        info,
        removeToast,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: (msg: string) => alert(msg),
      success: (msg: string) => alert(msg),
      error: (msg: string) => alert(msg),
      warning: (msg: string) => alert(msg),
      info: (msg: string) => alert(msg),
      removeToast: () => {},
    };
  }
  return ctx;
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div
      className="fixed top-20 sm:top-4 end-4 z-[9999] flex flex-col gap-3 pointer-events-none w-[calc(100%-2rem)] max-w-sm sm:max-w-md"
      style={{ pointerEvents: toasts.length ? 'auto' : 'none' }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const config = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200',
      icon: 'ri-checkbox-circle-fill text-emerald-500',
      text: 'text-emerald-800',
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: 'ri-error-warning-fill text-red-500',
      text: 'text-red-800',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200',
      icon: 'ri-alert-fill text-amber-500',
      text: 'text-amber-800',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: 'ri-information-fill text-blue-500',
      text: 'text-blue-800',
    },
  }[toast.type];

  return (
    <div
      className={`${config.bg} border rounded-xl shadow-lg p-4 flex items-start gap-3 pointer-events-auto toast-enter`}
      role="alert"
    >
      <i className={`${config.icon} text-xl flex-shrink-0 mt-0.5`}></i>
      <p className={`${config.text} text-sm font-medium flex-1`}>{toast.message}</p>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-lg hover:bg-white/50 transition-colors"
        aria-label="Fermer"
      >
        <i className="ri-close-line text-lg"></i>
      </button>
    </div>
  );
}
