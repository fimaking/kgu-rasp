import React from 'react';
import { Coffee, Flag, GraduationCap } from 'lucide-react';
import { WeekDaySchedule, ParsedLesson } from '../../types/schedule';
import { LessonCard } from './LessonCard';
import { formatRussianDate } from '../../utils/dateUtils';
import { getHolidayForDate, getAcademicStageForDate } from '../../data/academicCalendar';

interface DayCardProps {
  daySchedule: WeekDaySchedule;
  isSelected?: boolean;
  onSelectDay?: () => void;
  onSelectLesson: (lesson: ParsedLesson) => void;
}

export const DayCard: React.FC<DayCardProps> = ({
  daySchedule,
  isSelected = false,
  onSelectDay,
  onSelectLesson,
}) => {
  const { dayName, date, dateStr, isToday, lessons } = daySchedule;
  const isHighlighted = isToday || isSelected;
  const holiday = getHolidayForDate(date);
  const stage = getAcademicStageForDate(date);

  return (
    <div
      id={isToday ? 'day-card-today' : `day-card-${dateStr}`}
      data-date={dateStr}
      onClick={onSelectDay}
      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-150 ${
        isHighlighted
          ? 'bg-blue-50/20 dark:bg-[#21242C] border-[#2B82FB]/60 ring-1 ring-[#2B82FB]/25 shadow-sm'
          : 'bg-white dark:bg-[#1F1F1F] border-zinc-200 dark:border-[#2C2C2C] shadow-2xs hover:border-zinc-300 dark:hover:border-[#383838]'
      }`}
    >
      {/* Day Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-zinc-100 dark:border-[#2A2A2A] select-none">
        <div>
          <div className="flex items-center gap-2">
            <h4
              className={`text-sm sm:text-base font-bold transition-colors ${
                isHighlighted
                  ? 'text-[#2B82FB] dark:text-[#60A5FA]'
                  : 'text-zinc-900 dark:text-zinc-100'
              }`}
            >
              {dayName}
            </h4>
            {isToday && (
              <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-[#2B82FB] text-white shadow-2xs">
                Сегодня
              </span>
            )}
            {holiday && (
              <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-red-500/15 text-red-600 dark:text-red-400 flex items-center gap-1">
                <Flag className="w-2.5 h-2.5" />
                <span>Праздник</span>
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {formatRussianDate(date, false)}
          </p>
        </div>

        <span
          className={`text-xs font-mono font-medium px-2 py-0.5 rounded-md transition-colors ${
            isHighlighted
              ? 'bg-[#2B82FB]/10 text-[#2B82FB] dark:text-[#60A5FA] font-semibold'
              : 'bg-zinc-100 dark:bg-[#2A2A2A] text-zinc-600 dark:text-zinc-400'
          }`}
        >
          {lessons.length}{' '}
          {lessons.length === 1
            ? 'пара'
            : lessons.length >= 2 && lessons.length <= 4
            ? 'пары'
            : 'пар'}
        </span>
      </div>

      {/* Lessons List */}
      {lessons.length === 0 ? (
        holiday ? (
          <div className="py-6 text-center">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 mx-auto mb-2 flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-red-600 dark:text-red-400">
              {holiday.name}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Нерабочий праздничный день КГУ</p>
          </div>
        ) : stage && stage.type !== 'theory' ? (
          <div className="py-6 text-center">
            <div className={`w-9 h-9 rounded-xl ${stage.color.bg} ${stage.color.text} mx-auto mb-2 flex items-center justify-center`}>
              <GraduationCap className="w-4 h-4" />
            </div>
            <p className={`text-xs font-bold ${stage.color.text}`}>
              {stage.title}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{stage.description}</p>
          </div>
        ) : (
          <div className="py-6 text-center">
            <Coffee
              className={`w-6 h-6 mx-auto mb-1.5 ${
                isHighlighted ? 'text-[#2B82FB]/60' : 'text-zinc-300 dark:text-zinc-600'
              }`}
            />
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Нет занятий
            </p>
            <p className="text-[11px] text-zinc-400">Свободный день</p>
          </div>
        )
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onClick={() => onSelectLesson(lesson)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
