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
}

export const TodayLessonsList: React.FC<TodayLessonsListProps> = ({
  lessons,
  onSelectLesson,
  emptyTitle,
  emptyDescription,
}) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    const syncTime = () => setNow(new Date());

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
  }, []);

  if (lessons.length === 0) {
    return (
      <div className="p-8 text-center rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-card">
        <CalendarCheck className="w-12 h-12 mx-auto text-emerald-500/70 mb-3" />
        <h4 className="text-base font-semibold text-apple-gray-900 dark:text-white">
          {emptyTitle || 'Пар сегодня нет'}
        </h4>
        <p className="mt-1 text-xs sm:text-sm text-apple-gray-500 dark:text-apple-gray-400 max-w-sm mx-auto">
          {emptyDescription ||
            'Расписание на сегодня пустое. Вы можете заняться домашними заданиями или посмотреть расписание на другие дни.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
      {lessons.map((lesson) => {
        const status = getLessonStatus(lesson, now);
        const isCurrent = status.status === 'current';
        const isPassed = status.status === 'passed';

        return (
          <div
            key={lesson.id}
            onClick={() => onSelectLesson(lesson)}
            className={`group p-4 sm:p-5 rounded-3xl backdrop-blur-xl border transition-all duration-200 ease-out cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 active:scale-[0.985] hover:-translate-y-0.5 ${
              isCurrent
                ? 'bg-blue-500/5 dark:bg-blue-500/10 border-apple-blue/40 shadow-apple-hover ring-2 ring-apple-blue/20'
                : isPassed
                ? 'bg-white/40 dark:bg-zinc-900/40 border-black/5 dark:border-white/5 opacity-60 hover:opacity-100 hover:shadow-apple-sm'
                : 'bg-white/80 dark:bg-zinc-900/80 border-black/5 dark:border-white/10 hover:shadow-apple-hover'
            }`}
          >
            {/* Left: Time and Pair number */}
            <div className="flex items-start sm:items-center gap-4 shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/10 flex flex-col items-center justify-center text-center font-mono shrink-0">
                <span className="text-[11px] font-bold text-apple-blue uppercase leading-none">
                  {lesson.pairNumber}
                </span>
                <span className="text-[10px] text-apple-gray-400 uppercase leading-none mt-0.5">
                  пара
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold font-mono text-apple-gray-900 dark:text-white whitespace-nowrap shrink-0">
                    {lesson.startTime}&nbsp;—&nbsp;{lesson.endTime}
                  </span>
                  {isCurrent && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-apple-blue text-white animate-pulse whitespace-nowrap shrink-0">
                      Идёт пара
                    </span>
                  )}
                  {isPassed && (
                    <span className="text-[11px] text-apple-gray-400 whitespace-nowrap shrink-0">Завершено</span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <LessonTypeBadge type={lesson.type} label={lesson.typeLabel} />
                  {lesson.subgroup > 0 && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-apple-gray-500 font-medium whitespace-nowrap shrink-0">
                      {lesson.subgroup}&nbsp;п/г
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Middle: Subject, Teacher, Auditorium */}
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-apple-gray-900 dark:text-white tracking-tight truncate group-hover:text-apple-blue transition-colors">
                {lesson.subject}
              </h4>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-apple-gray-500 dark:text-apple-gray-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-apple-blue shrink-0" />
                  <span className="truncate">
                    {lesson.building}, {lesson.auditorium}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-apple-gray-400 shrink-0" />
                  <span className="truncate">{lesson.teacher}</span>
                </span>
              </div>
            </div>

            {/* Right: Chevron */}
            <div className="hidden sm:flex items-center text-apple-gray-400 group-hover:text-apple-blue group-hover:translate-x-0.5 transition-all">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
