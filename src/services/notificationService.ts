import { ParsedLesson } from '../types/schedule';
import { Homework } from '../types/homework';
import { UserSettings } from '../types/settings';
import { parseIsoDate } from '../utils/dateUtils';

export class NotificationService {
  /**
   * Check if the browser supports notifications
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Current permission status
   */
  static getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Request permission from the user
   */
  static async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Play a clean Apple-inspired sound chime using Web Audio API
   */
  static playChime(): void {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      // Pleasant high chime: 880Hz (A5) then 1318.5Hz (E6)
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.15);

      osc2.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.6);
      osc2.stop(ctx.currentTime + 0.6);
    } catch {
      // Audio might be blocked before user interaction
    }
  }

  /**
   * Show a system notification
   */
  static showNotification(title: string, options?: NotificationOptions): boolean {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    try {
      this.playChime();
      new Notification(title, {
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23007AFF"/><path d="M30 35h40M30 50h40M30 65h25" stroke="white" stroke-width="8" stroke-linecap="round"/></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23007AFF"/></svg>',
        ...options,
      });
      return true;
    } catch (e) {
      console.warn('Failed to display notification', e);
      return false;
    }
  }

  /**
   * Trigger a test notification
   */
  static sendTestNotification(): boolean {
    return this.showNotification('КГУ Расписание & Задачи', {
      body: 'Уведомления успешно настроены! Вы будете получать напоминания о парах и дедлайнах.',
      tag: 'test-notification',
    });
  }

  /**
   * Check and send reminders for upcoming lessons and homework deadlines.
   * Uses sessionStorage to prevent duplicate alerts within the same session/day.
   */
  static checkAndSendReminders(
    todayLessons: ParsedLesson[],
    homeworkItems: Homework[],
    settings: UserSettings
  ): void {
    if (!this.isSupported() || Notification.permission !== 'granted') return;
    if (!settings.notifications || !settings.notifications.enabled) return;

    const now = new Date();
    const nowMs = now.getTime();

    // 1. Check upcoming lessons
    const reminderMinutes = settings.notifications.lessonReminderMinutes || 15;
    for (const lesson of todayLessons) {
      if (!lesson.startDateTime) continue;
      const startMs = lesson.startDateTime.getTime();
      const diffMinutes = Math.round((startMs - nowMs) / (60 * 1000));

      // If lesson starts in <= reminderMinutes (e.g. 15 min) and > 0 min
      if (diffMinutes > 0 && diffMinutes <= reminderMinutes) {
        const alertKey = `alert_lesson_${lesson.id}_${lesson.dateStr}`;
        if (!sessionStorage.getItem(alertKey)) {
          sessionStorage.setItem(alertKey, '1');
          this.showNotification(`Пара через ${diffMinutes} мин: ${lesson.subject}`, {
            body: `${lesson.pairNumber}-я пара • ${lesson.building}, ${lesson.auditorium}\nПреподаватель: ${lesson.teacher}`,
            tag: alertKey,
          });
        }
      }
    }

    // 2. Check homework deadlines
    const hwReminderHours = settings.notifications.homeworkReminderHours || 24;
    for (const hw of homeworkItems) {
      if (hw.status === 'completed') continue;
      const deadlineDate = parseIsoDate(hw.dueDate);
      const [h, m] = (hw.dueTime || '23:59').split(':').map(Number);
      deadlineDate.setHours(h || 23, m || 59, 0, 0);

      const diffHours = (deadlineDate.getTime() - nowMs) / (1000 * 60 * 60);

      // Warning if due within hwReminderHours and not expired
      if (diffHours > 0 && diffHours <= hwReminderHours) {
        const alertKey = `alert_hw_due_${hw.id}_${hw.dueDate}`;
        if (!sessionStorage.getItem(alertKey)) {
          sessionStorage.setItem(alertKey, '1');
          const hoursLeft = Math.ceil(diffHours);
          this.showNotification(`Дедлайн по заданию: ${hw.title}`, {
            body: `${hw.subject} • Осталось ${hoursLeft} ч (до ${hw.dueTime})`,
            tag: alertKey,
          });
        }
      }

      // Overdue alert if enabled
      if (settings.notifications.overdueAlert && diffHours < 0 && diffHours > -48) {
        const alertKey = `alert_hw_overdue_${hw.id}`;
        if (!sessionStorage.getItem(alertKey)) {
          sessionStorage.setItem(alertKey, '1');
          this.showNotification(`Просрочено задание: ${hw.title}`, {
            body: `${hw.subject} • Срок сдачи истек (${hw.dueDate})`,
            tag: alertKey,
          });
        }
      }
    }
  }
}
