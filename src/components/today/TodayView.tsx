import React, { useState } from 'react';
import { Sparkles, CalendarDays } from 'lucide-react';
import { ParsedLesson, RaspInfo } from '../../types/schedule';
import { Homework } from '../../types/homework';
import { getGreeting, formatRussianDate, formatDayOfWeek } from '../../utils/dateUtils';
import { QuickStats } from './QuickStats';
import { NextPairBanner } from './NextPairBanner';
import { TodayLessonsList } from './TodayLessonsList';
import { TodayHomeworkWidget } from './TodayHomeworkWidget';
import { LessonModal } from '../schedule/LessonModal';

interface TodayViewProps {
  todayLessons: ParsedLesson[];
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
  onOpenCreateHomework: () => void;
  onSelectHomework: (hw: Homework) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  todayLessons,
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

  const now = new Date();
  const greeting = getGreeting(now);
  const dateFormatted = `${formatDayOfWeek(now)}, ${formatRussianDate(now, true)}`;

  const weekTypeStr =
    info?.curNumNed === 1
      ? '1-я неделя (Числитель)'
      : info?.curNumNed === 2
      ? '2-я неделя (Знаменатель)'
      : 'Учебная неделя';

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-apple-blue font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{dateFormatted}</span>
            <span>•</span>
            <span>{weekTypeStr}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-apple-gray-900 dark:text-white mt-1">
            {greeting}, студент! 👋
          </h2>
          <p className="text-xs sm:text-sm text-apple-gray-500 dark:text-apple-gray-400 mt-0.5">
            Группа {info?.group?.name || '26-ИСбо-4'} • {todayLessons.length}{' '}
            {todayLessons.length === 1 ? 'пара' : todayLessons.length >= 2 && todayLessons.length <= 4 ? 'пары' : 'пар'} сегодня
          </p>
        </div>

        {/* Action shortcut to full schedule */}
        <button
          onClick={() => onNavigateToTab('schedule')}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-semibold text-apple-gray-700 dark:text-apple-gray-200 transition-colors"
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
          onClose={() => setSelectedLesson(null)}
          onAddHomeworkForSubject={() => {
            setSelectedLesson(null);
            onOpenCreateHomework();
          }}
        />
      )}
    </div>
  );
};
