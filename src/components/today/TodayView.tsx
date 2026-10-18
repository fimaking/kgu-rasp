import React, { useState, useMemo } from 'react';
import { ParsedLesson, RaspInfo } from '../../types/schedule';
import { Homework } from '../../types/homework';
import { getNextLessonDeadline } from '../../utils/scheduleParser';
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
  dueTodayList: Homework[];
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
  dueTodayList,
  overdueList,
  onNavigateToTab,
  onToggleCompleteHomework,
  onOpenCreateHomework,
  onSelectHomework,
}) => {
  const [selectedLesson, setSelectedLesson] = useState<ParsedLesson | null>(null);

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
              {todayLessons.length}
            </span>
          </h3>
        </div>

        <TodayLessonsList
          lessons={todayLessons}
          onSelectLesson={(l) => setSelectedLesson(l)}
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

      {/* 4. Homework & Deadlines (задания и дедлайны) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold tracking-tight text-apple-gray-900 dark:text-white">
            Задания и дедлайны
          </h3>
        </div>

        <TodayHomeworkWidget
          dueTodayList={dueTodayList}
          overdueList={overdueList}
          onToggleComplete={onToggleCompleteHomework}
          onOpenCreateModal={onOpenCreateHomework}
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
