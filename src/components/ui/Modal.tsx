import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Fullscreen Backdrop with Apple Frosted Glass Blur */}
      <div
        className="fixed inset-0 bg-black/25 dark:bg-black/40 backdrop-blur-xl animate-backdrop-fade"
        onClick={onClose}
      />

      {/* Dialog Card with Apple Spring Entrance */}
      <div
        className={`relative w-full ${widthClasses[maxWidth]} bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl rounded-3xl border border-black/10 dark:border-white/10 shadow-apple-float overflow-hidden z-10 animate-modal-spring my-auto flex flex-col max-h-[92vh] sm:max-h-[88vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (pinned to top) */}
        {(title || subtitle) && (
          <div className="shrink-0 flex items-start justify-between px-6 pt-5 pb-4 border-b border-black/5 dark:border-white/5">
            <div>
              {title && (
                <h3 className="text-xl font-semibold tracking-tight text-apple-gray-900 dark:text-white">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-xs text-apple-gray-500 dark:text-apple-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 -mr-1 text-apple-gray-400 hover:text-apple-gray-600 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto min-h-0">{children}</div>
      </div>
    </div>,
    document.body
  );
};
