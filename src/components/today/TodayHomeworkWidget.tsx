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
  onViewAllHomework?: () => void;
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
            {onViewAllHomework && (
              <button
                onClick={onViewAllHomework}
                className="text-xs text-apple-red dark:text-rose-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Все</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
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
      <div className="p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-card space-y-4">
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue flex items-center justify-center shrink-0">
              <CheckSquare className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h4 className="text-base font-bold text-apple-gray-900 dark:text-white flex items-center gap-2">
              <span>Сдать завтра</span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue dark:bg-apple-blue/20">
                {tomorrowList.length}
              </span>
            </h4>
          </div>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-apple-blue/10 dark:bg-apple-blue/20 hover:bg-apple-blue/20 text-apple-blue text-xs font-semibold transition-all duration-200 ease-out active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Добавить</span>
          </button>
        </div>

        {tomorrowList.length === 0 ? (
          <div className="py-7 text-center">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2.5">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <p className="text-sm font-semibold text-apple-gray-800 dark:text-zinc-200">
              На завтра нет дедлайнов
            </p>
            <p className="mt-0.5 text-xs text-apple-gray-400">
              Все задания выполнены или дедлайны позже
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tomorrowList.map((item) => {
              const subtasks = Array.isArray(item.subtasks) ? item.subtasks : [];
              const completedSubtasks = subtasks.filter((s) => s.completed).length;

              return (
                <div
                  key={item.id}
                  className="group flex items-center justify-between gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] hover:bg-black/[0.05] dark:hover:bg-white/[0.07] border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 transition-all duration-200 ease-out active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Apple Reminders round checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete(item.id);
                      }}
                      className="w-5 h-5 rounded-full border-2 border-apple-blue/70 hover:border-apple-blue hover:bg-apple-blue flex items-center justify-center transition-all duration-150 ease-out active:scale-75 group/check shrink-0 cursor-pointer"
                      title="Отметить выполненным"
                    >
                      <Check className="w-3 text-white opacity-0 group-hover/check:opacity-100 transition-opacity stroke-[3]" />
                    </button>

                    <div
                      onClick={() => onSelectHomework(item)}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      <h5 className="text-sm font-semibold text-apple-gray-900 dark:text-white truncate group-hover:text-apple-blue transition-colors">
                        {item.title}
                      </h5>
                      <div className="flex items-center gap-2 mt-1 text-xs text-apple-gray-500 dark:text-apple-gray-400">
                        <span className="truncate font-medium">{item.subject}</span>
                        {item.dueTime && (
                          <>
                            <span className="opacity-40">•</span>
                            <span className="font-mono text-apple-orange flex items-center gap-1 shrink-0">
                              <Clock className="w-3 h-3 stroke-[2]" />
                              до {item.dueTime}
                            </span>
                          </>
                        )}
                        {subtasks.length > 0 && (
                          <>
                            <span className="opacity-40">•</span>
                            <span className="shrink-0 font-medium text-apple-gray-400">
                              {completedSubtasks}/{subtasks.length} подзадач
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0" onClick={() => onSelectHomework(item)}>
                    <PriorityBadge priority={item.priority} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
