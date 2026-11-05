import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, GraduationCap, Bell } from 'lucide-react';
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
  onOpenBells?: () => void;
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
  onOpenBells,
}) => {
  const lastStudyDay = new Date(selectedWeekMonday);
  lastStudyDay.setDate(selectedWeekMonday.getDate() + (days.length > 0 ? days.length - 1 : 5));

  const rangeStr = `${formatRussianDate(selectedWeekMonday)} — ${formatRussianDate(lastStudyDay, true)}`;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1F1F1F] border border-zinc-200 dark:border-[#2C2C2C] shadow-sm space-y-3.5 select-none">
      {/* Top Bar: Nav controls, Academic schedule badge & Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Navigation buttons and Academic schedule button together on the same line */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1">
            <button
              onClick={onPrevWeek}
              className="p-1.5 rounded-lg bg-zinc-100 dark:bg-[#2C2C2C] hover:bg-zinc-200 dark:hover:bg-[#383838] text-zinc-700 dark:text-zinc-300 transition-colors active:scale-95 cursor-pointer"
              title="Предыдущая неделя"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={onGoToToday}
              className="px-2.5 py-1.5 rounded-lg bg-[#2B82FB]/10 hover:bg-[#2B82FB]/20 text-[#2B82FB] font-semibold text-xs transition-colors active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Сегодня</span>
            </button>

            <button
              onClick={onNextWeek}
              className="p-1.5 rounded-lg bg-zinc-100 dark:bg-[#2C2C2C] hover:bg-zinc-200 dark:hover:bg-[#383838] text-zinc-700 dark:text-zinc-300 transition-colors active:scale-95 cursor-pointer"
              title="Следующая неделя"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Academic schedule button (График) - next to today button on the same line */}
          {onOpenAcademicSchedule && (
            <button
              type="button"
              onClick={onOpenAcademicSchedule}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-zinc-100 dark:bg-[#2C2C2C] hover:bg-zinc-200 dark:hover:bg-[#383838] transition-colors active:scale-95 shrink-0 cursor-pointer"
              title="Посмотреть график учебного процесса"
            >
              <GraduationCap className="w-3.5 h-3.5 opacity-70" />
              <span>График</span>
            </button>
          )}

          {/* KSU Bell Times button (Звонки) */}
          {onOpenBells && (
            <button
              type="button"
              onClick={onOpenBells}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-zinc-100 dark:bg-[#2C2C2C] hover:bg-zinc-200 dark:hover:bg-[#383838] transition-colors active:scale-95 shrink-0 cursor-pointer"
              title="Посмотреть расписание звонков КГУ"
            >
              <Bell className="w-3.5 h-3.5 opacity-70 text-[#FA8C16]" />
              <span>Звонки</span>
            </button>
          )}
        </div>

        {/* Date Range */}
        <div className="flex items-center">
          <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {rangeStr}
          </span>
        </div>
      </div>

      {/* Quick Day Selector Pills */}
      <div
        className="grid gap-1.5 sm:gap-2 pt-2 border-t border-zinc-100 dark:border-[#2A2A2A]"
        style={{ gridTemplateColumns: `repeat(${days.length || 6}, minmax(0, 1fr))` }}
      >
        {days.map((day, idx) => {
          const isSelected = isSameDay(day.date, selectedDayDate);
          return (
            <button
              key={idx}
              onClick={() => onSelectDay(day.date)}
              className={`flex flex-col items-center py-2 px-1 sm:px-2 rounded-xl transition-all duration-150 active:scale-95 cursor-pointer ${
                isSelected
                  ? 'bg-[#2B82FB] text-white shadow-xs font-semibold'
                  : day.isToday
                  ? 'bg-blue-50/50 dark:bg-[#262C38] text-[#2B82FB] font-semibold border border-[#2B82FB]/40'
                  : 'bg-zinc-50 dark:bg-[#252525] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#2F2F2F] hover:text-zinc-900 dark:hover:text-white'
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
                    ? 'text-zinc-500 dark:text-zinc-400'
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
