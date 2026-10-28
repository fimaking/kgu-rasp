import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getHolidayForDate } from '../../data/academicCalendar';
import { DayEventsSummary, CalendarCustomEvent } from '../../types/calendar';
import { ParsedLesson } from '../../types/schedule';
import { Homework } from '../../types/homework';
import { DayScheduleDrawer } from './DayScheduleDrawer';
import { AddEventModal } from './AddEventModal';
import {
  getMonthNameNominative,
  formatDateToIso,
  isToday,
  isSameDay,
} from '../../utils/dateUtils';

interface CalendarViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  selectedDaySummary: DayEventsSummary;
  eventsByDate: Map<string, { lessonCount: number; hwCount: number; customCount: number }>;
  onSelectLesson: (lesson: ParsedLesson) => void;
  onSelectHomework: (hw: Homework) => void;
  onAddEvent: (event: Omit<CalendarCustomEvent, 'id' | 'createdAt'>) => void;
  onDeleteEvent: (id: string) => void;
  subjectsList: string[];
  allCustomEvents?: CalendarCustomEvent[];
  allHomework?: Homework[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  onSelectDate,
  selectedDaySummary,
  eventsByDate,
  onSelectLesson,
  onSelectHomework,
  onAddEvent,
  onDeleteEvent,
  subjectsList,
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);

  // Month navigation
  const prevMonth = () => {
    setCurrentMonthDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonthDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
    onSelectDate(now);
  };

  // Generate month days matrix
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // First day of week (0 = Sun, 1 = Mon...)
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes 6

  // Previous month filler days
  const prevMonthLastDate = new Date(year, month, 0).getDate();
  const prevDays = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    prevDays.push(new Date(year, month - 1, prevMonthLastDate - i));
  }

  // Current month days
  const currentDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentDays.push(new Date(year, month, i));
  }

  // Next month filler days to complete rows (multiples of 7)
  const totalDaysSoFar = prevDays.length + currentDays.length;
  const nextDaysCount = (7 - (totalDaysSoFar % 7)) % 7;
  const nextDays = [];
  for (let i = 1; i <= nextDaysCount; i++) {
    nextDays.push(new Date(year, month + 1, i));
  }

  const allCalendarCells = [...prevDays, ...currentDays, ...nextDays];
  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Month Calendar Grid (7 cols on desktop) */}
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-card space-y-4 select-none">
          {/* Month Nav Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
            <span className="text-base font-bold text-apple-gray-900 dark:text-white">
              {getMonthNameNominative(month)} {year}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={goToToday}
                className="px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/10 text-xs font-semibold text-apple-gray-700 dark:text-apple-gray-200 hover:bg-black/10 transition-colors"
              >
                Сегодня
              </button>
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-xl bg-black/5 dark:bg-white/10 text-apple-gray-700 dark:text-apple-gray-200 hover:bg-black/10 transition-colors"
                title="Предыдущий месяц"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-xl bg-black/5 dark:bg-white/10 text-apple-gray-700 dark:text-apple-gray-200 hover:bg-black/10 transition-colors"
                title="Следующий месяц"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {dayNames.map((d, i) => (
              <span
                key={d}
                className={`text-xs font-semibold uppercase tracking-wider py-1 ${
                  i >= 5 ? 'text-apple-red dark:text-rose-400' : 'text-apple-gray-400'
                }`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Calendar Days Matrix */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {allCalendarCells.map((cellDate, idx) => {
              const isCurrentMonth = cellDate.getMonth() === month;
              const isSelected = isSameDay(cellDate, selectedDate);
              const isTodayCell = isToday(cellDate);
              const isoStr = formatDateToIso(cellDate);
              const dots = eventsByDate.get(isoStr);
              const cellHoliday = getHolidayForDate(cellDate);

              return (
                <button
                  key={idx}
                  onClick={() => onSelectDate(cellDate)}
                  className={`min-h-[58px] sm:min-h-[68px] p-1.5 rounded-2xl flex flex-col items-center justify-between transition-all duration-150 relative ${
                    isSelected
                      ? 'bg-apple-blue text-white shadow-apple-sm font-bold scale-[1.02] z-10'
                      : isTodayCell
                      ? 'bg-blue-500/10 dark:bg-blue-500/20 text-apple-blue font-bold border border-blue-500/30'
                      : isCurrentMonth
                      ? 'bg-black/[0.02] dark:bg-white/[0.03] text-apple-gray-800 dark:text-apple-gray-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'
                      : 'opacity-30 text-apple-gray-400'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-mono mt-0.5">
                    {cellDate.getDate()}
                  </span>

                  {/* Dots indicator */}
                  <div className="flex items-center gap-1 mt-auto mb-1">
                    {dots && dots.lessonCount > 0 && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-white' : 'bg-apple-blue'
                        }`}
                        title={`${dots.lessonCount} пар`}
                      />
                    )}
                    {dots && dots.hwCount > 0 && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-amber-300' : 'bg-apple-orange'
                        }`}
                        title={`${dots.hwCount} дедлайнов`}
                      />
                    )}
                    {dots && dots.customCount > 0 && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-rose-300' : 'bg-rose-500'
                        }`}
                        title={`${dots.customCount} событий`}
                      />
                    )}
                    {cellHoliday && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-rose-200' : 'bg-rose-500'
                        }`}
                        title={`Праздник: ${cellHoliday.name}`}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-center gap-5 text-xs text-apple-gray-500 dark:text-apple-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-apple-blue" />
              <span>Занятия</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-apple-orange" />
              <span>Дедлайны ДЗ</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Контрольные / Экзамены</span>
            </span>
          </div>
        </div>

        {/* Selected Day Timeline Drawer (5 cols on desktop) */}
        <div className="lg:col-span-5">
          <DayScheduleDrawer
            summary={selectedDaySummary}
            onSelectLesson={onSelectLesson}
            onSelectHomework={onSelectHomework}
            onOpenAddEvent={() => setIsAddEventModalOpen(true)}
            onDeleteEvent={onDeleteEvent}
          />
        </div>
      </div>

      {/* Add Custom Event Modal */}
      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        onAddEvent={onAddEvent}
        initialDate={formatDateToIso(selectedDate)}
        subjectsList={subjectsList}
      />
    </div>
  );
};
