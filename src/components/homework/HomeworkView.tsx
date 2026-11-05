import React, { useState } from 'react';
import { CheckSquare, Plus, AlertCircle } from 'lucide-react';
import { Homework, HomeworkFilters as IHomeworkFilters, HomeworkFilterTab } from '../../types/homework';
import { HomeworkCard } from './HomeworkCard';
import { HomeworkFormModal } from './HomeworkFormModal';
import { QuickStats } from '../today/QuickStats';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { formatDateToIso } from '../../utils/dateUtils';

interface HomeworkViewProps {
  items: Homework[];
  allItems: Homework[];
  stats: {
    total: number;
    active: number;
    completed: number;
    overdue: number;
    dueToday: number;
    thisWeek: number;
    progressPercent: number;
  };
  filters: IHomeworkFilters;
  onFilterChange: (filters: IHomeworkFilters) => void;
  onToggleComplete: (id: string) => void;
  onToggleSubtask: (hwId: string, subId: string) => void;
  onAddHomework: (data: Omit<Homework, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateHomework: (hw: Homework) => void;
  onDeleteHomework: (id: string) => void;
  subjectsList: string[];
  isCreateModalOpen: boolean;
  onCloseCreateModal: () => void;
  onOpenCreateModal: () => void;
  selectedHomeworkForEdit?: Homework | null;
  todayLessonsCount?: number;
  onNavigateToSchedule?: () => void;
  groupName?: string;
}

export const HomeworkView: React.FC<HomeworkViewProps> = ({
  items,
  allItems: _allItems,
  stats,
  filters,
  onFilterChange,
  onToggleComplete,
  onToggleSubtask,
  onAddHomework,
  onUpdateHomework,
  onDeleteHomework,
  subjectsList,
  isCreateModalOpen,
  onCloseCreateModal,
  onOpenCreateModal,
  todayLessonsCount = 0,
  onNavigateToSchedule,
  groupName,
}) => {
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState('');

  const confirmDelete = () => {
    if (deletingId) {
      onDeleteHomework(deletingId);
      setDeletingId(null);
    }
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTitle.trim();
    if (!trimmed) return;

    const defaultSub = subjectsList[0] || 'Общее';
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + 3);

    onAddHomework({
      title: trimmed,
      subject: defaultSub,
      dueDate: formatDateToIso(nextDue),
      dueTime: '23:59',
      assignedDate: formatDateToIso(new Date()),
      priority: 'normal',
      status: 'todo',
      subtasks: [],
    });

    setQuickTitle('');
  };

  const tabs: { id: HomeworkFilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'Все', count: stats.total },
    { id: 'today', label: 'Сдать сегодня', count: stats.dueToday },
    { id: 'overdue', label: 'Просроченные', count: stats.overdue },
    { id: 'completed', label: 'Выполненные', count: stats.completed },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 4 Mini Windows (Quick Stats) */}
      <QuickStats
        todayLessonsCount={todayLessonsCount}
        activeHomeworkCount={stats.active}
        overdueHomeworkCount={stats.overdue}
        dueTodayHomeworkCount={stats.dueToday}
        onNavigateToTab={(tab) => {
          if (tab === 'schedule') {
            onNavigateToSchedule?.();
          }
        }}
        onSelectFilter={(filterTab) => onFilterChange({ ...filters, tab: filterTab })}
      />

      {/* TickTick Inline Quick-Add Task Bar */}
      <form
        onSubmit={handleQuickAdd}
        className="flex items-center gap-2 p-1.5 pl-3 rounded-xl bg-white dark:bg-[#242424] border border-zinc-200 dark:border-[#303030] shadow-sm focus-within:border-[#2B82FB] focus-within:ring-2 focus-within:ring-[#2B82FB]/20 transition-all"
      >
        <Plus className="w-4 h-4 text-[#2B82FB] shrink-0" />
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="+ Добавить задание, нажмите Enter для быстрого сохранения..."
          className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
        />
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onOpenCreateModal}
          className="shrink-0"
        >
          Подробнее
        </Button>
      </form>

      {/* Clean TickTick Segmented Tabs */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-[#1E1E1E] rounded-xl overflow-x-auto no-scrollbar border border-zinc-200 dark:border-[#2C2C2C] text-xs font-medium">
        {tabs.map((tab) => {
          const isActive = filters.tab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onFilterChange({ ...filters, tab: tab.id })}
              className={`px-3 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-[#2A2A2A] text-zinc-900 dark:text-white font-semibold shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive
                    ? 'bg-[#2B82FB]/10 text-[#2B82FB] dark:bg-[#2B82FB]/20'
                    : 'bg-black/5 dark:bg-white/5 opacity-70'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List of Tasks */}
      {items.length === 0 ? (
        <div className="p-10 text-center rounded-2xl bg-white dark:bg-[#242424] border border-zinc-200 dark:border-[#303030] shadow-sm">
          <CheckSquare className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600 mb-2.5" />
          <h4 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Нет заданий
          </h4>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            {filters.tab === 'completed'
              ? 'Вы ещё не выполнили ни одного задания.'
              : 'Все задачи закрыты или ещё не добавлены.'}
          </p>
          <div className="mt-3.5">
            <Button variant="secondary" size="sm" onClick={onOpenCreateModal}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Добавить задание
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((hw) => (
            <HomeworkCard
              key={hw.id}
              homework={hw}
              onToggleComplete={onToggleComplete}
              onToggleSubtask={onToggleSubtask}
              onEdit={(item) => setEditingHomework(item)}
              onDelete={(id) => setDeletingId(id)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {(isCreateModalOpen || editingHomework) && (
        <HomeworkFormModal
          isOpen={isCreateModalOpen || Boolean(editingHomework)}
          onClose={() => {
            onCloseCreateModal();
            setEditingHomework(null);
          }}
          onSubmit={(data) => {
            if (editingHomework) {
              onUpdateHomework({ ...editingHomework, ...data });
              setEditingHomework(null);
            } else {
              onAddHomework(data);
              onCloseCreateModal();
            }
          }}
          initialData={editingHomework}
          subjectsList={subjectsList}
          groupName={groupName}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <Modal
          isOpen={Boolean(deletingId)}
          onClose={() => setDeletingId(null)}
          title="Удалить задание?"
          subtitle="Это действие нельзя будет отменить"
          maxWidth="sm"
        >
          <div className="space-y-4 select-none">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Задание будет удалено безвозвратно.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-[#2C2C2C]">
              <Button variant="ghost" onClick={() => setDeletingId(null)}>
                Отмена
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                Удалить
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
