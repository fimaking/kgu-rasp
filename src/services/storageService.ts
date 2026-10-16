import { Homework } from '../types/homework';
import { CalendarCustomEvent } from '../types/calendar';
import { UserSettings, DEFAULT_SETTINGS } from '../types/settings';
import { formatDateToIso } from '../utils/dateUtils';

const STORAGE_KEY_HOMEWORK = 'ksu_student_homework_v2';
const STORAGE_KEY_EVENTS = 'ksu_student_events_v2';
const STORAGE_KEY_SETTINGS = 'ksu_student_settings_v2';

export class StorageService {
  /**
   * Load all homework items
   */
  static getHomework(): Homework[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HOMEWORK);
      if (!raw) {
        const seed = this.getSeedHomework();
        this.saveHomework(seed);
        return seed;
      }
      return JSON.parse(raw);
    } catch {
      return this.getSeedHomework();
    }
  }

  /**
   * Save all homework items
   */
  static saveHomework(items: Homework[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_HOMEWORK, JSON.stringify(items));
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
        completedAt: updated.status === 'completed' && !updated.completedAt ? new Date().toISOString() : updated.completedAt,
      };
      this.saveHomework(items);
      return items[idx];
    }
    return updated;
  }

  /**
   * Delete homework
   */
  static deleteHomework(id: string): void {
    const items = this.getHomework().filter((h) => h.id !== id);
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
  static getEvents(): CalendarCustomEvent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_EVENTS);
      if (!raw) return this.getSeedEvents();
      return JSON.parse(raw);
    } catch {
      return this.getSeedEvents();
    }
  }

  static saveEvents(events: CalendarCustomEvent[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
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
    const events = this.getEvents().filter((e) => e.id !== id);
    this.saveEvents(events);
  }

  /**
   * User Settings
   */
  static getSettings(): UserSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (!raw) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
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
   * Import data from JSON string
   */
  static importData(jsonString: string): { success: boolean; countHw: number; countEvents: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, countHw: 0, countEvents: 0, error: 'Неверный формат файла' };
      }

      if (Array.isArray(parsed.homework)) {
        this.saveHomework(parsed.homework);
      }
      if (Array.isArray(parsed.events)) {
        this.saveEvents(parsed.events);
      }
      if (parsed.settings && typeof parsed.settings === 'object') {
        this.saveSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
      }

      return {
        success: true,
        countHw: Array.isArray(parsed.homework) ? parsed.homework.length : 0,
        countEvents: Array.isArray(parsed.events) ? parsed.events.length : 0,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка разбора JSON';
      return { success: false, countHw: 0, countEvents: 0, error: msg };
    }
  }

  /**
   * Realistic initial homework seed for Group 8953
   */
  private static getSeedHomework(): Homework[] {
    const today = new Date();
    const plusDays = (d: number) => {
      const target = new Date(today);
      target.setDate(today.getDate() + d);
      return formatDateToIso(target);
    };

    return [
      {
        id: 'hw_seed_1',
        title: 'Лабораторная работа №3: Классы и наследование в C#',
        subject: 'Алгоритмизация и программирование(C#)',
        description: 'Реализовать иерархию классов для предметной области. Оформить отчет с блок-схемами и листингом кода.',
        assignedDate: plusDays(-4),
        dueDate: plusDays(1),
        dueTime: '23:59',
        priority: 'high',
        status: 'in_progress',
        subtasks: [
          { id: 'sub_1', title: 'Спроектировать базовый класс и виртуальные методы', completed: true },
          { id: 'sub_2', title: 'Реализовать 3 класса-наследника', completed: true },
          { id: 'sub_3', title: 'Написать юнит-тесты на проверку полиморфизма', completed: false },
          { id: 'sub_4', title: 'Подготовить титульный лист и отчет', completed: false },
        ],
        materialLink: 'https://eios.kosgos.ru',
        notes: 'Сдавать на паре в аудитории Б-208.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'hw_seed_2',
        title: 'Домашнее задание: Теория графов и матрицы смежности',
        subject: 'Дискретная математика',
        description: 'Задачи 14.1 - 14.8 из сборника задач. Найти кратчайшие пути алгоритмом Дейкстры.',
        assignedDate: plusDays(-2),
        dueDate: plusDays(3),
        dueTime: '18:00',
        priority: 'normal',
        status: 'todo',
        subtasks: [
          { id: 'sub_21', title: 'Построить матрицу инцидентности', completed: false },
          { id: 'sub_22', title: 'Выполнить пошаговую трассировку алгоритма', completed: false },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'hw_seed_3',
        title: 'Типовой расчет по пределам и производным',
        subject: 'Математический анализ',
        description: 'Вариант 4. Решить задачи на правило Лопиталя и исследование функции.',
        assignedDate: plusDays(-5),
        dueDate: plusDays(-1), // Overdue for demo
        dueTime: '10:00',
        priority: 'high',
        status: 'todo',
        subtasks: [
          { id: 'sub_31', title: 'Вычислить замечательные пределы', completed: true },
          { id: 'sub_32', title: 'Построить асимптоты графика функции', completed: false },
        ],
        notes: 'Уточнить у преподавателя возможность досрочной сдачи.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'hw_seed_4',
        title: 'Эссе: Роль информационных технологий в цифровой экономике',
        subject: 'Информационные технологии',
        description: 'Объем 3-5 страниц. Рассмотреть тренды облачных вычислений и ИИ в промышленности.',
        assignedDate: plusDays(-7),
        dueDate: plusDays(-2),
        dueTime: '23:59',
        priority: 'low',
        status: 'completed',
        subtasks: [
          { id: 'sub_41', title: 'Собрать литературу и источники', completed: true },
          { id: 'sub_42', title: 'Написать черновик', completed: true },
          { id: 'sub_43', title: 'Проверить на антиплагиат', completed: true },
        ],
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  private static getSeedEvents(): CalendarCustomEvent[] {
    const today = new Date();
    const plusDays = (d: number) => {
      const target = new Date(today);
      target.setDate(today.getDate() + d);
      return formatDateToIso(target);
    };

    return [
      {
        id: 'evt_seed_1',
        title: 'Контрольная точка по математическому анализу',
        type: 'test',
        date: plusDays(4),
        time: '10:10',
        subject: 'Математический анализ',
        room: 'Б-407',
        notes: 'Темы: пределы, непрерывность, производная.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'evt_seed_2',
        title: 'Коллоквиум по алгоритмизации и ООП',
        type: 'colloquium',
        date: plusDays(11),
        time: '11:50',
        subject: 'Алгоритмизация и программирование(C#)',
        room: 'Б-208',
        notes: 'Защита первых трёх лабораторных работ.',
        createdAt: new Date().toISOString(),
      },
    ];
  }
}
