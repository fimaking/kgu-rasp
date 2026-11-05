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
      className={`p-5 rounded-3xl backdrop-blur-xl border transition-all duration-200 ${
        isHighlighted
          ? 'bg-blue-500/[0.08] dark:bg-blue-500/[0.14] border-apple-blue/50 dark:border-apple-blue/50 shadow-apple-card ring-2 ring-apple-blue/30 dark:ring-apple-blue/40'
          : 'bg-white/60 dark:bg-zinc-900/60 border-black/5 dark:border-white/10 shadow-apple-sm hover:shadow-apple-card'
      }`}
    >
      {/* Day Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/5 dark:border-white/5 select-none">
        <div>
          <div className="flex items-center gap-2">
            <h4
              className={`text-base font-bold transition-colors ${
                isHighlighted
                  ? 'text-apple-blue dark:text-blue-400'
                  : 'text-apple-gray-900 dark:text-white'
              }`}
            >
              {dayName}
            </h4>
            {isToday && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-apple-blue text-white shadow-apple-sm">
                Сегодня
              </span>
            )}
            {holiday && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <Flag className="w-2.5 h-2.5" />
                <span>Праздник</span>
              </span>
            )}
          </div>
          <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400 mt-0.5">
            {formatRussianDate(date, false)}
          </p>
        </div>

        <span
          className={`text-xs font-mono font-medium px-2 py-0.5 rounded-full transition-colors ${
            isHighlighted
              ? 'bg-apple-blue/15 text-apple-blue dark:text-blue-300 font-semibold'
              : 'bg-black/5 dark:bg-white/10 text-apple-gray-600 dark:text-apple-gray-400'
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
          <div className="py-7 text-center">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto mb-2 flex items-center justify-center shadow-apple-sm">
              <Flag className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
              {holiday.name}
            </p>
            <p className="text-[11px] text-apple-gray-400 mt-0.5">Нерабочий праздничный день КГУ</p>
          </div>
        ) : stage && stage.type !== 'theory' ? (
          <div className="py-7 text-center">
            <div className={`w-10 h-10 rounded-2xl ${stage.color.bg} ${stage.color.text} mx-auto mb-2 flex items-center justify-center shadow-apple-sm`}>
              <GraduationCap className="w-5 h-5" />
            </div>
            <p className={`text-xs font-bold ${stage.color.text}`}>
              {stage.title}
            </p>
            <p className="text-[11px] text-apple-gray-400 mt-0.5 line-clamp-1">{stage.description}</p>
          </div>
        ) : (
          <div className="py-8 text-center">
            <Coffee
              className={`w-7 h-7 mx-auto mb-2 ${
                isHighlighted ? 'text-apple-blue/60 dark:text-blue-400/60' : 'text-apple-gray-300 dark:text-apple-gray-600'
              }`}
            />
            <p className="text-xs font-medium text-apple-gray-500 dark:text-apple-gray-400">
              Нет занятий
            </p>
            <p className="text-[11px] text-apple-gray-400">Свободный день</p>
          </div>
        )
      ) : (
        <div className="space-y-2.5">
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
