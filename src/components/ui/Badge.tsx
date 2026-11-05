import React from 'react';
import { Priority, HomeworkStatus } from '../../types/homework';
import { LessonType } from '../../types/schedule';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'gray';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variantStyles = {
    blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
    green: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20',
    red: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
    purple: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
    gray: 'bg-black/5 dark:bg-white/10 text-apple-gray-700 dark:text-apple-gray-300 border-black/5 dark:border-white/10',
  };

  const dotStyles = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-rose-500',
    purple: 'bg-purple-500',
    gray: 'bg-apple-gray-400',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 rounded-full font-medium',
    md: 'text-xs px-2.5 py-1 rounded-full font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 border tracking-tight transition-colors whitespace-nowrap shrink-0 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} />}
      {children}
    </span>
  );
};

export const LessonTypeBadge: React.FC<{ type: LessonType; label: string; className?: string }> = ({
  type,
  label,
  className = '',
}) => {
  const variantMap: Record<LessonType, 'blue' | 'green' | 'amber' | 'red' | 'purple'> = {
    lecture: 'blue',
    practice: 'green',
    lab: 'amber',
    exam: 'red',
    credit: 'red',
    other: 'purple',
  };

  return (
    <Badge variant={variantMap[type] || 'gray'} dot size="sm" className={className}>
      {label}
    </Badge>
  );
};

export const PriorityBadge: React.FC<{ priority: Priority; className?: string }> = ({
  priority,
  className = '',
}) => {
  const map: Record<Priority, { label: string; variant: 'red' | 'blue' | 'gray' }> = {
    high: { label: 'Высокий', variant: 'red' },
    normal: { label: 'Обычный', variant: 'blue' },
    low: { label: 'Низкий', variant: 'gray' },
  };

  const { label, variant } = map[priority];
  return (
    <Badge variant={variant} dot size="sm" className={className}>
      {label}
    </Badge>
  );
};

export const StatusBadge: React.FC<{ status: HomeworkStatus; className?: string }> = ({
  status,
  className = '',
}) => {
  const map: Record<HomeworkStatus, { label: string; variant: 'gray' | 'blue' | 'green' }> = {
    todo: { label: 'Не начато', variant: 'gray' },
    in_progress: { label: 'В работе', variant: 'blue' },
    completed: { label: 'Выполнено', variant: 'green' },
  };

  const { label, variant } = map[status];
  return (
    <Badge variant={variant} size="sm" className={className}>
      {label}
    </Badge>
  );
};
