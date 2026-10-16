import { Search } from 'lucide-react';
import {
  HomeworkFilters as IHomeworkFilters,
  HomeworkFilterTab,
  Priority,
  HomeworkStatus,
  HomeworkSortOption,
} from '../../types/homework';

interface HomeworkFiltersProps {
  filters: IHomeworkFilters;
  onFilterChange: (filters: IHomeworkFilters) => void;
  subjectsList: string[];
  counts: {
    all: number;
    today: number;
    thisWeek: number;
    overdue: number;
    completed: number;
  };
}

export const HomeworkFilters: React.FC<HomeworkFiltersProps> = ({
  filters,
  onFilterChange,
  subjectsList,
  counts,
}) => {
  const tabs: { id: HomeworkFilterTab; label: string; count: number; badgeColor?: string }[] = [
    { id: 'all', label: 'Все', count: counts.all },
    { id: 'today', label: 'Сегодня', count: counts.today },
    { id: 'this_week', label: 'На этой неделе', count: counts.thisWeek },
    {
      id: 'overdue',
      label: 'Просроченные',
      count: counts.overdue,
      badgeColor: counts.overdue > 0 ? 'bg-rose-500 text-white' : undefined,
    },
    { id: 'completed', label: 'Выполненные', count: counts.completed },
  ];

  return (
    <div className="space-y-3.5 select-none">
      {/* Apple segmented tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-2.5xl overflow-x-auto no-scrollbar border border-black/5 dark:border-white/5 text-xs font-semibold">
        {tabs.map((tab) => {
          const isActive = filters.tab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onFilterChange({ ...filters, tab: tab.id })}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-white dark:bg-zinc-800 text-apple-gray-900 dark:text-white shadow-apple-sm font-bold scale-[1.01]'
                  : 'text-apple-gray-600 dark:text-apple-gray-400 hover:text-apple-gray-900 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                  tab.badgeColor
                    ? tab.badgeColor
                    : isActive
                    ? 'bg-black/5 dark:bg-white/10 text-apple-gray-800 dark:text-white'
                    : 'bg-black/[0.03] dark:bg-white/[0.05] text-apple-gray-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Secondary filter & search controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-apple-gray-400" />
          <input
            type="text"
            placeholder="Поиск по названию или предмету..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-black/5 dark:border-white/10 text-xs sm:text-sm text-apple-gray-900 dark:text-white placeholder:text-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all shadow-apple-sm"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Subject Filter */}
          <div className="relative">
            <select
              value={filters.subject}
              onChange={(e) => onFilterChange({ ...filters, subject: e.target.value })}
              className="px-3 py-2 rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-black/5 dark:border-white/10 text-xs font-medium text-apple-gray-800 dark:text-apple-gray-200 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 shadow-apple-sm max-w-[160px] truncate"
            >
              <option value="all">Все предметы</option>
              {subjectsList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <select
              value={filters.priority}
              onChange={(e) =>
                onFilterChange({ ...filters, priority: e.target.value as 'all' | Priority })
              }
              className="px-3 py-2 rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-black/5 dark:border-white/10 text-xs font-medium text-apple-gray-800 dark:text-apple-gray-200 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 shadow-apple-sm"
            >
              <option value="all">Любой приоритет</option>
              <option value="high">🔥 Высокий</option>
              <option value="normal">🔹 Обычный</option>
              <option value="low">▫️ Низкий</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) =>
                onFilterChange({ ...filters, status: e.target.value as 'all' | HomeworkStatus })
              }
              className="px-3 py-2 rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-black/5 dark:border-white/10 text-xs font-medium text-apple-gray-800 dark:text-apple-gray-200 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 shadow-apple-sm"
            >
              <option value="all">Любой статус</option>
              <option value="todo">Не начато</option>
              <option value="in_progress">В работе</option>
              <option value="completed">Сдано</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="relative">
            <select
              value={filters.sortBy}
              onChange={(e) =>
                onFilterChange({ ...filters, sortBy: e.target.value as HomeworkSortOption })
              }
              className="px-3 py-2 rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-black/5 dark:border-white/10 text-xs font-medium text-apple-gray-800 dark:text-apple-gray-200 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 shadow-apple-sm"
            >
              <option value="dueDateAsc">Сначала срочные (дедлайн)</option>
              <option value="dueDateDesc">Поздние дедлайны</option>
              <option value="priorityDesc">По приоритету</option>
              <option value="createdAtDesc">Сначала новые</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
