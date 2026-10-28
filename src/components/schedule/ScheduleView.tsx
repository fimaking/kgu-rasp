import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutGrid,
  Calendar as CalendarIcon,
  Info,
  ArrowRight,
  Sparkles,
  Bell,
} from 'lucide-react';
import { ParsedLesson, WeekDaySchedule, RaspInfo } from '../../types/schedule';
import { WeekNavigator } from './WeekNavigator';
import { DayCard } from './DayCard';
import { LessonModal } from './LessonModal';
import { AcademicScheduleModal } from './AcademicScheduleModal';
import { getAcademicWeekByDate } from '../../data/academicCalendar';
import { Modal } from '../ui/Modal';
import { isSameDay, formatDateToIso, formatRussianDate, getMondayOfWeek } from '../../utils/dateUtils';
import { getNextLessonDeadline } from '../../utils/scheduleParser';

export type ScheduleFilterMode = 'all' | 'lecture' | 'practice' | 'lab' | 'session';

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
  onShowToast?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
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
  onShowToast: _onShowToast,
}) => {
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(() => {
    const now = new Date();
    return now.getDay() === 0 ? getMondayOfWeek(now) : now;
  });

  // Default to grid layout on both PC and mobile so the entire week schedule is immediately visible
  const [viewLayout, setViewLayout] = useState<'grid' | 'single'>('grid');
  const [showBellsModal, setShowBellsModal] = useState(false);
  const [showAcademicModal, setShowAcademicModal] = useState(false);

  const viewedAcademicWeek = useMemo(() => {
    return getAcademicWeekByDate(selectedWeekMonday);
  }, [selectedWeekMonday]);
  const [activeLessonModal, setActiveLessonModal] = useState<ParsedLesson | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);



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

  // Week schedule (excluding Sunday)
  const filteredWeekSchedule = useMemo(() => {
    return weekSchedule.filter((day) => day.dayOfWeek !== 7);
  }, [weekSchedule]);

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

  // Touch swipe support for switching days or weeks on mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStartX(e.touches[0].clientX);
      setTouchStartY(e.touches[0].clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const touchEnd = e.changedTouches[0];
    const deltaX = touchEnd.clientX - touchStartX;
    const deltaY = touchEnd.clientY - touchStartY;
    setTouchStartX(null);
    setTouchStartY(null);

    // Horizontal swipe threshold: 50px, dominating vertical scroll
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX < 0) {
        // Swiped Left -> Forward (next day or next week)
        if (viewLayout === 'single') {
          setSelectedDayDate((prev) => {
            const next = new Date(prev);
            next.setDate(prev.getDate() + 1);
            if (next.getDay() === 0) next.setDate(next.getDate() + 1); // skip Sunday
            return next;
          });
        } else {
          handleNextWeek();
        }
      } else {
        // Swiped Right -> Backward (previous day or previous week)
        if (viewLayout === 'single') {
          setSelectedDayDate((prev) => {
            const next = new Date(prev);
            next.setDate(prev.getDate() - 1);
            if (next.getDay() === 0) next.setDate(next.getDate() - 1); // skip Sunday
            return next;
          });
        } else {
          handlePrevWeek();
        }
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Week Navigator Bar */}
      <WeekNavigator
        selectedWeekMonday={selectedWeekMonday}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onGoToToday={handleGoToToday}
        selectedDayDate={selectedDayDate}
        onOpenAcademicSchedule={() => setShowAcademicModal(true)}
        academicWeekNumber={viewedAcademicWeek?.weekNumber}
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

      {/* Schedule Display with touch swipe support */}
      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className="touch-pan-y">
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
          <div className="max-w-2xl mx-auto space-y-4">
            <DayCard
              daySchedule={singleDaySchedule}
              onSelectLesson={(l) => setActiveLessonModal(l)}
            />
            {singleDaySchedule.lessons.length === 0 && (
              <div className="p-4 rounded-3xl bg-white/70 dark:bg-zinc-900/70 border border-black/5 dark:border-white/10 backdrop-blur-xl shadow-apple-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left animate-in fade-in">
                <div>
                  <p className="text-xs font-semibold text-apple-gray-900 dark:text-white">
                    В этот день учебных занятий нет
                  </p>
                  <p className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400">
                    Перейдите к началу недели или смахните влево для следующего дня
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const mon = getMondayOfWeek(now);
                    setSelectedDayDate(mon);
                    if (onGoToDate) onGoToDate(mon);
                  }}
                  className="px-3.5 py-1.5 rounded-2xl bg-apple-blue text-white text-xs font-semibold hover:bg-apple-blue/90 transition-all active:scale-95 shadow-apple-sm flex items-center gap-1.5 shrink-0"
                >
                  <span>К началу недели</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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

      {/* Academic Schedule Modal */}
      {showAcademicModal && (
        <AcademicScheduleModal
          isOpen={showAcademicModal}
          onClose={() => setShowAcademicModal(false)}
          currentSelectedMonday={selectedWeekMonday}
          onSelectWeek={(_weekNumber, monday) => {
            if (onGoToDate) {
              onGoToDate(monday);
            }
            setSelectedDayDate(monday);
          }}
        />
      )}
    </div>
  );
};
