import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  LayoutGrid,
  Calendar as CalendarIcon,
  BookOpen,
} from 'lucide-react';
import { ParsedLesson, WeekDaySchedule, RaspInfo } from '../../types/schedule';
import { WeekNavigator } from './WeekNavigator';
import { DayCard } from './DayCard';
import { LessonModal } from './LessonModal';
import { isSameDay, formatDateToIso } from '../../utils/dateUtils';
import { getNextLessonDeadline } from '../../utils/scheduleParser';

interface ScheduleViewProps {
  weekSchedule: WeekDaySchedule[];
  allLessons: ParsedLesson[];
  info: RaspInfo | null;
  selectedWeekMonday: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onGoToToday: () => void;
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
  onOpenCreateHomeworkForSubject,
}) => {
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(() => new Date());
  // Default to single day view so Today's schedule opens immediately
  const [viewLayout, setViewLayout] = useState<'grid' | 'single'>('single');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLessonModal, setActiveLessonModal] = useState<ParsedLesson | null>(null);

  const handleGoToToday = () => {
    onGoToToday();
    setSelectedDayDate(new Date());
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
      setTimeout(() => {
        const el = document.getElementById('day-card-today');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner: University Group & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-apple-blue font-mono">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Костромской государственный университет</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-apple-gray-900 dark:text-white mt-0.5">
            Расписание группы {info?.group?.name || '26-ИСбо-4'}
          </h2>
          <p className="text-xs sm:text-sm text-apple-gray-500 dark:text-apple-gray-400">
            {info?.year || '2026-2027'} учебный год • 1 семестр
          </p>
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
              className={`p-1.5 rounded-xl transition-all ${
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
              className={`p-1.5 rounded-xl transition-all ${
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
          setViewLayout('single');
        }}
        days={daysSummary}
        info={info}
      />

      {/* Schedule Display */}
      {viewLayout === 'grid' ? (
        /* Full week grid: 6 days (Mon-Sat, plus Sun if it has pairs) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredWeekSchedule
            .filter((d) => d.dayOfWeek !== 7 || d.lessons.length > 0)
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
