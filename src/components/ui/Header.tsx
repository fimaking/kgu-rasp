import React from 'react';
import { RotateCw, WifiOff, Users } from 'lucide-react';
import { formatRussianDate, formatDayOfWeek } from '../../utils/dateUtils';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  subgroupFilter: number;
  onSubgroupChange: (sg: number) => void;
  onRefresh: () => void;
  refreshing: boolean;
  isOffline: boolean;
  lastUpdated: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  subgroupFilter,
  onSubgroupChange,
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
        {/* Subgroup Switcher */}
        <div className="flex items-center p-1 bg-black/5 dark:bg-white/10 rounded-2xl border border-black/5 dark:border-white/5 text-xs font-medium">
          <Users className="w-3.5 h-3.5 ml-2 mr-1 text-apple-gray-500 hidden sm:inline-block" />
          {[
            { id: 0, label: 'Все' },
            { id: 1, label: '1 п/г' },
            { id: 2, label: '2 п/г' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onSubgroupChange(item.id)}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                subgroupFilter === item.id
                  ? 'bg-white dark:bg-zinc-800 text-apple-gray-900 dark:text-white font-semibold shadow-apple-sm'
                  : 'text-apple-gray-600 dark:text-apple-gray-400 hover:text-apple-gray-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
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
