import React from 'react';
import { Check, Edit2, Trash2 } from 'lucide-react';
import { Homework } from '../../types/homework';

interface HomeworkCardProps {
  homework: Homework;
  onToggleComplete: (id: string) => void;
  onToggleSubtask?: (hwId: string, subId: string) => void;
  onEdit: (hw: Homework) => void;
  onDelete: (id: string) => void;
}

export const HomeworkCard: React.FC<HomeworkCardProps> = ({
  homework,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const isCompleted = homework.status === 'completed';

  return (
    <div
      className={`group p-4 sm:p-5 rounded-3xl backdrop-blur-xl border select-none transition-all duration-200 ease-out hover:-translate-y-0.5 ${
        isCompleted
          ? 'bg-white/40 dark:bg-zinc-900/40 border-black/5 dark:border-white/5 opacity-60 hover:opacity-100 hover:shadow-apple-sm'
          : 'bg-white/80 dark:bg-zinc-900/80 border-black/5 dark:border-white/10 shadow-apple-card hover:shadow-apple-hover'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Apple Reminders circular checkmark */}
        <button
          type="button"
          onClick={() => onToggleComplete(homework.id)}
          aria-label={isCompleted ? 'Отметить как невыполненное' : 'Отметить как выполненное'}
          className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ease-out shrink-0 active:scale-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue/50 ${
            isCompleted
              ? 'bg-apple-blue border-apple-blue text-white shadow-apple-sm scale-100'
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
          {/* Top row: Subject badge and Actions */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-xl bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue font-medium break-words leading-tight">
              {homework.subject}
            </span>

            {/* Actions: Edit & Delete buttons */}
            <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
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
            className={`text-sm sm:text-base font-semibold tracking-tight text-apple-gray-900 dark:text-white break-words ${
              isCompleted ? 'line-through text-apple-gray-400 dark:text-apple-gray-500' : ''
            }`}
          >
            {homework.title}
          </h4>

          {/* Description (if present) */}
          {homework.description && (
            <p className="mt-1 text-xs sm:text-sm text-apple-gray-500 dark:text-apple-gray-400 leading-relaxed whitespace-pre-line break-words">
              {homework.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
