import React from 'react';
import { RotateCw } from 'lucide-react';
import { formatRussianDate, formatDayOfWeek } from '../../utils/dateUtils';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  subgroupFilter?: number;
  onSubgroupChange?: (sg: number) => void;
  onRefresh: () => void;
  refreshing: boolean;
  isOffline?: boolean;
  lastUpdated?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onRefresh,
  refreshing,
}) => {
  const today = new Date();
  const dateFormatted = `${formatDayOfWeek(today)}, ${formatRussianDate(today, true)}`;

  return (
    <header className="sticky top-0 z-20 bg-white/70 dark:bg-[#121214]/75 backdrop-blur-xl border-b border-black/5 dark:border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3 select-none">
      <div>
        <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-apple-gray-900 dark:text-white">
          {title || dateFormatted}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-apple-gray-500 dark:text-apple-gray-400 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="p-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-apple-gray-700 dark:text-apple-gray-300 transition-all duration-200 ease-out active:scale-90 disabled:opacity-50"
          title="Обновить расписание с сайта КГУ"
        >
          <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-apple-blue' : ''}`} />
        </button>
      </div>
    </header>
  );
};
