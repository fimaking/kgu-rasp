import React from 'react';
import { Check, Edit2, Trash2, Clock, Calendar } from 'lucide-react';
import { Homework } from '../../types/homework';
import { parseIsoDate, formatRussianDate, formatDateToIso } from '../../utils/dateUtils';

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

  // Calculate friendly deadline label
  const dueInfo = React.useMemo(() => {
    if (!homework.dueDate) return null;
    const due = parseIsoDate(homework.dueDate);
    const today = new Date();
    const todayStr = formatDateToIso(today);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = formatDateToIso(tomorrow);

    const isOverdue = !isCompleted && homework.dueDate < todayStr;
    const isToday = homework.dueDate === todayStr;
    const isTomorrow = homework.dueDate === tomorrowStr;

    let text = '';
    if (isToday) {
      text = homework.dueTime ? `Сегодня, до ${homework.dueTime}` : 'Сегодня';
    } else if (isTomorrow) {
      text = homework.dueTime ? `Завтра, до ${homework.dueTime}` : 'Завтра';
    } else {
      const dayShort = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][due.getDay()];
      text = `${dayShort}, ${formatRussianDate(due, false)}`;
    }

    return { text, isOverdue, isToday };
  }, [homework.dueDate, homework.dueTime, isCompleted]);

  return (
    <div
      className={`group p-4 rounded-2xl border select-none transition-all duration-150 ease-out ${
        isCompleted
          ? 'bg-[#FAFAFA] dark:bg-[#1E1E1E] border-zinc-200 dark:border-[#2C2C2C] opacity-60 hover:opacity-100'
          : 'bg-[#FFFFFF] dark:bg-[#242424] border-zinc-200 dark:border-[#303030] shadow-sm hover:shadow hover:border-zinc-300 dark:hover:border-[#3C3C3C]'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* TickTick round checkbox */}
        <button
          type="button"
          onClick={() => onToggleComplete(homework.id)}
          aria-label={isCompleted ? 'Отметить как невыполненное' : 'Отметить как выполненное'}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-150 ease-out shrink-0 active:scale-80 cursor-pointer ${
            isCompleted
              ? 'bg-[#2B82FB] border-[#2B82FB] text-white shadow-sm'
              : 'border-zinc-400 dark:border-zinc-500 hover:border-[#2B82FB] hover:bg-[#2B82FB]/10'
          }`}
          title={isCompleted ? 'Отметить как невыполненное' : 'Отметить как выполненное'}
        >
          <Check
            className={`w-3 h-3 stroke-[3] transition-all duration-150 ${
              isCompleted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}
          />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top row: Subject pill and action icons */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2B82FB] dark:text-[#60A5FA] truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2B82FB] shrink-0" />
              <span className="truncate">{homework.subject}</span>
            </span>

            {/* Actions: Edit & Delete buttons */}
            <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                type="button"
                onClick={() => onEdit(homework)}
                aria-label="Редактировать задание"
                className="p-1 rounded-lg text-zinc-400 hover:text-[#2B82FB] hover:bg-zinc-100 dark:hover:bg-[#2F2F2F] transition-colors cursor-pointer"
                title="Редактировать"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(homework.id)}
                aria-label="Удалить задание"
                className="p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Удалить"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Title */}
          <h4
            className={`text-sm sm:text-base font-medium tracking-tight text-zinc-900 dark:text-zinc-100 break-words ${
              isCompleted ? 'line-through text-zinc-400 dark:text-zinc-500' : ''
            }`}
          >
            {homework.title}
          </h4>

          {/* Optional notes / description if present */}
          {homework.description && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed whitespace-pre-line break-words">
              {homework.description}
            </p>
          )}

          {/* Due date chip */}
          {dueInfo && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[11px] ${
                  dueInfo.isOverdue
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 font-semibold'
                    : dueInfo.isToday
                    ? 'bg-[#FA8C16]/10 text-[#FA8C16] dark:text-[#FB923C] font-semibold'
                    : 'bg-zinc-100 dark:bg-[#2C2C2C] text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {dueInfo.isOverdue ? (
                  <Clock className="w-3 h-3 text-red-500" />
                ) : (
                  <Calendar className="w-3 h-3 opacity-70" />
                )}
                <span>{dueInfo.text}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
