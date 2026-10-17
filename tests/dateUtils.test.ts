import { describe, it, expect } from 'vitest';
import {
  formatDateToIso,
  parseIsoDate,
  formatRussianDate,
  formatDayOfWeek,
  pluralizeRussian,
  formatRelativeDeadline,
  getMondayOfWeek,
  getDaysOfWeek,
  isSameDay,
} from '../src/utils/dateUtils';

describe('dateUtils', () => {
  describe('formatDateToIso & parseIsoDate', () => {
    it('formats a date to YYYY-MM-DD correctly', () => {
      const d = new Date(2026, 8, 1); // Sept 1, 2026
      expect(formatDateToIso(d)).toBe('2026-09-01');
    });

    it('parses pure YYYY-MM-DD string correctly', () => {
      const parsed = parseIsoDate('2026-10-17');
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(9); // 0-indexed October
      expect(parsed.getDate()).toBe(17);
    });

    it('safely parses ISO timestamp with time component without returning NaN', () => {
      const parsed = parseIsoDate('2026-09-01T00:00:00');
      expect(isNaN(parsed.getTime())).toBe(false);
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(8); // September
      expect(parsed.getDate()).toBe(1);
    });

    it('handles malformed or empty inputs gracefully without throwing', () => {
      const fallback = parseIsoDate('');
      expect(fallback instanceof Date).toBe(true);
      expect(isNaN(fallback.getTime())).toBe(false);

      const invalid = parseIsoDate('not-a-date');
      expect(invalid instanceof Date).toBe(true);
      expect(isNaN(invalid.getTime())).toBe(false);
    });
  });

  describe('pluralizeRussian', () => {
    it('correctly handles Russian plurals for days', () => {
      expect(pluralizeRussian(1, 'день', 'дня', 'дней')).toBe('1 день');
      expect(pluralizeRussian(2, 'день', 'дня', 'дней')).toBe('2 дня');
      expect(pluralizeRussian(4, 'день', 'дня', 'дней')).toBe('4 дня');
      expect(pluralizeRussian(5, 'день', 'дня', 'дней')).toBe('5 дней');
      expect(pluralizeRussian(11, 'день', 'дня', 'дней')).toBe('11 дней');
      expect(pluralizeRussian(14, 'день', 'дня', 'дней')).toBe('14 дней');
      expect(pluralizeRussian(21, 'день', 'дня', 'дней')).toBe('21 день');
      expect(pluralizeRussian(22, 'день', 'дня', 'дней')).toBe('22 дня');
      expect(pluralizeRussian(25, 'день', 'дня', 'дней')).toBe('25 дней');
    });
  });

  describe('formatRelativeDeadline', () => {
    it('identifies overdue deadlines in the past with correct pluralization', () => {
      const past = new Date();
      past.setDate(past.getDate() - 3);
      const pastIso = formatDateToIso(past);

      const res = formatRelativeDeadline(pastIso, '18:00');
      expect(res.isOverdue).toBe(true);
      expect(res.label).toBe('Просрочено на 3 дня');
    });

    it('identifies deadlines due tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowIso = formatDateToIso(tomorrow);

      const res = formatRelativeDeadline(tomorrowIso, '12:00');
      expect(res.isDueTomorrow).toBe(true);
      expect(res.isOverdue).toBe(false);
      expect(res.label).toBe('Завтра до 12:00');
    });
  });

  describe('week and day calculations', () => {
    it('calculates the Monday of the week correctly', () => {
      // Wednesday 2026-10-14
      const wednesday = new Date(2026, 9, 14);
      const monday = getMondayOfWeek(wednesday);
      expect(monday.getDay()).toBe(1); // Monday
      expect(formatDateToIso(monday)).toBe('2026-10-12');
    });

    it('generates 6 and 7 days of the week', () => {
      const monday = new Date(2026, 9, 12);
      const sixDays = getDaysOfWeek(monday, false);
      const sevenDays = getDaysOfWeek(monday, true);
      expect(sixDays.length).toBe(6);
      expect(sevenDays.length).toBe(7);
      expect(sixDays[5].getDay()).toBe(6); // Saturday
      expect(sevenDays[6].getDay()).toBe(0); // Sunday
    });

    it('identifies identical days correctly regardless of time', () => {
      const d1 = new Date(2026, 9, 17, 8, 30);
      const d2 = new Date(2026, 9, 17, 23, 59);
      const d3 = new Date(2026, 9, 18, 8, 30);
      expect(isSameDay(d1, d2)).toBe(true);
      expect(isSameDay(d1, d3)).toBe(false);
    });
  });
});
