import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  LayoutGrid,
  Calendar as CalendarIcon,
  BookOpen,
  Info,
  ArrowRight,
  Sparkles,
  Bell,
  GraduationCap,
  Clock,
} from 'lucide-react';
import { ParsedLesson, WeekDaySchedule, RaspInfo } from '../../types/schedule';
import { WeekNavigator } from './WeekNavigator';
import { DayCard } from './DayCard';
import { LessonModal } from './LessonModal';
import { Modal } from '../ui/Modal';
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

export const KSU_BELL_TIMES = [
  { pair: 1, start: '08:30', end: '10:00', breakAfter: '10 мин перемена (до 10:10)' },
  { pair: 2, start: '10:10', end: '11:40', breakAfter: '10 мин перемена (до 11:50)' },
  { pair: 3, start: '11:50', end: '13:20', breakAfter: '40 мин — Большой перерыв (до 14:00)' },
  { pair: 4, start: '14:00', end: '15:30', breakAfter: '10 мин перемена (до 15:40)' },
  { pair: 5, start: '15:40', end: '17:10', breakAfter: 'Окончание учебных занятий' },
];

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
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(() => {
    const now = new Date();
    return now.getDay() === 0 ? getMondayOfWeek(now) : now;
  });

  // Default to grid layout on both PC and mobile so the entire week schedule is immediately visible
  const [viewLayout, setViewLayout] = useState<'grid' | 'single'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'session'>('all');
  const [showBellsModal, setShowBellsModal] = useState(false);
  const [activeLessonModal, setActiveLessonModal] = useState<ParsedLesson | null>(null);

  // Active pair or break countdown info (Sunday is excluded)
  const currentBreakOrPairInfo = useMemo(() => {
    const now = new Date();
    // В воскресенье учебных занятий нет — не учитываем
    if (now.getDay() === 0) return null;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // 1. Check if a pair is currently ongoing
    for (const b of KSU_BELL_TIMES) {
      const [sh, sm] = b.start.split(':').map(Number);
      const [eh, em] = b.end.split(':').map(Number);
      const startMins = sh * 60 + sm;
      const endMins = eh * 60 + em;

      if (currentMinutes >= startMins && currentMinutes < endMins) {
        const left = endMins - currentMinutes;
        return {
          type: 'pair' as const,
          pair: b.pair,
          text: `Идёт ${b.pair}-я пара: осталось ${left} мин (до ${b.end})`,
        };
      }
    }

    // 2. Check breaks between pairs
    for (let i = 0; i < KSU_BELL_TIMES.length - 1; i++) {
      const currentPair = KSU_BELL_TIMES[i];
      const nextPair = KSU_BELL_TIMES[i + 1];
      const [ceh, cem] = currentPair.end.split(':').map(Number);
      const [nsh, nsm] = nextPair.start.split(':').map(Number);
      const breakStartMins = ceh * 60 + cem;
      const breakEndMins = nsh * 60 + nsm;

      if (currentMinutes >= breakStartMins && currentMinutes < breakEndMins) {
        const left = breakEndMins - currentMinutes;
        const isBigBreak = currentPair.pair === 3;
        return {
          type: 'break' as const,
          pair: nextPair.pair,
          text: isBigBreak
            ? `Большой перерыв (обед)! До ${nextPair.pair}-й пары: ${left} мин (начало в ${nextPair.start})`
            : `Перемена: до ${nextPair.pair}-й пары ${left} мин (начало в ${nextPair.start})`,
        };
      }
    }

    // 3. Before 1st pair in the morning (from 07:30 to 08:30)
    const [p1H, p1M] = KSU_BELL_TIMES[0].start.split(':').map(Number);
    const p1StartMins = p1H * 60 + p1M;
    if (currentMinutes >= p1StartMins - 60 && currentMinutes < p1StartMins) {
      const left = p1StartMins - currentMinutes;
      return {
        type: 'break' as const,
        pair: 1,
        text: `Скоро 1-я пара: осталось ${left} мин (начало в 08:30)`,
      };
    }

    return null;
  }, []);

  // When opening schedule view, ensure today's week is active and select current day (or Monday if Sunday)
  useEffect(() => {
    const now = new Date();
    const currentMon = getMondayOfWeek(now);
    if (!isSameDay(selectedWeekMonday, currentMon)) {
      onGoToToday();
    }
    // Воскресенье не учитываем — если сегодня воскресенье, выбираем понедельник
    if (now.getDay() === 0) {
      setSelectedDayDate(currentMon);
    } else {
      setSelectedDayDate(now);
    }
  }, []);

  const handleGoToToday = () => {
    onGoToToday();
    const now = new Date();
    if (now.getDay() === 0) {
      setSelectedDayDate(getMondayOfWeek(now));
    } else {
      setSelectedDayDate(now);
    }
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

  // Day buttons data for WeekNavigator (excluding Sunday)
  const daysSummary = useMemo(() => {
    return weekSchedule
      .filter((d) => d.dayOfWeek !== 7)
      .map((d) => ({
        date: d.date,
        shortDayName: d.shortDayName,
        isToday: d.isToday,
        count: d.lessons.length,
      }));
  }, [weekSchedule]);

  // Search & session filtering (excluding Sunday)
  const filteredWeekSchedule = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return weekSchedule
      .filter((day) => day.dayOfWeek !== 7)
      .map((day) => ({
        ...day,
        lessons: day.lessons.filter((l) => {
        // Mode filter: all pairs or exams & credits only
        if (filterMode === 'session') {
          const isSession =
            l.type === 'exam' ||
            l.type === 'credit' ||
            l.rawDiscipline?.toLowerCase().includes('конс') ||
            l.rawDiscipline?.toLowerCase().includes('аттест');
          if (!isSession) return false;
        }

        // Search query
        if (!q) return true;
        return (
          l.subject.toLowerCase().includes(q) ||
          l.teacher.toLowerCase().includes(q) ||
          l.auditorium.toLowerCase().includes(q) ||
          l.rawDiscipline.toLowerCase().includes(q)
        );
      }),
    }));
  }, [weekSchedule, searchQuery, filterMode]);

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
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-sm">
            <BookOpen className="w-3.5 h-3.5 text-apple-blue shrink-0" />
            <span className="text-xs sm:text-sm font-semibold tracking-tight text-apple-gray-800 dark:text-zinc-200">
              {info?.year || '2026-2027'} учебный год • {info?.curSem ? `${info.curSem} семестр` : '1 семестр'}
            </span>
          </div>

          {/* Bell schedule button */}
          <button
            type="button"
            onClick={() => setShowBellsModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/70 dark:bg-zinc-900/70 hover:bg-white dark:hover:bg-zinc-800 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-sm text-xs font-semibold text-apple-gray-800 dark:text-zinc-200 transition-all active:scale-95"
            title="Посмотреть расписание звонков КГУ"
          >
            <Bell className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Звонки КГУ</span>
          </button>
        </div>

        {/* View Mode Toggle, Session filter & Search */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Filter: All vs Exams/Session */}
          <div className="flex items-center p-1 bg-black/5 dark:bg-white/10 rounded-2xl border border-black/5 dark:border-white/5 text-xs font-medium">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-xl transition-all duration-200 ease-out active:scale-95 ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-apple-blue shadow-apple-sm font-semibold'
                  : 'text-apple-gray-500 hover:text-apple-gray-900 dark:hover:text-white'
              }`}
            >
              Все пары
            </button>
            <button
              onClick={() => setFilterMode('session')}
              className={`px-2.5 py-1 rounded-xl transition-all duration-200 ease-out active:scale-95 inline-flex items-center gap-1 ${
                filterMode === 'session'
                  ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-apple-sm font-semibold'
                  : 'text-apple-gray-500 hover:text-apple-gray-900 dark:hover:text-white'
              }`}
              title="Только экзамены, зачёты и консультации"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Сессия</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-apple-gray-400" />
            <input
              type="text"
              placeholder="Поиск по предмету, преподавателю..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-56 pl-9 pr-3 py-1.5 rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-black/5 dark:border-white/10 text-xs text-apple-gray-900 dark:text-white placeholder:text-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all shadow-apple-sm"
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

      {/* Break / Pair Realtime Countdown Banner */}
      {currentBreakOrPairInfo && (
        <div className="p-3.5 rounded-2.5xl bg-apple-blue/[0.07] dark:bg-apple-blue/[0.12] border border-apple-blue/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs animate-in fade-in duration-200 shadow-apple-sm">
          <div className="flex items-center gap-2.5 font-semibold text-apple-gray-900 dark:text-white">
            <span className="w-2 h-2 rounded-full bg-apple-blue animate-pulse shrink-0" />
            <span>{currentBreakOrPairInfo.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowBellsModal(true)}
            className="text-apple-blue hover:underline font-bold inline-flex items-center gap-1 shrink-0"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Расписание звонков</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
        /* Full week grid: 6 study days (Mon-Sat, Sunday excluded) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredWeekSchedule.map((day) => (
            <DayCard
              key={day.dateStr}
              daySchedule={day}
              isSelected={isSameDay(day.date, selectedDayDate)}
              onSelectDay={() => setSelectedDayDate(day.date)}
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

      {/* KSU Bell Times Modal */}
      {showBellsModal && (
        <Modal isOpen={showBellsModal} onClose={() => setShowBellsModal(false)} maxWidth="md">
          <div className="space-y-4 select-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-apple-gray-900 dark:text-white">
                  Расписание звонков КГУ
                </h3>
                <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">
                  Официальное время начала и окончания учебных занятий
                </p>
              </div>
            </div>

            <div className="divide-y divide-black/5 dark:divide-white/5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 overflow-hidden text-xs">
              {KSU_BELL_TIMES.map((b) => (
                <div
                  key={b.pair}
                  className="p-3 flex items-center justify-between gap-2 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-apple-blue/10 text-apple-blue font-bold font-mono flex items-center justify-center shrink-0">
                      {b.pair}
                    </span>
                    <span className="font-mono font-bold text-apple-gray-900 dark:text-white text-sm">
                      {b.start} — {b.end}
                    </span>
                  </div>
                  <span className={`text-[11px] font-medium text-right ${b.pair === 3 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-apple-gray-500 dark:text-apple-gray-400'}`}>
                    {b.breakAfter}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300">
              💡 <b>Большой перерыв (40 мин):</b> после 3-й пары с 13:20 до 14:00 (обед). Обычные перемены — по 10 минут. В воскресенье занятий нет.
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowBellsModal(false)}
                className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-semibold text-apple-gray-800 dark:text-zinc-200 transition-colors"
              >
                Понятно
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
