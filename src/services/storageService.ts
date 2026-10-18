import { Homework, Priority, HomeworkStatus } from '../types/homework';
import { CalendarCustomEvent, EventType } from '../types/calendar';
import { UserSettings, DEFAULT_SETTINGS } from '../types/settings';
import { formatDateToIso } from '../utils/dateUtils';

const STORAGE_KEY_HOMEWORK = 'ksu_student_homework_v2';
const STORAGE_KEY_DELETED_HW = 'ksu_student_deleted_hw_v2';
const STORAGE_KEY_EVENTS = 'ksu_student_events_v2';
const STORAGE_KEY_DELETED_EVENTS = 'ksu_student_deleted_events_v2';
const STORAGE_KEY_SETTINGS = 'ksu_student_settings_v2';
const STORAGE_KEY_LAST_MODIFIED = 'ksu_student_last_modified';

// Auto-purge any stale test/seed tasks and reset legacy showcase themes from localStorage immediately
try {
  const currentHw = localStorage.getItem(STORAGE_KEY_HOMEWORK);
  if (currentHw && (currentHw.includes('hw_seed_') || currentHw.includes('hw_test_'))) {
    const parsed = JSON.parse(currentHw);
    if (Array.isArray(parsed)) {
      const cleaned = parsed.filter(
        (h: any) => h && !String(h.id).startsWith('hw_seed_') && !String(h.id).startsWith('hw_test_')
      );
      localStorage.setItem(STORAGE_KEY_HOMEWORK, JSON.stringify(cleaned));
    }
  }

  // Purge legacy showcase themes (e.g. cyber-violet, electric-mint) and lock to standard theme
  const currentSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
  if (currentSettings) {
    const parsed = JSON.parse(currentSettings);
    if (parsed.visualTheme !== 'oled' || parsed.accentColor !== '#007AFF') {
      parsed.visualTheme = 'oled';
      parsed.accentColor = '#007AFF';
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(parsed));
    }
  }
} catch {
  // ignore
}

export function sanitizeUrl(url?: string): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/.test(trimmed) && !trimmed.includes('://')) {
    return `https://${trimmed}`;
  }
  return undefined;
}

function sanitizeHomework(item: any): Homework | null {
  if (!item || typeof item !== 'object') return null;
  if (typeof item.id !== 'string' || !item.id.trim()) return null;
  if (typeof item.title !== 'string' || !item.title.trim()) return null;
  if (typeof item.subject !== 'string' || !item.subject.trim()) return null;

  const validPriorities: Priority[] = ['low', 'normal', 'high'];
  const priority = validPriorities.includes(item.priority) ? (item.priority as Priority) : 'normal';

  const validStatuses: HomeworkStatus[] = ['todo', 'in_progress', 'completed'];
  const status = validStatuses.includes(item.status) ? (item.status as HomeworkStatus) : 'todo';

  const subtasks = Array.isArray(item.subtasks)
    ? item.subtasks
        .filter((s: any) => s && typeof s === 'object' && typeof s.id === 'string' && typeof s.title === 'string')
        .map((s: any) => ({
          id: String(s.id).slice(0, 50),
          title: String(s.title).slice(0, 300),
          completed: Boolean(s.completed),
        }))
    : [];

  return {
    id: String(item.id).slice(0, 100),
    title: String(item.title).slice(0, 300),
    subject: String(item.subject).slice(0, 200),
    description: typeof item.description === 'string' ? item.description.slice(0, 5000) : undefined,
    assignedDate: typeof item.assignedDate === 'string' ? item.assignedDate.slice(0, 30) : formatDateToIso(new Date()),
    dueDate: typeof item.dueDate === 'string' ? item.dueDate.slice(0, 30) : formatDateToIso(new Date()),
    dueTime: typeof item.dueTime === 'string' ? item.dueTime.slice(0, 10) : '23:59',
    priority,
    status,
    subtasks,
    materialLink: sanitizeUrl(item.materialLink),
    notes: typeof item.notes === 'string' ? item.notes.slice(0, 2000) : undefined,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
  };
}

function sanitizeEvent(item: any): CalendarCustomEvent | null {
  if (!item || typeof item !== 'object') return null;
  if (typeof item.id !== 'string' || !item.id.trim()) return null;
  if (typeof item.title !== 'string' || !item.title.trim()) return null;
  if (typeof item.date !== 'string' || !item.date.trim()) return null;

  const validTypes: EventType[] = ['test', 'exam', 'colloquium', 'deadline', 'consultation', 'other'];
  const type: EventType = validTypes.includes(item.type) ? (item.type as EventType) : 'other';

  return {
    id: String(item.id).slice(0, 100),
    title: String(item.title).slice(0, 300),
    date: String(item.date).slice(0, 30),
    time: typeof item.time === 'string' ? item.time.slice(0, 10) : undefined,
    type,
    subject: typeof item.subject === 'string' ? item.subject.slice(0, 200) : undefined,
    room: typeof item.room === 'string' ? item.room.slice(0, 50) : undefined,
    notes: typeof item.notes === 'string' ? item.notes.slice(0, 3000) : undefined,
    color: typeof item.color === 'string' ? item.color.slice(0, 30) : undefined,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
  };
}

export class StorageService {
  /**
   * Get timestamp of last local data modification
   */
  static getLastModified(): string {
    const stored = localStorage.getItem(STORAGE_KEY_LAST_MODIFIED);
    if (stored) return stored;
    const now = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY_LAST_MODIFIED, now);
    return now;
  }

  /**
   * Record local data modification time
   */
  static recordLastModified(timestamp?: string): void {
    const time = timestamp || new Date().toISOString();
    localStorage.setItem(STORAGE_KEY_LAST_MODIFIED, time);
  }

  /**
   * Get list of permanently deleted homework IDs (tombstones)
   */
  static getDeletedHomeworkIds(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DELETED_HW);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Record a deleted homework ID so it never resurrects
   */
  static recordDeletedHomeworkId(id: string): void {
    try {
      const ids = new Set(this.getDeletedHomeworkIds());
      ids.add(id);
      localStorage.setItem(STORAGE_KEY_DELETED_HW, JSON.stringify([...ids]));
      this.recordLastModified();
    } catch (e) {
      console.error('Failed to record deleted homework ID', e);
    }
  }

  /**
   * Record multiple deleted homework IDs (e.g. from cloud sync)
   */
  static recordDeletedHomeworkIds(newIds: string[]): void {
    if (!Array.isArray(newIds) || newIds.length === 0) return;
    try {
      const ids = new Set(this.getDeletedHomeworkIds());
      newIds.forEach((id) => ids.add(id));
      localStorage.setItem(STORAGE_KEY_DELETED_HW, JSON.stringify([...ids]));
      this.recordLastModified();
    } catch (e) {
      console.error('Failed to record deleted homework IDs', e);
    }
  }

  /**
   * Load all active homework items (filtered against tombstones)
   */
  static getHomework(): Homework[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HOMEWORK);
      const deletedIds = new Set(this.getDeletedHomeworkIds());

      if (!raw) {
        return [];
      }

      const parsed: Homework[] = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      // Filter out any tasks that have been deleted or are test/seed tasks
      return parsed.filter(
        (h) => !deletedIds.has(h.id) && !h.id.startsWith('hw_seed_') && !h.id.startsWith('hw_test_')
      );
    } catch {
      return [];
    }
  }

  /**
   * Save all homework items (filtered against tombstones)
   */
  static saveHomework(items: Homework[]): void {
    try {
      const deletedIds = new Set(this.getDeletedHomeworkIds());
      const cleanItems = items.filter(
        (h) => !deletedIds.has(h.id) && !h.id.startsWith('hw_seed_') && !h.id.startsWith('hw_test_')
      );
      localStorage.setItem(STORAGE_KEY_HOMEWORK, JSON.stringify(cleanItems));
      this.recordLastModified();
    } catch (e) {
      console.error('Failed to save homework', e);
    }
  }

  /**
   * Add new homework
   */
  static addHomework(item: Omit<Homework, 'id' | 'createdAt' | 'updatedAt'>): Homework {
    const items = this.getHomework();
    const newItem: Homework = {
      ...item,
      id: 'hw_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.unshift(newItem);
    this.saveHomework(items);
    return newItem;
  }

  /**
   * Update existing homework
   */
  static updateHomework(updated: Homework): Homework {
    const items = this.getHomework();
    const idx = items.findIndex((h) => h.id === updated.id);
    if (idx !== -1) {
      items[idx] = {
        ...updated,
        updatedAt: new Date().toISOString(),
        completedAt:
          updated.status === 'completed' && !updated.completedAt
            ? new Date().toISOString()
            : updated.completedAt,
      };
      this.saveHomework(items);
      return items[idx];
    }
    return updated;
  }

  /**
   * Delete homework permanently (records tombstone)
   */
  static deleteHomework(id: string): void {
    this.recordDeletedHomeworkId(id);
    const deletedIds = new Set(this.getDeletedHomeworkIds());
    const items = this.getHomework().filter((h) => h.id !== id && !deletedIds.has(h.id));
    this.saveHomework(items);
  }

  /**
   * Toggle homework completion
   */
  static toggleHomeworkComplete(id: string): Homework | null {
    const items = this.getHomework();
    const item = items.find((h) => h.id === id);
    if (!item) return null;

    const isNowCompleted = item.status !== 'completed';
    item.status = isNowCompleted ? 'completed' : 'todo';
    item.completedAt = isNowCompleted ? new Date().toISOString() : null;
    item.updatedAt = new Date().toISOString();

    // Toggle subtasks as well if completing
    if (isNowCompleted && item.subtasks.length > 0) {
      item.subtasks.forEach((s) => (s.completed = true));
    }

    this.saveHomework(items);
    return item;
  }

  /**
   * Calendar Custom Events
   */
  static getDeletedEventIds(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DELETED_EVENTS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static recordDeletedEventId(id: string): void {
    try {
      const ids = new Set(this.getDeletedEventIds());
      ids.add(id);
      localStorage.setItem(STORAGE_KEY_DELETED_EVENTS, JSON.stringify([...ids]));
      this.recordLastModified();
    } catch (e) {
      console.error('Failed to record deleted event ID', e);
    }
  }

  static getEvents(): CalendarCustomEvent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_EVENTS);
      const deletedIds = new Set(this.getDeletedEventIds());

      if (!raw) return [];

      const parsed: CalendarCustomEvent[] = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed.filter((e) => !deletedIds.has(e.id) && !e.id.startsWith('evt_seed_'));
    } catch {
      return [];
    }
  }

  static saveEvents(events: CalendarCustomEvent[]): void {
    try {
      const deletedIds = new Set(this.getDeletedEventIds());
      const cleanEvents = events.filter((e) => !deletedIds.has(e.id) && !e.id.startsWith('evt_seed_'));
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(cleanEvents));
      this.recordLastModified();
    } catch (e) {
      console.error('Failed to save events', e);
    }
  }

  static addEvent(event: Omit<CalendarCustomEvent, 'id' | 'createdAt'>): CalendarCustomEvent {
    const events = this.getEvents();
    const newEvent: CalendarCustomEvent = {
      ...event,
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      createdAt: new Date().toISOString(),
    };
    events.push(newEvent);
    this.saveEvents(events);
    return newEvent;
  }

  static deleteEvent(id: string): void {
    this.recordDeletedEventId(id);
    const deletedIds = new Set(this.getDeletedEventIds());
    const events = this.getEvents().filter((e) => e.id !== id && !deletedIds.has(e.id));
    this.saveEvents(events);
  }

  /**
   * User Settings
   */
  static getSettings(): UserSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(raw);
      // If user had the legacy cyber-violet / purple theme from previous tests, reset to standard OLED & Apple Blue
      if (
        parsed.visualTheme === 'cyber-violet' ||
        parsed.visualTheme === 'cyber' ||
        parsed.visualTheme === 'electric-mint' ||
        parsed.visualTheme === 'acid-lime' ||
        parsed.accentColor === '#B5179E'
      ) {
        parsed.visualTheme = 'oled';
        parsed.accentColor = '#007AFF';
        try {
          localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(parsed));
        } catch {}
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }

  /**
   * Export all user data as formatted JSON file
   */
  static exportData(): void {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      group: '26-ИСбо-4 (8953)',
      homework: this.getHomework(),
      deletedHwIds: this.getDeletedHomeworkIds(),
      events: this.getEvents(),
      settings: this.getSettings(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ksu_planner_backup_${formatDateToIso(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Import data from JSON string with strict schema validation
   */
  static importData(jsonString: string): { success: boolean; countHw: number; countEvents: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, countHw: 0, countEvents: 0, error: 'Неверный формат файла' };
      }

      if (Array.isArray(parsed.deletedHwIds)) {
        const safeIds = parsed.deletedHwIds.filter((id: any) => typeof id === 'string').map(String);
        this.recordDeletedHomeworkIds(safeIds);
      }

      let countHw = 0;
      if (Array.isArray(parsed.homework)) {
        const validHomework: Homework[] = [];
        for (const item of parsed.homework) {
          const sanitized = sanitizeHomework(item);
          if (sanitized) validHomework.push(sanitized);
        }
        this.saveHomework(validHomework);
        countHw = validHomework.length;
      }

      let countEvents = 0;
      if (Array.isArray(parsed.events)) {
        const validEvents: CalendarCustomEvent[] = [];
        for (const item of parsed.events) {
          const sanitized = sanitizeEvent(item);
          if (sanitized) validEvents.push(sanitized);
        }
        this.saveEvents(validEvents);
        countEvents = validEvents.length;
      }

      if (parsed.settings && typeof parsed.settings === 'object') {
        this.saveSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
      }

      this.recordLastModified();

      return {
        success: true,
        countHw,
        countEvents,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка разбора JSON';
      return { success: false, countHw: 0, countEvents: 0, error: msg };
    }
  }
}
