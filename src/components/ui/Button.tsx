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
    'inline-flex items-center justify-center font-medium transition-all duration-150 ease-out active:scale-[0.97] active:opacity-90 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';

  const variantStyles = {
    primary:
      'bg-[#2B82FB] hover:bg-[#2072E5] active:bg-[#1668E3] text-white shadow-sm hover:shadow-ticktick-blue focus:ring-2 focus:ring-[#2B82FB]/40 border border-transparent',
    secondary:
      'bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-zinc-800 dark:text-zinc-200 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20',
    ghost:
      'bg-transparent hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-zinc-700 dark:text-zinc-300',
    danger:
      'bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/20',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2 rounded-xl gap-2',
    lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5',
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
