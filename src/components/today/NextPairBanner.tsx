import React, { useState, useEffect } from 'react';
import { Clock, MapPin, User, Sparkles, Coffee } from 'lucide-react';
import { ParsedLesson } from '../../types/schedule';
import { LessonTypeBadge } from '../ui/Badge';
import { getLessonStatus } from '../../utils/scheduleParser';

interface NextPairBannerProps {
  currentOrNext: {
    lesson: ParsedLesson;
    status: 'current' | 'upcoming';
    info: {
      badgeText: string;
      minutesUntilStart: number;
      minutesUntilEnd: number;
    };
  } | null;
  todayLessonsCount: number;
}

export const NextPairBanner: React.FC<NextPairBannerProps> = ({
  currentOrNext,
  todayLessonsCount,
}) => {
  // Real-time minute tick for automatic live countdown updates
  const [, setTick] = useState(0);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    const syncTime = () => setTick((t) => t + 1);

    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    const timeoutId = setTimeout(() => {
      syncTime();
      intervalId = setInterval(syncTime, 60 * 1000);
    }, Math.max(500, msUntilNextMinute));

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  if (!currentOrNext) {
    return (
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#242424] border border-zinc-200 dark:border-[#303030] border-l-4 border-l-emerald-500 shadow-sm transition-all select-none">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            {todayLessonsCount === 0 ? <Coffee className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
              {todayLessonsCount === 0 ? 'Сегодня занятий нет' : 'Все пары на сегодня завершены!'}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {todayLessonsCount === 0
                ? 'Отличный свободный день для отдыха, спорта или выполнения заданий.'
                : 'Отличная работа! Можно отдохнуть или закрыть оставшиеся задачи.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { lesson, status, info } = currentOrNext;
  // Calculate real-time status on every minute tick
  const liveInfo = getLessonStatus(lesson);
  const isCurrent = liveInfo.status === 'current' || status === 'current';
  const displayBadgeText = liveInfo.status !== 'passed' ? liveInfo.badgeText : info.badgeText;

  return (
    <div
      className={`relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#242424] border border-zinc-200 dark:border-[#303030] shadow-sm transition-all select-none ${
        isCurrent ? 'border-l-4 border-l-[#2B82FB]' : 'border-l-4 border-l-[#FA8C16]'
      }`}
    >
      {/* Top row: Pair number & Live Status Pill */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2B82FB] font-mono px-2 py-0.5 rounded-md bg-[#2B82FB]/10">
            {lesson.pairNumber} пара
          </span>
          <LessonTypeBadge type={lesson.type} label={lesson.typeLabel} />
          {lesson.isReplacement && (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-red-500/15 text-red-600 dark:text-red-400 font-medium">
              Замена
            </span>
          )}
        </div>

        {/* Live status */}
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
            isCurrent
              ? 'bg-[#2B82FB] text-white shadow-xs animate-pulse'
              : 'bg-zinc-100 dark:bg-[#2C2C2C] text-zinc-700 dark:text-zinc-300'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{displayBadgeText}</span>
        </div>
      </div>

      {/* Subject Name */}
      <div className="mt-3">
        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {lesson.subject}
        </h3>
      </div>

      {/* Pair details: time, room, teacher */}
      <div className="mt-3 flex flex-wrap items-center gap-y-1.5 gap-x-5 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-1.5 font-mono font-medium">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span>
            {lesson.startTime} — {lesson.endTime}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#2B82FB]" />
          <span>
            {lesson.building}, {lesson.auditorium}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-zinc-400" />
          <span>{lesson.teacher}</span>
        </div>
      </div>
    </div>
  );
};
