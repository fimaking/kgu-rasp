import React from 'react';
import { Coffee } from 'lucide-react';
import { WeekDaySchedule, ParsedLesson } from '../../types/schedule';
import { LessonCard } from './LessonCard';
import { formatRussianDate } from '../../utils/dateUtils';

interface DayCardProps {
  daySchedule: WeekDaySchedule;
  onSelectLesson: (lesson: ParsedLesson) => void;
}

export const DayCard: React.FC<DayCardProps> = ({ daySchedule, onSelectLesson }) => {
  const { dayName, date, isToday, lessons } = daySchedule;

  return (
    <div
      id={isToday ? 'day-card-today' : undefined}
      className={`p-5 rounded-3xl backdrop-blur-xl border transition-all ${
        isToday
          ? 'bg-blue-500/[0.03] dark:bg-blue-500/[0.05] border-apple-blue/30 shadow-apple-card ring-1 ring-apple-blue/20'
          : 'bg-white/60 dark:bg-zinc-900/60 border-black/5 dark:border-white/10 shadow-apple-sm'
      }`}
    >
      {/* Day Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/5 dark:border-white/5 select-none">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-apple-gray-900 dark:text-white">
              {dayName}
            </h4>
            {isToday && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-apple-blue text-white shadow-apple-sm">
                Сегодня
              </span>
            )}
          </div>
          <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400 mt-0.5">
            {formatRussianDate(date, false)}
          </p>
        </div>

        <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-apple-gray-600 dark:text-apple-gray-400">
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
        <div className="py-8 text-center">
          <Coffee className="w-7 h-7 mx-auto text-apple-gray-300 dark:text-apple-gray-600 mb-2" />
          <p className="text-xs font-medium text-apple-gray-500 dark:text-apple-gray-400">
            Нет занятий
          </p>
          <p className="text-[11px] text-apple-gray-400">Свободный день</p>
        </div>
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
