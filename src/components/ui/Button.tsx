import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 ease-out active:scale-[0.96] active:opacity-90 disabled:opacity-50 disabled:pointer-events-none select-none';

  const variantStyles = {
    primary:
      'bg-apple-blue hover:bg-blue-600 text-white shadow-apple-sm hover:shadow-md focus:ring-2 focus:ring-apple-blue/40',
    secondary:
      'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-apple-gray-800 dark:text-apple-gray-200 border border-black/5 dark:border-white/10',
    ghost:
      'bg-transparent hover:bg-black/5 dark:hover:bg-white/10 text-apple-gray-700 dark:text-apple-gray-300',
    danger:
      'bg-rose-500/10 hover:bg-rose-500/20 text-apple-red dark:text-rose-400 border border-rose-500/20',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-xl gap-1.5',
    md: 'text-sm px-4 py-2 rounded-2xl gap-2',
    lg: 'text-base px-5 py-2.5 rounded-2.5xl gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
};
