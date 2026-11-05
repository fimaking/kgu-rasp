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
    blue: 'bg-[#2B82FB]/10 text-[#2B82FB] dark:text-[#5B9DFD] border-[#2B82FB]/20',
    green: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    red: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
    purple: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    gray: 'bg-black/[0.04] dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 border-black/10 dark:border-white/10',
  };

  const dotStyles = {
    blue: 'bg-[#2B82FB]',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-rose-500',
    purple: 'bg-purple-500',
    gray: 'bg-zinc-400',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md font-medium',
    md: 'text-xs px-2.5 py-1 rounded-lg font-medium',
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
    lab: 'purple',
    exam: 'red',
    credit: 'red',
    other: 'amber',
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

  const { label, variant } = map[priority] || map.normal;

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
    todo: { label: 'К выполнению', variant: 'gray' },
    in_progress: { label: 'В работе', variant: 'blue' },
    completed: { label: 'Выполнено', variant: 'green' },
  };

  const { label, variant } = map[status] || map.todo;

  return (
    <Badge variant={variant} size="sm" className={className}>
      {label}
    </Badge>
  );
};
