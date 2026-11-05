import React from 'react';
import { CheckSquare, AlertTriangle, Clock, Plus, ArrowRight, Check } from 'lucide-react';
import { Homework } from '../../types/homework';
import { getHomeworkLessonType } from '../../utils/scheduleParser';

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
    <div className="space-y-3.5 select-none">
      {/* Overdue alert banner if overdue tasks exist */}
      {overdueList.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-500/10 dark:bg-red-500/15 border border-red-500/20">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs sm:text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Просроченные задания ({overdueList.length})</span>
            </div>
            {onViewAllHomework && (
              <button
                onClick={onViewAllHomework}
                className="text-xs text-red-600 dark:text-red-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Все</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {overdueList.slice(0, 3).map((item) => {
              const overdueLessonType = item.lessonType || getHomeworkLessonType(item);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white dark:bg-[#242424] border border-zinc-200 dark:border-[#333333] hover:border-zinc-300 dark:hover:border-[#404040] transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => onToggleComplete(item.id)}
                      className="w-4.5 h-4.5 rounded-full border-2 border-red-400 hover:bg-red-500 hover:border-red-500 flex items-center justify-center transition-all shrink-0 cursor-pointer"
                      title="Отметить выполненным"
                    >
                      <Check className="w-2.5 h-2.5 text-white opacity-0 hover:opacity-100" />
                    </button>
                    <div
                      onClick={() => onSelectHomework(item)}
                      className="min-w-0 cursor-pointer"
                    >
                      <h5 className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate hover:text-[#2B82FB] transition-colors">
                        {item.title}
                      </h5>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1.5">
                        <span>{item.subject}</span>
                        {overdueLessonType && (
                          <>
                            <span className="opacity-40">•</span>
                            <span className="font-medium text-[#2B82FB]">{overdueLessonType}</span>
                          </>
                        )}
                        <span className="opacity-40">•</span>
                        <span>Срок: {item.dueDate}</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Due Tomorrow Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#242424] border border-zinc-200 dark:border-[#303030] shadow-sm space-y-3">
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2B82FB]/10 text-[#2B82FB] flex items-center justify-center shrink-0">
              <CheckSquare className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>Сдать завтра</span>
              <span className="text-xs font-mono font-semibold px-2 py-0.2 rounded-full bg-[#2B82FB]/10 text-[#2B82FB]">
                {tomorrowList.length}
              </span>
            </h4>
          </div>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2B82FB]/10 hover:bg-[#2B82FB]/20 text-[#2B82FB] text-xs font-semibold transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Добавить</span>
          </button>
        </div>

        {tomorrowList.length === 0 ? (
          <div className="py-6 text-center">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              На завтра нет дедлайнов
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              Все задачи выполнены или дедлайны позже
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {tomorrowList.map((item) => {
              const itemLessonType = item.lessonType || getHomeworkLessonType(item);

              return (
                <div
                  key={item.id}
                  className="group flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-[#1E1E1E] hover:bg-zinc-100 dark:hover:bg-[#282828] border border-zinc-200 dark:border-[#2C2C2C] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* TickTick round checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete(item.id);
                      }}
                      className="w-4.5 h-4.5 rounded-full border-2 border-zinc-400 dark:border-zinc-500 hover:border-[#2B82FB] hover:bg-[#2B82FB] flex items-center justify-center transition-all group/check shrink-0 cursor-pointer"
                      title="Отметить выполненным"
                    >
                      <Check className="w-2.5 h-2.5 text-white opacity-0 group-hover/check:opacity-100 transition-opacity stroke-[3]" />
                    </button>

                    <div
                      onClick={() => onSelectHomework(item)}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      <h5 className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-[#2B82FB] transition-colors">
                        {item.title}
                      </h5>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                        <span className="truncate font-medium text-[#2B82FB] dark:text-[#60A5FA]">
                          {item.subject}
                        </span>
                        {itemLessonType && (
                          <>
                            <span className="opacity-40">•</span>
                            <span className="font-medium text-zinc-600 dark:text-zinc-400">
                              {itemLessonType}
                            </span>
                          </>
                        )}
                        {item.dueTime && (
                          <>
                            <span className="opacity-40">•</span>
                            <span className="font-mono text-[#FA8C16] flex items-center gap-1 shrink-0">
                              <Clock className="w-3 h-3 stroke-[2]" />
                              до {item.dueTime}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
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
