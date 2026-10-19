import React from 'react';
import { CheckSquare, AlertTriangle, Clock, Plus, ArrowRight, Check } from 'lucide-react';
import { Homework } from '../../types/homework';
import { PriorityBadge } from '../ui/Badge';

interface TodayHomeworkWidgetProps {
  dueTomorrowList?: Homework[];
  dueTodayList?: Homework[];
  overdueList?: Homework[];
  onToggleComplete: (id: string) => void;
  onOpenCreateModal: () => void;
  onViewAllHomework: () => void;
  onSelectHomework: (hw: Homework) => void;
}

export const TodayHomeworkWidget: React.FC<TodayHomeworkWidgetProps> = ({
  dueTomorrowList,
  dueTodayList = [],
  overdueList = [],
  onToggleComplete,
  onOpenCreateModal,
  onViewAllHomework,
  onSelectHomework,
}) => {
  const tomorrowList = dueTomorrowList ?? dueTodayList;
  return (
    <div className="space-y-4">
      {/* Overdue alert banner if overdue tasks exist */}
      {overdueList.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-apple-red dark:text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Просроченные задания ({overdueList.length})</span>
            </div>
            <button
              onClick={onViewAllHomework}
              className="text-xs text-apple-red dark:text-rose-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Все</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {overdueList.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/70 dark:bg-zinc-900/70 border border-black/5 dark:border-white/5 hover:shadow-apple-sm hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 ease-out"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => onToggleComplete(item.id)}
                    className="w-5 h-5 rounded-full border-2 border-rose-400 hover:bg-rose-500 hover:border-rose-500 flex items-center justify-center transition-all duration-200 ease-out active:scale-75 group shrink-0"
                    title="Отметить выполненным"
                  >
                    <Check className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <div
                    onClick={() => onSelectHomework(item)}
                    className="min-w-0 cursor-pointer"
                  >
                    <h5 className="text-xs sm:text-sm font-semibold text-apple-gray-900 dark:text-white truncate hover:text-apple-blue transition-colors">
                      {item.title}
                    </h5>
                    <p className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 truncate">
                      {item.subject} • Долг с {item.dueDate}
                    </p>
                  </div>
                </div>
                <PriorityBadge priority={item.priority} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Due Tomorrow Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <h4 className="text-base font-bold text-apple-gray-900 dark:text-white">
              Сдать завтра ({tomorrowList.length})
            </h4>
          </div>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1 text-xs font-semibold text-apple-blue hover:text-blue-600 transition-all duration-200 ease-out active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить</span>
          </button>
        </div>

        {tomorrowList.length === 0 ? (
          <div className="py-6 text-center">
            <Clock className="w-8 h-8 mx-auto text-apple-gray-300 dark:text-apple-gray-600 mb-2" />
            <p className="text-xs sm:text-sm font-medium text-apple-gray-600 dark:text-apple-gray-400">
              На завтра нет дедлайнов
            </p>
            <p className="mt-0.5 text-xs text-apple-gray-400">
              Все задания выполнены или дедлайны позже
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tomorrowList.map((item) => {
              const subtasks = Array.isArray(item.subtasks) ? item.subtasks : [];
              const completedSubtasks = subtasks.filter((s) => s.completed).length;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/90 dark:bg-zinc-800/90 border border-black/5 dark:border-white/5 hover:shadow-apple-sm hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 ease-out"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Apple Reminders round checkbox */}
                    <button
                      onClick={() => onToggleComplete(item.id)}
                      className="w-5 h-5 rounded-full border-2 border-apple-blue hover:bg-apple-blue flex items-center justify-center transition-all duration-200 ease-out active:scale-75 group shrink-0"
                      title="Отметить выполненным"
                    >
                      <Check className="w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    <div
                      onClick={() => onSelectHomework(item)}
                      className="min-w-0 cursor-pointer"
                    >
                      <h5 className="text-xs sm:text-sm font-semibold text-apple-gray-900 dark:text-white truncate hover:text-apple-blue transition-colors">
                        {item.title}
                      </h5>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-apple-gray-500 dark:text-apple-gray-400">
                        <span className="truncate">{item.subject}</span>
                        {item.dueTime && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-apple-orange">до {item.dueTime}</span>
                          </>
                        )}
                        {subtasks.length > 0 && (
                          <>
                            <span>•</span>
                            <span>
                              {completedSubtasks}/{subtasks.length} подзадач
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <PriorityBadge priority={item.priority} />
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex justify-end">
          <button
            onClick={onViewAllHomework}
            className="text-xs font-semibold text-apple-blue hover:underline flex items-center gap-1 active:scale-95 transition-all duration-200 ease-out"
          >
            <span>Перейти ко всем заданиям</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
