import React from 'react';
import {
  Clock,
  MapPin,
  User,
  PlusCircle,
  AlertCircle,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { ParsedLesson } from '../../types/schedule';
import { Modal } from '../ui/Modal';
import { LessonTypeBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatRussianDate, formatDayOfWeek } from '../../utils/dateUtils';
import { getLessonStatus } from '../../utils/scheduleParser';

interface LessonModalProps {
  lesson: ParsedLesson | null;
  onClose: () => void;
  onAddHomeworkForSubject: (subject: string) => void;
}

export const LessonModal: React.FC<LessonModalProps> = ({
  lesson,
  onClose,
  onAddHomeworkForSubject,
}) => {
  if (!lesson) return null;

  const status = getLessonStatus(lesson);

  return (
    <Modal isOpen={Boolean(lesson)} onClose={onClose} maxWidth="md">
      <div className="space-y-5 select-none">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue">
              {lesson.pairNumber}-я пара
            </span>
            <LessonTypeBadge type={lesson.type} label={lesson.typeLabel} />
            {lesson.subgroup > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-apple-gray-600 dark:text-apple-gray-300 font-medium">
                {lesson.subgroup}-я подгруппа
              </span>
            )}
          </div>

          <div
            className={`text-xs px-3 py-1 rounded-full font-medium ${
              status.status === 'current'
                ? 'bg-apple-blue text-white animate-pulse'
                : status.status === 'passed'
                ? 'bg-black/5 dark:bg-white/10 text-apple-gray-400'
                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {status.badgeText}
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-apple-gray-900 dark:text-white">
            {lesson.subject}
          </h3>
          <p className="mt-1 text-xs text-apple-gray-500 dark:text-apple-gray-400 font-mono">
            {lesson.rawDiscipline}
          </p>
        </div>

        {/* Replacements alert if marked as zamena */}
        {lesson.isReplacement && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-xs text-apple-red font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Внимание: в данном занятии произошла замена в расписании КГУ.</span>
          </div>
        )}

        {/* Key Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 text-sm">
          {/* Time & Date */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-apple-gray-400 font-medium">Время и дата</p>
              <p className="font-semibold text-apple-gray-900 dark:text-white font-mono">
                {lesson.startTime} — {lesson.endTime}
              </p>
              <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">
                {formatDayOfWeek(lesson.startDateTime)}, {formatRussianDate(lesson.startDateTime)}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-apple-gray-400 font-medium">Место проведения</p>
              <p className="font-semibold text-apple-gray-900 dark:text-white">
                {lesson.building}
              </p>
              <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">
                {lesson.auditorium}
              </p>
            </div>
          </div>

          {/* Teacher */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-apple-gray-400 font-medium">Преподаватель</p>
              <p className="font-semibold text-apple-gray-900 dark:text-white">
                {lesson.teacher}
              </p>
            </div>
          </div>

          {/* Subgroup */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-apple-gray-400 font-medium">Аудитория группы</p>
              <p className="font-semibold text-apple-gray-900 dark:text-white">
                {lesson.subgroup === 0 ? 'Вся группа' : `${lesson.subgroup}-я подгруппа`}
              </p>
            </div>
          </div>
        </div>

        {/* Link / Webinar if available */}
        {lesson.link && (
          <a
            href={lesson.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-apple-blue font-semibold hover:underline"
          >
            <span>Перейти к материалам занятия / вебинару</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-between gap-3">
          <Button variant="ghost" size="md" onClick={onClose}>
            Закрыть
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={() => {
              onAddHomeworkForSubject(lesson.subject);
            }}
          >
            Добавить ДЗ по предмету
          </Button>
        </div>
      </div>
    </Modal>
  );
};
