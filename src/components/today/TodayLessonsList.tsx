import React, { useState, useEffect } from 'react';
import { MapPin, User, ChevronRight, CalendarCheck } from 'lucide-react';
import { ParsedLesson } from '../../types/schedule';
import { LessonTypeBadge } from '../ui/Badge';
import { getLessonStatus } from '../../utils/scheduleParser';

interface TodayLessonsListProps {
  lessons: ParsedLesson[];
  onSelectLesson: (lesson: ParsedLesson) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  now?: Date;
}

export const TodayLessonsList: React.FC<TodayLessonsListProps> = ({
  lessons,
  onSelectLesson,
  emptyTitle,
  emptyDescription,
  now: externalNow,
}) => {
  const [internalNow, setInternalNow] = useState(() => new Date());

  useEffect(() => {
    if (externalNow) return;
    let intervalId: ReturnType<typeof setInterval>;
    const syncTime = () => setInternalNow(new Date());

    const currentTime = new Date();
    const msUntilNextMinute = (60 - currentTime.getSeconds()) * 1000 - currentTime.getMilliseconds();

    const timeoutId = setTimeout(() => {
      syncTime();
      intervalId = setInterval(syncTime, 60 * 1000);
    }, Math.max(500, msUntilNextMinute));

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [externalNow]);

  const now = externalNow || internalNow;

  if (lessons.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#242424] border border-zinc-200 dark:border-[#303030] shadow-sm select-none">
        <CalendarCheck className="w-10 h-10 mx-auto text-emerald-500/80 mb-2.5" />
        <h4 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {emptyTitle || 'Пар сегодня нет'}
        </h4>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
          {emptyDescription ||
            'Расписание на сегодня пустое. Вы можете заняться заданиями или посмотреть расписание на другие дни.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {lessons.map((lesson) => {
        const status = getLessonStatus(lesson, now);
        const isCurrent = status.status === 'current';
        const isPassed = status.status === 'passed';

        return (
          <div
            key={lesson.id}
            onClick={() => onSelectLesson(lesson)}
            className={`group p-4 rounded-2xl border transition-all duration-150 ease-out cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none ${
              isCurrent
                ? 'bg-blue-50/50 dark:bg-[#242424] border-l-4 border-l-[#2B82FB] border-zinc-200 dark:border-[#383838] shadow-sm ring-1 ring-[#2B82FB]/30'
                : isPassed
                ? 'bg-zinc-50 dark:bg-[#1E1E1E] border-zinc-200 dark:border-[#2A2A2A] opacity-50 hover:opacity-100'
                : 'bg-white dark:bg-[#242424] border-zinc-200 dark:border-[#303030] shadow-xs hover:border-zinc-300 dark:hover:border-[#3C3C3C]'
            }`}
          >
            {/* Left: Time and Pair number */}
            <div className="flex items-start sm:items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-[#2C2C2C] flex flex-col items-center justify-center text-center font-mono shrink-0">
                <span className="text-xs font-bold text-[#2B82FB] uppercase leading-none">
                  {lesson.pairNumber}
                </span>
                <span className="text-[9px] text-zinc-400 uppercase leading-none mt-0.5">
                  пара
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-semibold font-mono text-zinc-900 dark:text-zinc-100 whitespace-nowrap shrink-0">
                    {lesson.startTime}&nbsp;—&nbsp;{lesson.endTime}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-[#2B82FB] text-white animate-pulse whitespace-nowrap shrink-0">
                      Идёт
                    </span>
                  )}
                  {isPassed && (
                    <span className="text-[10px] text-zinc-400 whitespace-nowrap shrink-0">
                      Завершено
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <LessonTypeBadge type={lesson.type} label={lesson.typeLabel} />
                </div>
              </div>
            </div>

            {/* Middle: Subject, Teacher, Auditorium */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight truncate group-hover:text-[#2B82FB] transition-colors">
                {lesson.subject}
              </h4>
              <div className="mt-1 flex flex-wrap items-center gap-x-3.5 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#2B82FB] shrink-0" />
                  <span className="truncate">
                    {lesson.building}, {lesson.auditorium}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate">{lesson.teacher}</span>
                </span>
              </div>
            </div>

            {/* Right: Chevron */}
            <div className="hidden sm:flex items-center text-zinc-400 group-hover:text-[#2B82FB] group-hover:translate-x-0.5 transition-all">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
