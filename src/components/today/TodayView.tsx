import React, { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { ParsedLesson, RaspInfo } from '../../types/schedule';
import { Homework } from '../../types/homework';
import { getNextLessonDeadline } from '../../utils/scheduleParser';
import { QuickStats } from './QuickStats';
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
  activeHomeworkCount: number;
  info: RaspInfo | null;
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
  activeHomeworkCount,
  info,
  onNavigateToTab,
  onToggleCompleteHomework,
  onOpenCreateHomework,
  onSelectHomework,
}) => {
  const [selectedLesson, setSelectedLesson] = useState<ParsedLesson | null>(null);

  const groupName = info?.group?.name || '26-ИСбо-4';
  const pairsCountText =
    todayLessons.length === 1
      ? '1 пара'
      : todayLessons.length >= 2 && todayLessons.length <= 4
      ? `${todayLessons.length} пары`
      : `${todayLessons.length} пар`;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Clean Apple-style Group & Pairs pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-card select-none">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-apple-blue opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-apple-blue"></span>
          </span>
          <span className="text-base sm:text-lg font-bold tracking-tight text-apple-gray-900 dark:text-white">
            Группа {groupName}
          </span>
          <span className="text-apple-gray-300 dark:text-apple-gray-600 font-bold">•</span>
          <span className="text-sm sm:text-base font-semibold text-apple-blue">
            {pairsCountText} сегодня
          </span>
        </div>

        {/* Action shortcut to full schedule */}
        <button
          onClick={() => onNavigateToTab('schedule')}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/70 dark:bg-zinc-900/70 hover:bg-white dark:hover:bg-zinc-800 border border-black/5 dark:border-white/10 text-xs font-semibold text-apple-gray-700 dark:text-apple-gray-200 transition-all shadow-apple-sm backdrop-blur-xl"
        >
          <CalendarDays className="w-4 h-4 text-apple-blue" />
          <span>Всё расписание на неделю</span>
        </button>
      </div>

      {/* Quick Stats Grid */}
      <QuickStats
        todayLessonsCount={todayLessons.length}
        activeHomeworkCount={activeHomeworkCount}
        overdueHomeworkCount={overdueList.length}
        dueTodayHomeworkCount={dueTodayList.length}
        onNavigateToTab={onNavigateToTab}
      />

      {/* Hero: Current or Next Pair */}
      <NextPairBanner
        currentOrNext={currentOrNextLesson}
        todayLessonsCount={todayLessons.length}
      />

      {/* Two-column layout: Today's pairs & Today's tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Today's schedule (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight text-apple-gray-900 dark:text-white flex items-center gap-2">
              <span>Пары на сегодня</span>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-apple-gray-500">
                {todayLessons.length}
              </span>
            </h3>

            <button
              onClick={() => onNavigateToTab('schedule')}
              className="text-xs font-semibold text-apple-blue hover:underline"
            >
              Смотреть неделю
            </button>
          </div>

          <TodayLessonsList
            lessons={todayLessons}
            onSelectLesson={(l) => setSelectedLesson(l)}
          />
        </div>

        {/* Right Column: Homework & Deadlines (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
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
