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
      <div className="relative overflow-hidden p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-blue-50/80 via-white/80 to-purple-50/60 dark:from-zinc-900/90 dark:via-zinc-900/60 dark:to-zinc-800/40 backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-apple-card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            {todayLessonsCount === 0 ? <Coffee className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-apple-gray-900 dark:text-white">
              {todayLessonsCount === 0 ? 'Сегодня занятий нет' : 'Все пары на сегодня завершены!'}
            </h3>
            <p className="mt-0.5 text-xs sm:text-sm text-apple-gray-500 dark:text-apple-gray-400">
              {todayLessonsCount === 0
                ? 'Отличный свободный день для отдыха, спорта или выполнения домашних заданий.'
                : 'Отличная работа! Можно отдохнуть или закрыть оставшиеся дедлайны по заданиям.'}
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
      className={`relative overflow-hidden p-6 sm:p-7 rounded-3xl backdrop-blur-2xl border shadow-apple-card transition-all ${
        isCurrent
          ? 'bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-white/90 dark:from-blue-950/40 dark:via-zinc-900/80 dark:to-zinc-900/90 border-blue-500/30 dark:border-blue-500/40'
          : 'bg-white/80 dark:bg-zinc-900/80 border-black/5 dark:border-white/10'
      }`}
    >
      {/* Top row: Pair number & Live Status Pill */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-apple-blue font-mono px-2 py-0.5 rounded-md bg-apple-blue/10 dark:bg-apple-blue/20">
            {lesson.pairNumber}-я пара
          </span>
          <LessonTypeBadge type={lesson.type} label={lesson.typeLabel} />
          {lesson.subgroup > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-apple-gray-600 dark:text-apple-gray-300 font-medium">
              {lesson.subgroup}-я подгруппа
            </span>
          )}
          {lesson.isReplacement && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-apple-red dark:text-rose-400 font-medium">
              Замена
            </span>
          )}
        </div>

        {/* Live status */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            isCurrent
              ? 'bg-apple-blue text-white shadow-apple-sm animate-pulse'
              : 'bg-black/5 dark:bg-white/10 text-apple-gray-700 dark:text-apple-gray-300'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{displayBadgeText}</span>
        </div>
      </div>

      {/* Subject Name */}
      <div className="mt-4">
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-apple-gray-900 dark:text-white">
          {lesson.subject}
        </h3>
      </div>

      {/* Pair details: time, room, teacher */}
      <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-apple-gray-600 dark:text-apple-gray-300">
        <div className="flex items-center gap-1.5 font-mono font-medium">
          <Clock className="w-4 h-4 text-apple-gray-400" />
          <span>
            {lesson.startTime} — {lesson.endTime}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-apple-blue" />
          <span>
            {lesson.building}, {lesson.auditorium}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <User className="w-4 h-4 text-apple-gray-400" />
          <span>{lesson.teacher}</span>
        </div>
      </div>
    </div>
  );
};
