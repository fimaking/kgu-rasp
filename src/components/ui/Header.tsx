import React from 'react';
import { RotateCw, WifiOff, Users } from 'lucide-react';
import { formatRussianDate, formatDayOfWeek } from '../../utils/dateUtils';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  subgroupFilter?: number;
  onSubgroupChange?: (sg: number) => void;
  onRefresh: () => void;
  refreshing: boolean;
  isOffline: boolean;
  lastUpdated: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onRefresh,
  refreshing,
  isOffline,
  lastUpdated,
}) => {
  const today = new Date();
  const dateFormatted = `${formatDayOfWeek(today)}, ${formatRussianDate(today, true)}`;

  const formatLastSync = (iso: string | null) => {
    if (!iso) return 'Не синхронизировано';
    try {
      const d = new Date(iso);
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `КГУ EIOS: ${d.getDate()} окт, ${hours}:${mins}`;
    } catch {
      return 'Синхронизировано';
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/70 dark:bg-[#121214]/75 backdrop-blur-xl border-b border-black/5 dark:border-white/10 px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-apple-gray-900 dark:text-white">
          {title || dateFormatted}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-apple-gray-500 dark:text-apple-gray-400 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* User Personalization Badge: 1st subgroup + German */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-apple-blue/10 dark:bg-apple-blue/15 text-apple-blue border border-apple-blue/20 text-xs font-semibold">
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span>1 подгруппа • Немецкий</span>
        </div>

        {/* Sync status & Refresh button */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${
              isOffline
                ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20'
            }`}
            title="Статус обновления расписания"
          >
            {isOffline ? (
              <WifiOff className="w-3 h-3 text-amber-500" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
            <span className="truncate max-w-[150px] sm:max-w-none">
              {isOffline ? 'Кэш расписания' : formatLastSync(lastUpdated)}
            </span>
          </div>

          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-apple-gray-700 dark:text-apple-gray-300 transition-colors disabled:opacity-50"
            title="Обновить расписание с сайта КГУ"
          >
            <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-apple-blue' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
