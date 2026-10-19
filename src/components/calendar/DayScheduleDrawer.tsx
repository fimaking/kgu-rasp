import React from 'react';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { DayEventsSummary } from '../../types/calendar';
import { ParsedLesson } from '../../types/schedule';
import { Homework } from '../../types/homework';
import { LessonTypeBadge, PriorityBadge } from '../ui/Badge';
import { formatRussianDate, formatDayOfWeek, parseIsoDate } from '../../utils/dateUtils';

interface DayScheduleDrawerProps {
  summary: DayEventsSummary;
  onSelectLesson: (lesson: ParsedLesson) => void;
  onSelectHomework: (hw: Homework) => void;
  onOpenAddEvent: () => void;
  onDeleteEvent: (id: string) => void;
}

export const DayScheduleDrawer: React.FC<DayScheduleDrawerProps> = ({
  summary,
  onSelectLesson,
  onSelectHomework,
  onOpenAddEvent,
  onDeleteEvent,
}) => {
  const dateObj = parseIsoDate(summary.dateStr);
  const formattedTitle = `${formatDayOfWeek(dateObj)}, ${formatRussianDate(dateObj, true)}`;

  const totalItems =
    summary.lessons.length + summary.homeworks.length + summary.customEvents.length;

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-card space-y-5 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
        <div>
          <h3 className="text-lg font-bold text-apple-gray-900 dark:text-white">
            {formattedTitle}
          </h3>
          <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400 mt-0.5">
            {summary.lessons.length} пар • {summary.homeworks.length} дедлайнов • {summary.customEvents.length} событий
          </p>
        </div>

        <button
          onClick={onOpenAddEvent}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-apple-blue/10 dark:bg-apple-blue/20 hover:bg-apple-blue/20 text-apple-blue text-xs font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Событие</span>
        </button>
      </div>

      {totalItems === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm font-medium text-apple-gray-500 dark:text-apple-gray-400">
            На этот день нет занятий, дедлайнов и событий
          </p>
          <p className="text-xs text-apple-gray-400 mt-1">
            Отличный повод отдохнуть или запланировать подготовку
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Custom Events / Tests / Exams */}
          {summary.customEvents.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500 font-mono flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Контрольные и экзамены ({summary.customEvents.length})</span>
              </h4>

              <div className="space-y-2">
                {summary.customEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-rose-500 text-white">
                          {ev.type === 'test'
                            ? 'Контрольная'
                            : ev.type === 'exam'
                            ? 'Экзамен'
                            : ev.type === 'colloquium'
                            ? 'Коллоквиум'
                            : 'Событие'}
                        </span>
                        {ev.time && (
                          <span className="text-xs font-mono font-semibold text-rose-700 dark:text-rose-300">
                            в {ev.time}
                          </span>
                        )}
                        {ev.room && (
                          <span className="text-xs text-rose-600 dark:text-rose-300">
                            • ауд. {ev.room}
                          </span>
                        )}
                      </div>
                      <h5 className="text-sm font-bold text-apple-gray-900 dark:text-white mt-1">
                        {ev.title}
                      </h5>
                      {ev.subject && (
                        <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400 mt-0.5">
                          {ev.subject}
                        </p>
                      )}
                      {ev.notes && (
                        <p className="text-xs text-apple-gray-600 dark:text-apple-gray-300 mt-1 italic">
                          {ev.notes}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => onDeleteEvent(ev.id)}
                      className="p-1 text-apple-gray-400 hover:text-apple-red transition-colors"
                      title="Удалить событие"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Schedule Lessons */}
          {summary.lessons.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-apple-blue font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Занятия в расписании ({summary.lessons.length})</span>
              </h4>

              <div className="space-y-2">
                {summary.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    onClick={() => onSelectLesson(lesson)}
                    className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-all cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-xl bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue text-xs font-bold font-mono flex items-center justify-center shrink-0">
                        {lesson.pairNumber}п
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-semibold text-apple-gray-600 dark:text-apple-gray-400 whitespace-nowrap shrink-0">
                            {lesson.startTime}&nbsp;—&nbsp;{lesson.endTime}
                          </span>
                          <LessonTypeBadge type={lesson.type} label={lesson.typeLabel} />
                          {lesson.subgroup > 0 && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-apple-gray-500 font-medium whitespace-nowrap shrink-0">
                              {lesson.subgroup}&nbsp;п/г
                            </span>
                          )}
                        </div>
                        <h5 className="text-sm font-bold text-apple-gray-900 dark:text-white truncate mt-0.5">
                          {lesson.subject}
                        </h5>
                        <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400 truncate">
                          {lesson.building}, {lesson.auditorium} • {lesson.teacher}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Homework Deadlines */}
          {summary.homeworks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 font-mono flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Сроки сдачи заданий ({summary.homeworks.length})</span>
              </h4>

              <div className="space-y-2">
                {summary.homeworks.map((hw) => (
                  <div
                    key={hw.id}
                    onClick={() => onSelectHomework(hw)}
                    className="p-3.5 rounded-2xl bg-amber-500/[0.05] dark:bg-amber-500/[0.1] border border-amber-500/20 hover:bg-amber-500/15 transition-all cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-apple-orange">
                          до {hw.dueTime}
                        </span>
                        <PriorityBadge priority={hw.priority} />
                        <span className="text-xs text-apple-gray-500 truncate">
                          {hw.subject}
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-apple-gray-900 dark:text-white truncate mt-0.5">
                        {hw.title}
                      </h5>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
