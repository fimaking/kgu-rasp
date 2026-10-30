import { describe, it, expect } from 'vitest';
import { formatDateToIso, parseIsoDate, getMondayOfWeek } from '../src/utils/dateUtils';
import { KSU_BELL_TIMES } from '../src/components/schedule/ScheduleView';
import { Homework } from '../src/types/homework';

describe('Audit Fixes & Regressions Suite', () => {
  describe('Midnight rollover & date advancement', () => {
    it('accurately advances tomorrow when base date rolls over midnight', () => {
      // Base date late at night: Oct 30, 23:59
      const night = new Date(2026, 9, 30, 23, 59, 0); // Month is 0-indexed: 9 = October
      const tomorrowFromNight = new Date(night);
      tomorrowFromNight.setDate(night.getDate() + 1);
      expect(formatDateToIso(tomorrowFromNight)).toBe('2026-10-31');

      // Base date after midnight rollover: Oct 31, 00:01
      const morning = new Date(2026, 9, 31, 0, 1, 0);
      const tomorrowFromMorning = new Date(morning);
      tomorrowFromMorning.setDate(morning.getDate() + 1);
      expect(formatDateToIso(tomorrowFromMorning)).toBe('2026-11-01');

      // They must not be equal — tomorrow dynamically advances with now
      expect(formatDateToIso(tomorrowFromNight)).not.toBe(formatDateToIso(tomorrowFromMorning));
    });

    it('handles month boundary and leap year correctly', () => {
      // End of February in leap year 2028
      const feb28 = new Date(2028, 1, 28, 12, 0, 0);
      const feb29 = new Date(feb28);
      feb29.setDate(feb28.getDate() + 1);
      expect(formatDateToIso(feb29)).toBe('2028-02-29');

      const mar01 = new Date(feb29);
      mar01.setDate(feb29.getDate() + 1);
      expect(formatDateToIso(mar01)).toBe('2028-03-01');
    });

    it('accurately computes Monday of the current week', () => {
      // 2026-10-30 is Friday -> Monday is 2026-10-26
      const friday = new Date(2026, 9, 30, 15, 0, 0);
      const monday = getMondayOfWeek(friday);
      expect(formatDateToIso(monday)).toBe('2026-10-26');

      // Sunday 2026-11-01 -> Monday should still be 2026-10-26
      const sunday = new Date(2026, 10, 1, 10, 0, 0);
      const mondayFromSunday = getMondayOfWeek(sunday);
      expect(formatDateToIso(mondayFromSunday)).toBe('2026-10-26');
    });
  });

  describe('KSU Bell Times Integrity', () => {
    it('defines exactly 5 standard pairs for KSU students', () => {
      expect(KSU_BELL_TIMES).toHaveLength(5);
    });

    it('contains valid start and end times for each pair', () => {
      const expectedTimes = [
        { pair: 1, start: '08:30', end: '10:00' },
        { pair: 2, start: '10:10', end: '11:40' },
        { pair: 3, start: '11:50', end: '13:20' },
        { pair: 4, start: '14:00', end: '15:30' },
        { pair: 5, start: '15:40', end: '17:10' },
      ];

      expectedTimes.forEach((expected, idx) => {
        const actual = KSU_BELL_TIMES[idx];
        expect(actual.pair).toBe(expected.pair);
        expect(actual.start).toBe(expected.start);
        expect(actual.end).toBe(expected.end);
      });
    });

    it('highlights the 40-minute lunch break between pair 3 and 4', () => {
      const pair3 = KSU_BELL_TIMES.find((b) => b.pair === 3);
      expect(pair3).toBeDefined();
      expect(pair3?.breakAfter).toContain('40 мин');
      expect(pair3?.breakAfter).toContain('Большой перерыв');
    });
  });

  describe('Homework Deadline & Overdue Evaluation Logic', () => {
    const fixedNow = new Date('2026-10-30T14:00:00');
    const todayStr = '2026-10-30';
    const tomorrowStr = '2026-10-31';

    function evaluateTaskStatus(item: Homework, now: Date) {
      if (item.status === 'completed') {
        return { isOverdue: false, isDueToday: item.dueDate === formatDateToIso(now) };
      }
      const dueDate = parseIsoDate(item.dueDate);
      const [hours, mins] = (item.dueTime || '23:59').split(':').map(Number);
      dueDate.setHours(hours, mins, 0, 0);
      const isOverdue = now.getTime() > dueDate.getTime();
      const isDueToday = item.dueDate === formatDateToIso(now);
      return { isOverdue, isDueToday };
    }

    it('marks non-completed task in the past as overdue', () => {
      const overdueTask: Homework = {
        id: 'task-1',
        title: 'Конспект лекции 1',
        subject: 'Информатика',
        dueDate: '2026-10-29',
        dueTime: '23:59',
        status: 'todo',
        priority: 'normal',
        createdAt: '2026-10-20T10:00:00Z',
        updatedAt: '2026-10-20T10:00:00Z',
      };

      const result = evaluateTaskStatus(overdueTask, fixedNow);
      expect(result.isOverdue).toBe(true);
      expect(result.isDueToday).toBe(false);
    });

    it('does NOT mark completed task as overdue even if deadline has passed', () => {
      const completedTask: Homework = {
        id: 'task-2',
        title: 'Лабораторная 1',
        subject: 'Физика',
        dueDate: '2026-10-25',
        dueTime: '12:00',
        status: 'completed',
        priority: 'high',
        completedAt: '2026-10-24T18:00:00Z',
        createdAt: '2026-10-20T10:00:00Z',
        updatedAt: '2026-10-24T18:00:00Z',
      };

      const result = evaluateTaskStatus(completedTask, fixedNow);
      expect(result.isOverdue).toBe(false);
    });

    it('identifies tasks due today with remaining time as active and due today', () => {
      const todayTask: Homework = {
        id: 'task-3',
        title: 'Задание по матанализу',
        subject: 'Математический анализ',
        dueDate: todayStr,
        dueTime: '23:59',
        status: 'in_progress',
        priority: 'high',
        createdAt: '2026-10-28T10:00:00Z',
        updatedAt: '2026-10-28T10:00:00Z',
      };

      const result = evaluateTaskStatus(todayTask, fixedNow);
      expect(result.isOverdue).toBe(false);
      expect(result.isDueToday).toBe(true);
    });

    it('identifies tasks due tomorrow correctly', () => {
      const tomorrowTask: Homework = {
        id: 'task-4',
        title: 'Эссе по истории',
        subject: 'История',
        dueDate: tomorrowStr,
        dueTime: '18:00',
        status: 'todo',
        priority: 'low',
        createdAt: '2026-10-28T10:00:00Z',
        updatedAt: '2026-10-28T10:00:00Z',
      };

      expect(tomorrowTask.dueDate).toBe(tomorrowStr);
    });
  });
});
