import { MapPin, User, ChevronRight } from 'lucide-react';
import { ParsedLesson } from '../../types/schedule';
import { LessonTypeBadge } from '../ui/Badge';
import { getLessonStatus } from '../../utils/scheduleParser';

interface LessonCardProps {
  lesson: ParsedLesson;
  onClick: () => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({ lesson, onClick }) => {
  const status = getLessonStatus(lesson);
  const isCurrent = status.status === 'current';
  const isPassed = status.status === 'passed';

  return (
    <div
      onClick={onClick}
      className={`group p-4 rounded-2.5xl backdrop-blur-xl border transition-all duration-200 ease-out cursor-pointer relative overflow-hidden select-none active:scale-[0.985] hover:-translate-y-0.5 ${
        isCurrent
          ? 'bg-blue-500/10 dark:bg-blue-500/15 border-apple-blue/50 shadow-apple-card ring-2 ring-apple-blue/20'
          : isPassed
          ? 'bg-white/40 dark:bg-zinc-900/40 border-black/5 dark:border-white/5 opacity-70 hover:opacity-100 hover:shadow-apple-sm'
          : 'bg-white/80 dark:bg-zinc-900/80 border-black/5 dark:border-white/10 hover:shadow-apple-card hover:border-black/10'
      }`}
    >
      {/* Top Header: Pair number, time, and type badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue">
            {lesson.pairNumber} пара
          </span>
          <span className="text-xs font-mono font-medium text-apple-gray-600 dark:text-apple-gray-400">
            {lesson.startTime} — {lesson.endTime}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <LessonTypeBadge type={lesson.type} label={lesson.typeLabel} />
          {lesson.subgroup > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-apple-gray-600 dark:text-apple-gray-400 font-medium">
              {lesson.subgroup} п/г
            </span>
          )}
          {lesson.isReplacement && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/15 text-apple-red dark:text-rose-400 font-bold">
              Замена
            </span>
          )}
        </div>
      </div>

      {/* Subject Name */}
      <div className="mt-2.5">
        <h4 className="text-sm sm:text-base font-bold text-apple-gray-900 dark:text-white tracking-tight line-clamp-2 group-hover:text-apple-blue transition-colors">
          {lesson.subject}
        </h4>
      </div>

      {/* Location and Teacher */}
      <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs text-apple-gray-500 dark:text-apple-gray-400">
        <div className="flex items-center gap-1.5 font-medium">
          <MapPin className="w-3.5 h-3.5 text-apple-blue shrink-0" />
          <span className="truncate max-w-[170px] sm:max-w-none">
            {lesson.building}, {lesson.auditorium}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-apple-gray-400 shrink-0" />
          <span className="truncate max-w-[140px] sm:max-w-none">{lesson.teacher}</span>
          <ChevronRight className="w-3.5 h-3.5 text-apple-gray-400 group-hover:text-apple-blue group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* Active lesson glow bar */}
      {isCurrent && (
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-apple-blue rounded-r" />
      )}
    </div>
  );
};
