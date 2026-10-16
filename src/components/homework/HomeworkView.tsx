import React, { useState } from 'react';
import { Plus, CheckSquare, Sparkles, AlertCircle } from 'lucide-react';
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-apple-blue font-mono">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Трекер успеваемости КГУ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-apple-gray-900 dark:text-white mt-0.5">
            Домашние задания
          </h2>
          <p className="text-xs sm:text-sm text-apple-gray-500 dark:text-apple-gray-400">
            {stats.active} активных • {stats.completed} выполнено • {stats.overdue} просрочено
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
          onClick={onOpenCreateModal}
        >
          Новое задание
        </Button>
      </div>

      {/* Overall Progress Widget */}
      <div className="p-5 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-card space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-apple-gray-900 dark:text-white">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-apple-blue" />
            <span>Общий прогресс семестра</span>
          </span>
          <span className="font-mono text-apple-blue font-bold">{stats.progressPercent}%</span>
        </div>

        <div className="w-full h-2.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-apple-blue to-apple-indigo rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${stats.progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-apple-gray-500 dark:text-apple-gray-400">
          <span>Сдано {stats.completed} из {stats.total} заданий</span>
          <span>{stats.overdue > 0 ? `⚠️ ${stats.overdue} долгов` : 'Все задания в графике'}</span>
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
