import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, GraduationCap } from 'lucide-react';
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
  info?: RaspInfo | null;
  onOpenAcademicSchedule?: () => void;
  academicWeekNumber?: number;
}

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  selectedWeekMonday,
  onPrevWeek,
  onNextWeek,
  onGoToToday,
  selectedDayDate,
  onSelectDay,
  days,
  onOpenAcademicSchedule,
  academicWeekNumber,
}) => {
  const lastStudyDay = new Date(selectedWeekMonday);
  lastStudyDay.setDate(selectedWeekMonday.getDate() + (days.length > 0 ? days.length - 1 : 5));

  const rangeStr = `${formatRussianDate(selectedWeekMonday)} — ${formatRussianDate(lastStudyDay, true)}`;

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-card space-y-4 select-none">
      {/* Top Bar: Nav controls, Academic schedule badge & Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevWeek}
            className="p-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-apple-gray-700 dark:text-apple-gray-200 transition-all duration-200 ease-out active:scale-90"
            title="Предыдущая неделя"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={onGoToToday}
            className="px-3.5 py-1.5 rounded-xl bg-apple-blue/10 dark:bg-apple-blue/20 hover:bg-apple-blue/20 text-apple-blue font-semibold text-xs transition-all duration-200 ease-out active:scale-95 flex items-center gap-1.5"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Сегодня</span>
          </button>

          <button
            onClick={onNextWeek}
            className="p-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-apple-gray-700 dark:text-apple-gray-200 transition-all duration-200 ease-out active:scale-90"
            title="Следующая неделя"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Academic schedule plaque (График уч. процесса) */}
        {onOpenAcademicSchedule && (
          <button
            type="button"
            onClick={onOpenAcademicSchedule}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-semibold text-apple-gray-800 dark:text-zinc-200 transition-all active:scale-95 shadow-apple-sm"
            title="Посмотреть официальный график учебного процесса 1 курса"
          >
            <GraduationCap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>График уч. процесса</span>
            {academicWeekNumber && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-mono font-bold">
                {academicWeekNumber} нед.
              </span>
            )}
          </button>
        )}

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-apple-gray-900 dark:text-white">
            {rangeStr}
          </span>
        </div>
      </div>

      {/* Quick Day Selector Pills */}
      <div
        className="grid gap-1.5 sm:gap-2 pt-2 border-t border-black/5 dark:border-white/5"
        style={{ gridTemplateColumns: `repeat(${days.length || 6}, minmax(0, 1fr))` }}
      >
        {days.map((day, idx) => {
          const isSelected = isSameDay(day.date, selectedDayDate);
          return (
            <button
              key={idx}
              onClick={() => onSelectDay(day.date)}
              className={`flex flex-col items-center py-2 px-1 sm:px-2 rounded-2xl transition-all duration-200 ease-out active:scale-95 ${
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
