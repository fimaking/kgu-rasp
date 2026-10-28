import React, { useState, useMemo, useEffect } from 'react';
import { ParsedLesson, RaspInfo } from '../../types/schedule';
import { Homework } from '../../types/homework';
import { getNextLessonDeadline, filterVisibleTodayLessons } from '../../utils/scheduleParser';
import { formatDateToIso, formatDayOfWeek, formatRussianDate } from '../../utils/dateUtils';
import { NextPairBanner } from './NextPairBanner';
import { TodayLessonsList } from './TodayLessonsList';
import { TodayHomeworkWidget } from './TodayHomeworkWidget';
import { LessonModal } from '../schedule/LessonModal';

interface TodayViewProps {
  todayLessons: ParsedLesson[];
  allLessons?: ParsedLesson[];
  currentOrNextLesson: {
    lesson: ParsedLesson;
    status: 'current' | 'upcoming';
    info: {
      badgeText: string;
      minutesUntilStart: number;
      minutesUntilEnd: number;
    };
  } | null;
  dueTodayList?: Homework[];
  dueTomorrowList?: Homework[];
  overdueList: Homework[];
  activeHomeworkCount?: number;
  info?: RaspInfo | null;
  onNavigateToTab: (tab: 'schedule' | 'homework' | 'calendar') => void;
  onToggleCompleteHomework: (id: string) => void;
  onOpenCreateHomework: (options?: {
    subject?: string;
    dueDate?: string;
    dueTime?: string;
    lessonType?: string;
  }) => void;
  onSelectHomework: (hw: Homework) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  todayLessons,
  allLessons = [],
  currentOrNextLesson,
  dueTodayList = [],
  dueTomorrowList,
  overdueList,
  onNavigateToTab,
  onToggleCompleteHomework,
  onOpenCreateHomework,
  onSelectHomework,
}) => {
  const [selectedLesson, setSelectedLesson] = useState<ParsedLesson | null>(null);

  // Live minute ticker to auto-remove finished pairs and update counts in real time
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

  // Filter today's lessons:
  // - Once a pair concludes, it is removed from the list.
  // - The final pair of the day stays visible for 10 minutes after ending, then disappears.
  const visibleTodayLessons = useMemo(() => {
    return filterVisibleTodayLessons(todayLessons, now);
  }, [todayLessons, now]);

  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }, []);

  const tomorrowDateStr = useMemo(() => formatDateToIso(tomorrow), [tomorrow]);

  const tomorrowLessons = useMemo(() => {
    return allLessons
      .filter((l) => l.dateStr === tomorrowDateStr)
      .sort((a, b) => a.pairNumber - b.pairNumber);
  }, [allLessons, tomorrowDateStr]);

  const tomorrowDayFormatted = useMemo(() => {
    return `${formatDayOfWeek(tomorrow)}, ${formatRussianDate(tomorrow, false)}`;
  }, [tomorrow]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* 1. Hero: Current or Next Pair (вверху) */}
      <NextPairBanner
        currentOrNext={currentOrNextLesson}
        todayLessonsCount={todayLessons.length}
      />

      {/* 2. Today's pairs (после нее пары на сегодня) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold tracking-tight text-apple-gray-900 dark:text-white flex items-center gap-2">
            <span>Пары на сегодня</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-apple-gray-500">
              {visibleTodayLessons.length}
            </span>
          </h3>
        </div>

        <TodayLessonsList
          lessons={visibleTodayLessons}
          now={now}
          onSelectLesson={(l) => setSelectedLesson(l)}
          emptyTitle={todayLessons.length > 0 ? 'Все пары на сегодня завершены! 🎉' : 'Пар сегодня нет'}
          emptyDescription={
            todayLessons.length > 0
              ? 'Все занятия подошли к концу. Отличная работа! Можно отдохнуть или закрыть оставшиеся дедлайны по заданиям.'
              : 'Расписание на сегодня пустое. Вы можете заняться домашними заданиями или посмотреть расписание на другие дни.'
          }
        />
      </div>

      {/* 3. Tomorrow's pairs (пары на завтра) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold tracking-tight text-apple-gray-900 dark:text-white">
              Пары на завтра
            </h3>
            <span className="text-xs text-apple-gray-500 dark:text-apple-gray-400 font-medium">
              • {tomorrowDayFormatted}
            </span>
          </div>
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-apple-gray-500">
            {tomorrowLessons.length}
          </span>
        </div>

        <TodayLessonsList
          lessons={tomorrowLessons}
          onSelectLesson={(l) => setSelectedLesson(l)}
          emptyTitle="Пар завтра нет"
          emptyDescription="Расписание на завтра пустое. Отличный свободный день для отдыха или подготовки к занятиям!"
        />
      </div>

      {/* 4. Homework & Deadlines (задания и дедлайны на завтра) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold tracking-tight text-apple-gray-900 dark:text-white">
            Задания и дедлайны на завтра
          </h3>
        </div>

        <TodayHomeworkWidget
          dueTomorrowList={dueTomorrowList}
          dueTodayList={dueTodayList}
          overdueList={overdueList}
          onToggleComplete={onToggleCompleteHomework}
          onOpenCreateModal={() =>
            onOpenCreateHomework({
              dueDate: tomorrowDateStr,
            })
          }
          onViewAllHomework={() => onNavigateToTab('homework')}
          onSelectHomework={onSelectHomework}
        />
      </div>

      {/* Lesson details modal */}
      {selectedLesson && (
        <LessonModal
          lesson={selectedLesson}
          allLessons={allLessons}
          onClose={() => setSelectedLesson(null)}
          onAddHomeworkForSubject={(lesson) => {
            setSelectedLesson(null);
            const deadline = getNextLessonDeadline(lesson, allLessons);
            onOpenCreateHomework({
              subject: lesson.subject,
              dueDate: deadline.dueDate,
              dueTime: deadline.dueTime,
              lessonType: deadline.nextLesson?.typeLabel || lesson.typeLabel,
            });
          }}
        />
      )}
    </div>
  );
};
