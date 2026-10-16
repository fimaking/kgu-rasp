import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Homework,
  HomeworkFilters,
  HomeworkFilterTab,
  Priority,
  HomeworkSortOption,
} from '../types/homework';
import { StorageService } from '../services/storageService';
import { SyncService } from '../services/syncService';
import { NotificationService } from '../services/notificationService';
import { formatDateToIso, parseIsoDate, getMondayOfWeek } from '../utils/dateUtils';

export function useHomework() {
  const [items, setItems] = useState<Homework[]>(() => StorageService.getHomework());

  const [filters, setFilters] = useState<HomeworkFilters>({
    tab: 'all',
    subject: 'all',
    priority: 'all',
    status: 'all',
    searchQuery: '',
    sortBy: 'dueDateAsc',
  });

  const reload = useCallback(() => {
    setItems(StorageService.getHomework());
  }, []);

  const addHomework = useCallback((data: Omit<Homework, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = StorageService.addHomework(data);
    setItems(StorageService.getHomework());
    SyncService.pushToCloud();
    return created;
  }, []);

  const updateHomework = useCallback((updated: Homework) => {
    const res = StorageService.updateHomework(updated);
    setItems(StorageService.getHomework());
    SyncService.pushToCloud();
    return res;
  }, []);

  const deleteHomework = useCallback((id: string) => {
    StorageService.deleteHomework(id);
    setItems(StorageService.getHomework());
    SyncService.pushToCloud();
  }, []);

  const toggleComplete = useCallback((id: string) => {
    const res = StorageService.toggleHomeworkComplete(id);
    if (res && res.status === 'completed') {
      NotificationService.playChime();
    }
    setItems(StorageService.getHomework());
    SyncService.pushToCloud();
  }, []);

  const toggleSubtask = useCallback((homeworkId: string, subtaskId: string) => {
    const current = StorageService.getHomework();
    const hw = current.find((h) => h.id === homeworkId);
    if (!hw) return;

    const sub = hw.subtasks.find((s) => s.id === subtaskId);
    if (sub) {
      sub.completed = !sub.completed;
      // If all subtasks completed, suggest or auto complete
      const allDone = hw.subtasks.every((s) => s.completed);
      if (allDone && hw.status !== 'completed') {
        hw.status = 'completed';
        hw.completedAt = new Date().toISOString();
        NotificationService.playChime();
      } else if (!allDone && hw.status === 'completed') {
        hw.status = 'in_progress';
        hw.completedAt = null;
      }
      StorageService.updateHomework(hw);
      setItems(StorageService.getHomework());
      SyncService.pushToCloud();
    }
  }, []);

  // Auto-sync from cloud when switching tabs or focusing window
  useEffect(() => {
    let isMounted = true;
    const syncOnFocus = async () => {
      if (SyncService.getSyncKey()) {
        const res = await SyncService.pullFromCloud();
        if (res.updated && isMounted) {
          setItems(StorageService.getHomework());
        }
      }
    };

    window.addEventListener('focus', syncOnFocus);
    syncOnFocus(); // pull once on mount

    return () => {
      isMounted = false;
      window.removeEventListener('focus', syncOnFocus);
    };
  }, []);

  // Compute dates
  const todayStr = formatDateToIso(new Date());
  const now = new Date();
  const currentWeekMonday = getMondayOfWeek(now);
  const currentWeekSunday = new Date(currentWeekMonday);
  currentWeekSunday.setDate(currentWeekMonday.getDate() + 6);
  const currentWeekEndStr = formatDateToIso(currentWeekSunday);

  // Statistics
  const stats = useMemo(() => {
    let completed = 0;
    let overdue = 0;
    let dueToday = 0;
    let thisWeek = 0;
    let active = 0;

    for (const h of items) {
      if (h.status === 'completed') {
        completed++;
      } else {
        active++;
        // Check overdue
        const dueDate = parseIsoDate(h.dueDate);
        const [hours, mins] = (h.dueTime || '23:59').split(':').map(Number);
        dueDate.setHours(hours, mins, 0, 0);

        if (now.getTime() > dueDate.getTime()) {
          overdue++;
        }

        if (h.dueDate === todayStr) {
          dueToday++;
        }

        if (h.dueDate >= formatDateToIso(currentWeekMonday) && h.dueDate <= currentWeekEndStr) {
          thisWeek++;
        }
      }
    }

    return {
      total: items.length,
      active,
      completed,
      overdue,
      dueToday,
      thisWeek,
      progressPercent: items.length > 0 ? Math.round((completed / items.length) * 100) : 0,
    };
  }, [items, todayStr, currentWeekMonday, currentWeekEndStr, now]);

  // Due today list
  const dueTodayList = useMemo(() => {
    return items.filter((h) => h.dueDate === todayStr && h.status !== 'completed');
  }, [items, todayStr]);

  // Overdue list
  const overdueList = useMemo(() => {
    return items.filter((h) => {
      if (h.status === 'completed') return false;
      const dueDate = parseIsoDate(h.dueDate);
      const [hours, mins] = (h.dueTime || '23:59').split(':').map(Number);
      dueDate.setHours(hours, mins, 0, 0);
      return now.getTime() > dueDate.getTime();
    });
  }, [items, now]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Filter by tab
    if (filters.tab === 'today') {
      result = result.filter((h) => h.dueDate === todayStr);
    } else if (filters.tab === 'this_week') {
      const startStr = formatDateToIso(currentWeekMonday);
      result = result.filter((h) => h.dueDate >= startStr && h.dueDate <= currentWeekEndStr);
    } else if (filters.tab === 'overdue') {
      result = result.filter((h) => {
        if (h.status === 'completed') return false;
        const dueDate = parseIsoDate(h.dueDate);
        const [hours, mins] = (h.dueTime || '23:59').split(':').map(Number);
        dueDate.setHours(hours, mins, 0, 0);
        return now.getTime() > dueDate.getTime();
      });
    } else if (filters.tab === 'completed') {
      result = result.filter((h) => h.status === 'completed');
    }

    // Filter by subject
    if (filters.subject !== 'all') {
      result = result.filter((h) => h.subject === filters.subject);
    }

    // Filter by priority
    if (filters.priority !== 'all') {
      result = result.filter((h) => h.priority === filters.priority);
    }

    // Filter by status
    if (filters.status !== 'all') {
      result = result.filter((h) => h.status === filters.status);
    }

    // Search query
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        (h) =>
          h.title.toLowerCase().includes(q) ||
          h.subject.toLowerCase().includes(q) ||
          (h.description && h.description.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (filters.sortBy === 'dueDateAsc') {
        const dateA = a.dueDate + ' ' + (a.dueTime || '23:59');
        const dateB = b.dueDate + ' ' + (b.dueTime || '23:59');
        return dateA.localeCompare(dateB);
      }
      if (filters.sortBy === 'dueDateDesc') {
        const dateA = a.dueDate + ' ' + (a.dueTime || '23:59');
        const dateB = b.dueDate + ' ' + (b.dueTime || '23:59');
        return dateB.localeCompare(dateA);
      }
      if (filters.sortBy === 'priorityDesc') {
        const weight: Record<Priority, number> = { high: 3, normal: 2, low: 1 };
        return weight[b.priority] - weight[a.priority];
      }
      // createdAtDesc
      return b.createdAt.localeCompare(a.createdAt);
    });

    return result;
  }, [items, filters, todayStr, currentWeekMonday, currentWeekEndStr, now]);

  return {
    items: filteredItems,
    allItems: items,
    stats,
    dueTodayList,
    overdueList,
    filters,
    setFilters,
    setTab: (tab: HomeworkFilterTab) => setFilters((f) => ({ ...f, tab })),
    setSubjectFilter: (subject: string) => setFilters((f) => ({ ...f, subject })),
    setPriorityFilter: (priority: 'all' | Priority) => setFilters((f) => ({ ...f, priority })),
    setSearchQuery: (searchQuery: string) => setFilters((f) => ({ ...f, searchQuery })),
    setSortBy: (sortBy: HomeworkSortOption) => setFilters((f) => ({ ...f, sortBy })),
    addHomework,
    updateHomework,
    deleteHomework,
    toggleComplete,
    toggleSubtask,
    reload,
  };
}
