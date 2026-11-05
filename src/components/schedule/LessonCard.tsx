import React from 'react';
import { MapPin, User, ChevronRight } from 'lucide-react';
import { ParsedLesson } from '../../types/schedule';
import { LessonTypeBadge } from '../ui/Badge';
import { getLessonStatus, formatTeacherName } from '../../utils/scheduleParser';

interface LessonCardProps {
  lesson: ParsedLesson;
  onClick: () => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({ lesson, onClick }) => {
  const status = getLessonStatus(lesson);
  const isCurrent = status.status === 'current';
  const isPassed = status.status === 'passed';
  const useInitials = typeof document !== 'undefined' && document.documentElement.getAttribute('data-initials') === 'true';
  const teacherName = formatTeacherName(lesson.teacher, useInitials);

  const typeBorderColor =
    lesson.type === 'lecture'
      ? 'border-l-[#2B82FB]'
      : lesson.type === 'practice'
      ? 'border-l-[#10B981]'
      : lesson.type === 'lab'
      ? 'border-l-[#8B5CF6]'
      : 'border-l-[#FA8C16]';

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Пара ${lesson.pairNumber}: ${lesson.subject}, ${lesson.building}, ${lesson.auditorium}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group p-3.5 sm:p-4 rounded-xl border border-l-4 ${typeBorderColor} transition-all duration-150 ease-out cursor-pointer relative overflow-hidden select-none active:scale-[0.99] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B82FB]/50 ${
        isCurrent
          ? 'bg-blue-50/50 dark:bg-[#262626] border-zinc-300 dark:border-[#383838] shadow-sm ring-1 ring-[#2B82FB]/40'
          : isPassed
          ? 'bg-zinc-50 dark:bg-[#1E1E1E] border-zinc-200 dark:border-[#2C2C2C] opacity-60 hover:opacity-100'
          : 'bg-white dark:bg-[#242424] border-zinc-200 dark:border-[#303030] shadow-2xs hover:shadow hover:border-zinc-300 dark:hover:border-[#3C3C3C]'
      }`}
    >
      {/* Top Header: Pair number, time, and type badge */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-[#2B82FB]/10 text-[#2B82FB] whitespace-nowrap shrink-0">
            {lesson.pairNumber} пара
          </span>
          <span className="text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap shrink-0">
            {lesson.startTime}&nbsp;—&nbsp;{lesson.endTime}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
          <LessonTypeBadge type={lesson.type} label={lesson.typeLabel} />
          {lesson.isReplacement && (
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-600 dark:text-red-400 font-bold whitespace-nowrap shrink-0">
              Замена
            </span>
          )}
        </div>
      </div>

      {/* Subject Name */}
      <div className="mt-2">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight line-clamp-2 group-hover:text-[#2B82FB] transition-colors">
          {lesson.subject}
        </h4>
      </div>

      {/* Location and Teacher */}
      <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-[#2E2E2E] flex flex-col gap-1 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
          <MapPin className="w-3.5 h-3.5 text-[#2B82FB] shrink-0" />
          <span className="truncate">
            {lesson.building}, {lesson.auditorium}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5 min-w-0">
            <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">{teacherName}</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#2B82FB] group-hover:translate-x-0.5 transition-transform shrink-0" />
        </div>
      </div>
    </div>
  );
};
