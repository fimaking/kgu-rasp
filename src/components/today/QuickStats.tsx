import React from 'react';
import { BookOpen, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface QuickStatsProps {
  todayLessonsCount: number;
  activeHomeworkCount: number;
  overdueHomeworkCount: number;
  dueTodayHomeworkCount: number;
  onNavigateToTab: (tab: 'schedule' | 'homework') => void;
}

export const QuickStats: React.FC<QuickStatsProps> = ({
  todayLessonsCount,
  activeHomeworkCount,
  overdueHomeworkCount,
  dueTodayHomeworkCount,
  onNavigateToTab,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 select-none">
      {/* Lessons today */}
      <div
        onClick={() => onNavigateToTab('schedule')}
        className="p-4 sm:p-5 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-card hover:shadow-apple-hover transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-apple-gray-500 dark:text-apple-gray-400">
            Занятия
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-apple-blue flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-apple-gray-900 dark:text-white">
            {todayLessonsCount}
          </span>
          <span className="text-xs text-apple-gray-500 dark:text-apple-gray-400">
            {todayLessonsCount === 1 ? 'пара' : todayLessonsCount >= 2 && todayLessonsCount <= 4 ? 'пары' : 'пар'}
          </span>
        </div>
        <p className="mt-1 text-xs text-apple-gray-400 dark:text-apple-gray-500 truncate group-hover:text-apple-blue transition-colors">
          {todayLessonsCount > 0 ? 'Расписание на сегодня' : 'Свободный от пар день'}
        </p>
      </div>

      {/* Due Today */}
      <div
        onClick={() => onNavigateToTab('homework')}
        className="p-4 sm:p-5 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-card hover:shadow-apple-hover transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-apple-gray-500 dark:text-apple-gray-400">
            Сдать сегодня
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-apple-gray-900 dark:text-white">
            {dueTodayHomeworkCount}
          </span>
          <span className="text-xs text-apple-gray-500 dark:text-apple-gray-400">заданий</span>
        </div>
        <p className="mt-1 text-xs text-apple-gray-400 dark:text-apple-gray-500 truncate group-hover:text-amber-500 transition-colors">
          {dueTodayHomeworkCount > 0 ? 'Срок истекает сегодня' : 'Нет дедлайнов на сегодня'}
        </p>
      </div>

      {/* Overdue */}
      <div
        onClick={() => onNavigateToTab('homework')}
        className={`p-4 sm:p-5 rounded-3xl backdrop-blur-xl border transition-all cursor-pointer group ${
          overdueHomeworkCount > 0
            ? 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20 shadow-apple-card'
            : 'bg-white/70 dark:bg-zinc-900/70 border-black/5 dark:border-white/10 shadow-apple-card'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-apple-gray-500 dark:text-apple-gray-400">
            Просрочено
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              overdueHomeworkCount > 0
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                : 'bg-black/5 dark:bg-white/10 text-apple-gray-400'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span
            className={`text-3xl font-bold tracking-tight ${
              overdueHomeworkCount > 0
                ? 'text-apple-red dark:text-rose-400'
                : 'text-apple-gray-900 dark:text-white'
            }`}
          >
            {overdueHomeworkCount}
          </span>
          <span className="text-xs text-apple-gray-500 dark:text-apple-gray-400">долгов</span>
        </div>
        <p className="mt-1 text-xs text-apple-gray-400 dark:text-apple-gray-500 truncate group-hover:text-apple-red transition-colors">
          {overdueHomeworkCount > 0 ? 'Требуют сдачи!' : 'Все долги закрыты'}
        </p>
      </div>

      {/* Active homework */}
      <div
        onClick={() => onNavigateToTab('homework')}
        className="p-4 sm:p-5 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-card hover:shadow-apple-hover transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-apple-gray-500 dark:text-apple-gray-400">
            Всего в работе
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-apple-gray-900 dark:text-white">
            {activeHomeworkCount}
          </span>
          <span className="text-xs text-apple-gray-500 dark:text-apple-gray-400">задач</span>
        </div>
        <p className="mt-1 text-xs text-apple-gray-400 dark:text-apple-gray-500 truncate group-hover:text-emerald-500 transition-colors">
          Открыть список заданий
        </p>
      </div>
    </div>
  );
};
