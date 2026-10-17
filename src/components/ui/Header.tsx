import React from 'react';
import { RotateCw, ChevronDown } from 'lucide-react';
import { formatRussianDate, formatDayOfWeek } from '../../utils/dateUtils';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  groupName?: string;
  subgroupFilter?: number;
  onSubgroupChange?: (sg: number) => void;
  onOpenGroupSelect?: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  isOffline?: boolean;
  lastUpdated?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  groupName,
  subgroupFilter,
  onOpenGroupSelect,
  onRefresh,
  refreshing,
}) => {
  const today = new Date();
  const dateFormatted = `${formatDayOfWeek(today)}, ${formatRussianDate(today, true)}`;

  return (
    <header className="sticky top-0 z-20 bg-white/75 dark:bg-[#121214]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/10 px-4 sm:px-8 py-3 sm:py-3.5 flex items-center justify-between gap-3 select-none">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 min-w-0">
        <h2 className="text-base sm:text-xl md:text-2xl font-bold tracking-tight text-apple-gray-900 dark:text-white">
          {title || dateFormatted}
        </h2>
        {groupName && (
          <button
            type="button"
            onClick={onOpenGroupSelect}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-semibold bg-apple-blue/10 dark:bg-apple-blue/15 border border-apple-blue/25 text-apple-blue shadow-apple-sm shrink-0 select-none hover:bg-apple-blue/20 active:scale-95 transition-all cursor-pointer group"
            title="Выбрать другую группу или подгруппу"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-apple-blue opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-apple-blue"></span>
            </span>
            <span className="font-medium opacity-80">Группа</span>
            <span className="font-bold">{groupName}</span>
            {subgroupFilter !== undefined && subgroupFilter > 0 && (
              <span className="text-[11px] opacity-80 font-medium border-l border-apple-blue/30 pl-1.5">
                {subgroupFilter} п/г
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5" />
          </button>
        )}
        {subtitle && (
          <p className="text-xs sm:text-sm text-apple-gray-500 dark:text-apple-gray-400 font-medium w-full">
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
