import React from 'react';
import {
  Clock,
  Check,
  ExternalLink,
  Edit2,
  Trash2,
  FileText,
  ListTodo,
} from 'lucide-react';
import { Homework } from '../../types/homework';
import { PriorityBadge, StatusBadge } from '../ui/Badge';
import { formatRelativeDeadline } from '../../utils/dateUtils';
import { sanitizeUrl } from '../../services/storageService';

interface HomeworkCardProps {
  homework: Homework;
  onToggleComplete: (id: string) => void;
  onToggleSubtask: (hwId: string, subId: string) => void;
  onEdit: (hw: Homework) => void;
  onDelete: (id: string) => void;
}

export const HomeworkCard: React.FC<HomeworkCardProps> = ({
  homework,
  onToggleComplete,
  onToggleSubtask,
  onEdit,
  onDelete,
}) => {
  const isCompleted = homework.status === 'completed';
  const deadlineInfo = formatRelativeDeadline(homework.dueDate, homework.dueTime || '23:59');
  const safeMaterialLink = sanitizeUrl(homework.materialLink);

  const subtasksList = Array.isArray(homework.subtasks) ? homework.subtasks : [];
  const completedSubtasks = subtasksList.filter((s) => s.completed).length;
  const totalSubtasks = subtasksList.length;
  const subtasksPercent =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <div
      className={`group p-4 sm:p-5 rounded-3xl backdrop-blur-xl border select-none transition-all duration-200 ease-out hover:-translate-y-0.5 ${
        isCompleted
          ? 'bg-white/40 dark:bg-zinc-900/40 border-black/5 dark:border-white/5 opacity-70 hover:opacity-100 hover:shadow-apple-sm'
          : deadlineInfo.isOverdue
          ? 'bg-rose-500/[0.04] dark:bg-rose-500/[0.08] border-rose-500/20 shadow-apple-card hover:shadow-apple-hover'
          : 'bg-white/80 dark:bg-zinc-900/80 border-black/5 dark:border-white/10 shadow-apple-card hover:shadow-apple-hover'
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Apple Reminders circular checkmark */}
        <button
          type="button"
          onClick={() => onToggleComplete(homework.id)}
          aria-label={isCompleted ? 'Отметить как невыполненное' : 'Отметить как выполненное'}
          className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ease-out shrink-0 active:scale-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue/50 ${
            isCompleted
              ? 'bg-apple-blue border-apple-blue text-white shadow-apple-sm scale-100'
              : deadlineInfo.isOverdue
              ? 'border-rose-400 hover:border-rose-500 hover:bg-rose-500/10'
              : 'border-apple-gray-300 dark:border-apple-gray-600 hover:border-apple-blue hover:bg-apple-blue/10 hover:scale-105'
          }`}
          title={isCompleted ? 'Отметить как невыполненное' : 'Отметить как выполненное'}
        >
          <Check
            className={`w-3.5 h-3.5 stroke-[3] transition-all duration-200 ${
              isCompleted ? 'opacity-100 scale-100 animate-check-pop' : 'opacity-0 scale-50'
            }`}
          />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top meta tags */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue font-mono break-words leading-tight">
                {homework.subject}
              </span>
              <PriorityBadge priority={homework.priority} />
              <StatusBadge status={homework.status} />
            </div>

            {/* Actions: Edit & Delete buttons */}
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                type="button"
                onClick={() => onEdit(homework)}
                aria-label="Редактировать задание"
                className="p-1 rounded-lg text-apple-gray-400 hover:text-apple-blue hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue/50"
                title="Редактировать"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(homework.id)}
                aria-label="Удалить задание"
                className="p-1 rounded-lg text-apple-gray-400 hover:text-apple-red hover:bg-rose-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
                title="Удалить"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Title */}
          <h4
            className={`text-base font-bold tracking-tight text-apple-gray-900 dark:text-white break-words ${
              isCompleted ? 'line-through text-apple-gray-400 dark:text-apple-gray-500' : ''
            }`}
          >
            {homework.title}
          </h4>

          {/* Description */}
          {homework.description && (
            <p className="mt-1 text-xs sm:text-sm text-apple-gray-600 dark:text-apple-gray-400 leading-relaxed whitespace-pre-line break-words">
              {homework.description}
            </p>
          )}

          {/* Checklist Subtasks */}
          {totalSubtasks > 0 && (
            <div className="mt-3 p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-2">
              {/* Progress Bar */}
              <div className="flex items-center justify-between text-xs text-apple-gray-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <ListTodo className="w-3.5 h-3.5 text-apple-blue" />
                  <span>
                    Подзадачи: {completedSubtasks} из {totalSubtasks}
                  </span>
                </span>
                <span className="font-mono">{subtasksPercent}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-apple-blue rounded-full transition-all duration-300"
                  style={{ width: `${subtasksPercent}%` }}
                />
              </div>

              {/* Subtask list */}
              <div className="space-y-1.5 pt-1">
                {subtasksList.map((sub) => (
                  <button
                    type="button"
                    key={sub.id}
                    role="checkbox"
                    aria-checked={sub.completed}
                    onClick={() => onToggleSubtask(homework.id, sub.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggleSubtask(homework.id, sub.id);
                      }
                    }}
                    className="w-full text-left flex items-center gap-2 text-xs text-apple-gray-700 dark:text-apple-gray-300 cursor-pointer hover:text-apple-gray-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue/50 rounded-md p-0.5"
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                        sub.completed
                          ? 'bg-apple-blue border-apple-blue text-white'
                          : 'border-apple-gray-400'
                      }`}
                    >
                      {sub.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span className={`break-words ${sub.completed ? 'line-through opacity-60' : ''}`}>
                      {sub.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Row: Deadline & Links */}
          <div className="mt-3.5 pt-2 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Deadline */}
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-apple-gray-400 shrink-0" />
              <span className={deadlineInfo.colorClass}>{deadlineInfo.label}</span>
            </div>

            {/* Notes / Material links */}
            <div className="flex items-center gap-3">
              {safeMaterialLink && (
                <a
                  href={safeMaterialLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-apple-blue hover:underline font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Материалы</span>
                </a>
              )}
              {homework.notes && (
                <span
                  className="flex items-center gap-1 text-apple-gray-400"
                  title={homework.notes}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Заметка</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
