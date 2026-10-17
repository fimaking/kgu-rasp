import React, { useState } from 'react';
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
  activeHomeworkCount,
  onNavigateToTab,
  onToggleCompleteHomework,
  onOpenCreateHomework,
  onSelectHomework,
}) => {
  const [selectedLesson, setSelectedLesson] = useState<ParsedLesson | null>(null);

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

      {/* 3. Quick Stats Grid (4 плашки: перенесены вниз перед заданиями и дедлайнами) */}
      <QuickStats
        todayLessonsCount={todayLessons.length}
        activeHomeworkCount={activeHomeworkCount}
        overdueHomeworkCount={overdueList.length}
        dueTodayHomeworkCount={dueTodayList.length}
        onNavigateToTab={onNavigateToTab}
      />

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
