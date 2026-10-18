import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  LayoutGrid,
  Calendar as CalendarIcon,
  BookOpen,
  Info,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ParsedLesson, WeekDaySchedule, RaspInfo } from '../../types/schedule';
import { WeekNavigator } from './WeekNavigator';
import { DayCard } from './DayCard';
import { LessonModal } from './LessonModal';
import { isSameDay, formatDateToIso, formatRussianDate, getMondayOfWeek } from '../../utils/dateUtils';
import { getNextLessonDeadline } from '../../utils/scheduleParser';

interface ScheduleViewProps {
  weekSchedule: WeekDaySchedule[];
  allLessons: ParsedLesson[];
  info: RaspInfo | null;
  selectedWeekMonday: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onGoToToday: () => void;
  onGoToDate?: (date: Date) => void;
  subgroupFilter: number;
  onSubgroupChange: (sg: number) => void;
  onOpenCreateHomeworkForSubject: (options: {
    subject: string;
    dueDate?: string;
    dueTime?: string;
    lessonType?: string;
  }) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  weekSchedule,
  allLessons,
  info,
  selectedWeekMonday,
  onPrevWeek,
  onNextWeek,
  onGoToToday,
  onGoToDate,
  onOpenCreateHomeworkForSubject,
}) => {
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(() => new Date());

  // Default to grid layout on both PC and mobile so the entire week schedule is immediately visible
  const [viewLayout, setViewLayout] = useState<'grid' | 'single'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLessonModal, setActiveLessonModal] = useState<ParsedLesson | null>(null);

  // When opening schedule view, ensure today's week is active and today is selected
  useEffect(() => {
    const now = new Date();
    const currentMon = getMondayOfWeek(now);
    if (!isSameDay(selectedWeekMonday, currentMon)) {
      onGoToToday();
    }
    setSelectedDayDate(now);
  }, []);

  const handleGoToToday = () => {
    onGoToToday();
    const now = new Date();
    setSelectedDayDate(now);
    if (viewLayout === 'grid') {
      setTimeout(() => {
        const todayEl = document.getElementById('day-card-today');
        if (todayEl) {
          todayEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    }
  };

  const handlePrevWeek = () => {
    onPrevWeek();
    setSelectedDayDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    onNextWeek();
    setSelectedDayDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 7);
      return next;
    });
  };

  // Scroll to today's card when opening grid layout
  useEffect(() => {
    if (viewLayout === 'grid') {
      const timer = setTimeout(() => {
        const el = document.getElementById('day-card-today');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [viewLayout]);

  // Day buttons data for WeekNavigator
  const daysSummary = useMemo(() => {
    return weekSchedule.map((d) => ({
      date: d.date,
      shortDayName: d.shortDayName,
      isToday: d.isToday,
      count: d.lessons.length,
    }));
  }, [weekSchedule]);

  // Search filtering
  const filteredWeekSchedule = useMemo(() => {
    if (!searchQuery.trim()) return weekSchedule;
    const q = searchQuery.toLowerCase().trim();

    return weekSchedule.map((day) => ({
      ...day,
      lessons: day.lessons.filter(
        (l) =>
          l.subject.toLowerCase().includes(q) ||
          l.teacher.toLowerCase().includes(q) ||
          l.auditorium.toLowerCase().includes(q) ||
          l.rawDiscipline.toLowerCase().includes(q)
      ),
    }));
  }, [weekSchedule, searchQuery]);

  // Selected single day
  const singleDaySchedule = useMemo(() => {
    const found = filteredWeekSchedule.find((d) => isSameDay(d.date, selectedDayDate));
    return (
      found || {
        date: selectedDayDate,
        dateStr: formatDateToIso(selectedDayDate),
        dayOfWeek: selectedDayDate.getDay() || 7,
        dayName: 'Выбранный день',
        shortDayName: 'День',
        isToday: isSameDay(selectedDayDate, new Date()),
        isPast: false,
        lessons: [],
      }
    );
  }, [filteredWeekSchedule, selectedDayDate]);
  // Total lessons scheduled for this week
  const totalWeekLessons = useMemo(() => {
    return weekSchedule.reduce((acc, d) => acc + d.lessons.length, 0);
  }, [weekSchedule]);

  // Nearest upcoming lesson in the group's semester schedule
  const nearestLesson = useMemo(() => {
    if (allLessons.length === 0) return null;
    const todayStr = formatDateToIso(new Date());
    const future = allLessons.filter((l) => l.dateStr >= todayStr);
    return future.length > 0 ? future[0] : allLessons[allLessons.length - 1];
  }, [allLessons]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner: Semester Badge & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-sm">
            <BookOpen className="w-3.5 h-3.5 text-apple-blue shrink-0" />
            <span className="text-xs sm:text-sm font-semibold tracking-tight text-apple-gray-800 dark:text-zinc-200">
              {info?.year || '2026-2027'} учебный год • {info?.curSem ? `${info.curSem} семестр` : '1 семестр'}
            </span>
          </div>
        </div>

        {/* View Mode Toggle & Search */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Input */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-apple-gray-400" />
            <input
              type="text"
              placeholder="Поиск по предмету, преподавателю..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-3 py-2 rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-black/5 dark:border-white/10 text-xs sm:text-sm text-apple-gray-900 dark:text-white placeholder:text-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all shadow-apple-sm"
            />
          </div>

          {/* Grid vs Single Day View Buttons */}
          <div className="flex items-center p-1 bg-black/5 dark:bg-white/10 rounded-2xl border border-black/5 dark:border-white/5">
            <button
              onClick={() => setViewLayout('grid')}
              className={`p-1.5 rounded-xl transition-all duration-200 ease-out active:scale-90 ${
                viewLayout === 'grid'
                  ? 'bg-white dark:bg-zinc-800 text-apple-blue shadow-apple-sm font-semibold'
                  : 'text-apple-gray-500 hover:text-apple-gray-900 dark:hover:text-white'
              }`}
              title="Вся неделя (Сетка)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewLayout('single')}
              className={`p-1.5 rounded-xl transition-all duration-200 ease-out active:scale-90 ${
                viewLayout === 'single'
                  ? 'bg-white dark:bg-zinc-800 text-apple-blue shadow-apple-sm font-semibold'
                  : 'text-apple-gray-500 hover:text-apple-gray-900 dark:hover:text-white'
              }`}
              title="Один день"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Week Navigator Bar */}
      <WeekNavigator
        selectedWeekMonday={selectedWeekMonday}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onGoToToday={handleGoToToday}
        selectedDayDate={selectedDayDate}
        onSelectDay={(d) => {
          setSelectedDayDate(d);
          if (viewLayout === 'grid') {
            const dateStr = formatDateToIso(d);
            const isCurrentDay = isSameDay(d, new Date());
            const el = isCurrentDay
              ? document.getElementById('day-card-today')
              : document.getElementById(`day-card-${dateStr}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }}
        days={daysSummary}
        info={info}
      />

      {/* Empty State: If the group has 0 lessons total in the semester */}
      {allLessons.length === 0 && (
        <div className="p-8 sm:p-12 rounded-3xl bg-white/70 dark:bg-zinc-900/70 border border-black/5 dark:border-white/10 text-center space-y-3 shadow-apple-card">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-apple-gray-900 dark:text-white">
            У группы {info?.group?.name || ''} нет занятий в расписании КГУ
          </h3>
          <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400 max-w-md mx-auto">
            На официальном сайте КГУ для этой группы пока не внесены пары (учебная практика, сессия или каникулы).
          </p>
        </div>
      )}

      {/* Guide Banner: If group has lessons, but current week is empty */}
      {allLessons.length > 0 && totalWeekLessons === 0 && nearestLesson && (
        <div className="p-4 rounded-2.5xl bg-apple-blue/10 dark:bg-apple-blue/15 border border-apple-blue/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-apple-gray-900 dark:text-white animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-apple-blue shrink-0" />
            <span>
              На выбранной неделе занятий нет. Ближайшие пары в расписании:{' '}
              <span className="font-bold text-apple-blue">
                {nearestLesson.dayName}, {formatRussianDate(nearestLesson.startDateTime)}
              </span>.
            </span>
          </div>
          {onGoToDate && (
            <button
              onClick={() => {
                onGoToDate(nearestLesson.startDateTime);
                setSelectedDayDate(nearestLesson.startDateTime);
              }}
              className="inline-flex items-center gap-1 font-bold text-apple-blue hover:underline shrink-0"
            >
              <span>Перейти к занятиям</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Schedule Display */}
      {viewLayout === 'grid' ? (
        /* Full week grid: 6 days (Mon-Sat, plus Sun if it has pairs) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredWeekSchedule
            .filter((d) => d.dayOfWeek !== 7 || d.lessons.length > 0 || d.isToday)
            .map((day) => (
              <DayCard
                key={day.dateStr}
                daySchedule={day}
                onSelectLesson={(l) => setActiveLessonModal(l)}
              />
            ))}
        </div>
      ) : (
        /* Single focused day view */
        <div className="max-w-2xl mx-auto">
          <DayCard
            daySchedule={singleDaySchedule}
            onSelectLesson={(l) => setActiveLessonModal(l)}
          />
        </div>
      )}

      {/* Lesson Details Modal */}
      {activeLessonModal && (
        <LessonModal
          lesson={activeLessonModal}
          allLessons={allLessons}
          onClose={() => setActiveLessonModal(null)}
          onAddHomeworkForSubject={(lesson) => {
            setActiveLessonModal(null);
            const deadline = getNextLessonDeadline(lesson, allLessons);
            onOpenCreateHomeworkForSubject({
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
