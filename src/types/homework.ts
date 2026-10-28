export type Priority = 'low' | 'normal' | 'high';
export type HomeworkStatus = 'todo' | 'in_progress' | 'completed';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Homework {
  id: string;
  title: string;
  subject: string;
  lessonType?: string; // "Практика", "Лаба", "Лекция", etc.
  description?: string;
  assignedDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // "23:59"
  priority: Priority;
  status: HomeworkStatus;
  subtasks: Subtask[];
  materialLink?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export type HomeworkFilterTab = 'all' | 'today' | 'this_week' | 'overdue' | 'completed';

export type HomeworkSortOption = 'dueDateAsc' | 'dueDateDesc' | 'priorityDesc' | 'createdAtDesc';

export interface HomeworkFilters {
  tab: HomeworkFilterTab;
  subject: string; // 'all' or specific subject
  priority: 'all' | Priority;
  status: 'all' | HomeworkStatus;
  searchQuery: string;
  sortBy: HomeworkSortOption;
}
