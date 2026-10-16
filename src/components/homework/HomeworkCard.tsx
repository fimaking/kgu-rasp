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
  const deadlineInfo = formatRelativeDeadline(homework.dueDate, homework.dueTime);

  const completedSubtasks = homework.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = homework.subtasks.length;
  const subtasksPercent =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <div
      className={`group p-4 sm:p-5 rounded-3xl backdrop-blur-xl border transition-all select-none ${
        isCompleted
          ? 'bg-white/40 dark:bg-zinc-900/40 border-black/5 dark:border-white/5 opacity-70 hover:opacity-100'
          : deadlineInfo.isOverdue
          ? 'bg-rose-500/[0.04] dark:bg-rose-500/[0.08] border-rose-500/20 shadow-apple-card hover:shadow-apple-hover'
          : 'bg-white/80 dark:bg-zinc-900/80 border-black/5 dark:border-white/10 shadow-apple-card hover:shadow-apple-hover'
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Apple Reminders circular checkmark */}
        <button
          onClick={() => onToggleComplete(homework.id)}
          className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 active:scale-90 ${
            isCompleted
              ? 'bg-apple-blue border-apple-blue text-white shadow-apple-sm'
              : deadlineInfo.isOverdue
              ? 'border-rose-400 hover:border-rose-500 hover:bg-rose-500/10'
              : 'border-apple-gray-300 dark:border-apple-gray-600 hover:border-apple-blue hover:bg-apple-blue/10'
          }`}
          title={isCompleted ? 'Отметить как невыполненное' : 'Отметить как выполненное'}
        >
          <Check
            className={`w-3.5 h-3.5 stroke-[3] transition-opacity ${
              isCompleted ? 'opacity-100' : 'opacity-0 hover:opacity-60'
            }`}
          />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top meta tags */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue font-mono truncate max-w-[200px]">
                {homework.subject}
              </span>
              <PriorityBadge priority={homework.priority} />
              <StatusBadge status={homework.status} />
            </div>

            {/* Actions: Edit & Delete buttons */}
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(homework)}
                className="p-1 rounded-lg text-apple-gray-400 hover:text-apple-blue hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                title="Редактировать"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(homework.id)}
                className="p-1 rounded-lg text-apple-gray-400 hover:text-apple-red hover:bg-rose-500/10 transition-colors"
                title="Удалить"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Title */}
          <h4
            className={`text-base font-bold tracking-tight text-apple-gray-900 dark:text-white ${
              isCompleted ? 'line-through text-apple-gray-400 dark:text-apple-gray-500' : ''
            }`}
          >
            {homework.title}
          </h4>

          {/* Description */}
          {homework.description && (
            <p className="mt-1 text-xs sm:text-sm text-apple-gray-600 dark:text-apple-gray-400 leading-relaxed whitespace-pre-line">
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
                {homework.subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => onToggleSubtask(homework.id, sub.id)}
                    className="flex items-center gap-2 text-xs text-apple-gray-700 dark:text-apple-gray-300 cursor-pointer hover:text-apple-gray-900 transition-colors"
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
                    <span className={sub.completed ? 'line-through opacity-60' : ''}>
                      {sub.title}
                    </span>
                  </div>
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
              {homework.materialLink && (
                <a
                  href={homework.materialLink}
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
