import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { formatRussianDate, isSameDay } from '../../utils/dateUtils';
import { RaspInfo } from '../../types/schedule';

interface WeekNavigatorProps {
  selectedWeekMonday: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onGoToToday: () => void;
  selectedDayDate: Date;
  onSelectDay: (date: Date) => void;
  days: { date: Date; shortDayName: string; isToday: boolean; count: number }[];
  info: RaspInfo | null;
}

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  selectedWeekMonday,
  onPrevWeek,
  onNextWeek,
  onGoToToday,
  selectedDayDate,
  onSelectDay,
  days,
  info,
}) => {
  const sunday = new Date(selectedWeekMonday);
  sunday.setDate(selectedWeekMonday.getDate() + 6);

  const rangeStr = `${formatRussianDate(selectedWeekMonday)} — ${formatRussianDate(sunday, true)}`;

  const weekTypeLabel =
    info?.curNumNed === 1
      ? 'Числитель (над чертой)'
      : info?.curNumNed === 2
      ? 'Знаменатель (под чертой)'
      : 'Учебная неделя';

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-card space-y-4 select-none">
      {/* Top Bar: Nav controls & Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevWeek}
            className="p-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-apple-gray-700 dark:text-apple-gray-200 transition-colors"
            title="Предыдущая неделя"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={onGoToToday}
            className="px-3.5 py-1.5 rounded-xl bg-apple-blue/10 dark:bg-apple-blue/20 hover:bg-apple-blue/20 text-apple-blue font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Сегодня</span>
          </button>

          <button
            onClick={onNextWeek}
            className="p-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-apple-gray-700 dark:text-apple-gray-200 transition-colors"
            title="Следующая неделя"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Date Range & Week Type Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-apple-gray-900 dark:text-white">
            {rangeStr}
          </span>
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-apple-indigo/10 dark:bg-apple-indigo/20 text-apple-indigo dark:text-indigo-300 font-semibold border border-apple-indigo/20">
            <Sparkles className="w-3 h-3" />
            <span>{weekTypeLabel}</span>
          </span>
        </div>
      </div>

      {/* Quick Day Selector Pills */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-2 border-t border-black/5 dark:border-white/5">
        {days.map((day, idx) => {
          const isSelected = isSameDay(day.date, selectedDayDate);
          return (
            <button
              key={idx}
              onClick={() => onSelectDay(day.date)}
              className={`flex flex-col items-center py-2 px-1 sm:px-2 rounded-2xl transition-all duration-150 ${
                isSelected
                  ? 'bg-apple-blue text-white shadow-apple-sm font-semibold scale-102'
                  : day.isToday
                  ? 'bg-blue-500/10 dark:bg-blue-500/20 text-apple-blue font-semibold border border-blue-500/30'
                  : 'bg-black/[0.03] dark:bg-white/[0.04] text-apple-gray-600 dark:text-apple-gray-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-apple-gray-900 dark:hover:text-white'
              }`}
            >
              <span className="text-[11px] uppercase tracking-wider font-medium opacity-80">
                {day.shortDayName}
              </span>
              <span className="text-base sm:text-lg font-bold font-mono mt-0.5">
                {day.date.getDate()}
              </span>
              <span
                className={`text-[10px] mt-0.5 px-1.5 rounded-full font-mono ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : day.count > 0
                    ? 'text-apple-gray-500 dark:text-apple-gray-400'
                    : 'opacity-40'
                }`}
              >
                {day.count > 0 ? `${day.count} п.` : '—'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
