import React, { useState } from 'react';
import { CheckSquare, Clock, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Homework, HomeworkFilters as IHomeworkFilters } from '../../types/homework';
import { HomeworkCard } from './HomeworkCard';
import { HomeworkFilters } from './HomeworkFilters';
import { HomeworkFormModal } from './HomeworkFormModal';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

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
}

export const HomeworkView: React.FC<HomeworkViewProps> = ({
  items,
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
}) => {
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const confirmDelete = () => {
    if (deletingId) {
      onDeleteHomework(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 3 Summary Stats Cards: 0 активных • 0 просроченных • 0 выполненных */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 select-none">
        {/* Активных */}
        <div
          onClick={() => onFilterChange({ ...filters, tab: 'all' })}
          className={`p-3.5 sm:p-5 rounded-2.5xl sm:rounded-3xl backdrop-blur-xl border transition-all duration-200 cursor-pointer active:scale-[0.98] ${
            filters.tab === 'all'
              ? 'bg-blue-500/10 dark:bg-blue-500/15 border-apple-blue/30 shadow-apple-card ring-1 ring-apple-blue/20'
              : 'bg-white/70 dark:bg-zinc-900/70 border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 shadow-apple-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-apple-gray-500 dark:text-apple-gray-400">
              Активных
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-apple-blue flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-apple-gray-900 dark:text-white">
              {stats.active}
            </span>
            <span className="text-xs text-apple-gray-400 dark:text-apple-gray-500 font-medium">
              активных
            </span>
          </div>
        </div>

        {/* Просроченных */}
        <div
          onClick={() => onFilterChange({ ...filters, tab: 'overdue' })}
          className={`p-3.5 sm:p-5 rounded-2.5xl sm:rounded-3xl backdrop-blur-xl border transition-all duration-200 cursor-pointer active:scale-[0.98] ${
            filters.tab === 'overdue'
              ? 'bg-rose-500/15 dark:bg-rose-500/20 border-rose-500/30 shadow-apple-card ring-1 ring-rose-500/30'
              : stats.overdue > 0
              ? 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20 shadow-apple-card'
              : 'bg-white/70 dark:bg-zinc-900/70 border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 shadow-apple-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-apple-gray-500 dark:text-apple-gray-400">
              Просроченных
            </span>
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${
                stats.overdue > 0
                  ? 'bg-rose-500/15 text-rose-500 dark:text-rose-400'
                  : 'bg-black/5 dark:bg-white/10 text-apple-gray-400'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
            <span
              className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${
                stats.overdue > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-apple-gray-900 dark:text-white'
              }`}
            >
              {stats.overdue}
            </span>
            <span className="text-xs text-apple-gray-400 dark:text-apple-gray-500 font-medium">
              просроченных
            </span>
          </div>
        </div>

        {/* Выполненных */}
        <div
          onClick={() => onFilterChange({ ...filters, tab: 'completed' })}
          className={`p-3.5 sm:p-5 rounded-2.5xl sm:rounded-3xl backdrop-blur-xl border transition-all duration-200 cursor-pointer active:scale-[0.98] ${
            filters.tab === 'completed'
              ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 shadow-apple-card ring-1 ring-emerald-500/20'
              : 'bg-white/70 dark:bg-zinc-900/70 border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 shadow-apple-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-apple-gray-500 dark:text-apple-gray-400">
              Выполненных
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-apple-gray-900 dark:text-white">
              {stats.completed}
            </span>
            <span className="text-xs text-apple-gray-400 dark:text-apple-gray-500 font-medium">
              выполненных
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <HomeworkFilters
        filters={filters}
        onFilterChange={onFilterChange}
        subjectsList={subjectsList}
        counts={{
          all: stats.total,
          today: stats.dueToday,
          thisWeek: stats.thisWeek,
          overdue: stats.overdue,
          completed: stats.completed,
        }}
      />

      {/* List of Tasks */}
      {items.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-card">
          <CheckSquare className="w-12 h-12 mx-auto text-apple-gray-300 dark:text-apple-gray-600 mb-3" />
          <h4 className="text-base font-bold text-apple-gray-900 dark:text-white">
            Нет заданий в этом разделе
          </h4>
          <p className="mt-1 text-xs sm:text-sm text-apple-gray-500 dark:text-apple-gray-400 max-w-sm mx-auto">
            {filters.searchQuery
              ? 'По запросу ничего не найдено. Попробуйте изменить параметры поиска.'
              : 'Все задачи в этой категории выполнены или ещё не добавлены.'}
          </p>
          <div className="mt-4">
            <Button variant="secondary" size="sm" onClick={onOpenCreateModal}>
              Добавить задание
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        title="Удалить задание?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-apple-red">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <p className="text-sm text-apple-gray-700 dark:text-apple-gray-300">
              Вы уверены, что хотите удалить это задание? Это действие нельзя будет отменить.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/5">
            <Button variant="ghost" size="sm" onClick={() => setDeletingId(null)}>
              Отмена
            </Button>
            <Button variant="danger" size="sm" onClick={confirmDelete}>
              Да, удалить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
