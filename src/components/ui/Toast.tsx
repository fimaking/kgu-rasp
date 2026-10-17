import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-6 inset-x-4 md:inset-x-auto md:right-6 md:w-96 md:max-w-sm z-50 flex flex-col gap-2.5 pointer-events-none items-center md:items-end">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>,
    document.body
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-apple-blue shrink-0 mt-0.5" />,
  };

  return (
    <div className="pointer-events-auto w-full max-w-md md:max-w-sm flex items-start gap-3 p-3.5 sm:p-4 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl shadow-apple-float animate-toast-spring transition-all duration-200">
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-apple-gray-900 dark:text-white leading-tight">
          {toast.title}
        </h4>
        {toast.message && (
          <p className="mt-1 text-xs text-apple-gray-500 dark:text-apple-gray-400 leading-normal">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="p-1 -mr-1 -mt-0.5 text-apple-gray-400 hover:text-apple-gray-600 dark:hover:text-white rounded-full transition-all duration-150 active:scale-90 shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
