import { describe, it, expect } from 'vitest';
import {
  parseLessonType,
  cleanSubjectName,
  parseSubgroup,
  isUserLesson,
  filterLessonsBySubgroup,
  parseBuildingAndAuditorium,
  parseKsuDateTime,
  findNextLessonForSubject,
  getNextLessonDeadline,
  formatTeacherName,
  sanitizeUrl,
} from '../src/utils/scheduleParser';
import { ScheduleService } from '../src/services/scheduleService';
import { SyncService } from '../src/services/syncService';
import { KSU_BELL_TIMES } from '../src/components/schedule/ScheduleView';
import { ParsedLesson, RawRaspItem } from '../types/schedule';

describe('scheduleParser', () => {
  describe('parseLessonType', () => {
    it('correctly detects lecture, practice, lab, exam, and credit', () => {
      expect(parseLessonType('лек Информатика').type).toBe('lecture');
      expect(parseLessonType('пр Иностранный язык').type).toBe('practice');
      expect(parseLessonType('лаб Компьютерные сети').type).toBe('lab');
      expect(parseLessonType('экз Философия').type).toBe('exam');
      expect(parseLessonType('зач Основы права').type).toBe('credit');
      expect(parseLessonType('Консультация').type).toBe('other');
    });

    it('handles undefined and empty string gracefully', () => {
      expect(parseLessonType('').type).toBe('other');
      expect(parseLessonType(undefined).type).toBe('other');
    });
  });

  describe('cleanSubjectName', () => {
    it('strips lesson type prefixes and subgroup suffixes', () => {
      expect(cleanSubjectName('лек Архитектура ЭВМ')).toBe('Архитектура ЭВМ');
      expect(cleanSubjectName('лаб Базы данных, п/г 1')).toBe('Базы данных');
      expect(cleanSubjectName('пр Иностранный язык (п/г 2)')).toBe('Иностранный язык');
    });

    it('handles empty strings and nullish values', () => {
      expect(cleanSubjectName('')).toBe('Без названия');
      expect(cleanSubjectName(undefined)).toBe('Без названия');
    });
  });

  describe('parseSubgroup', () => {
    it('extracts subgroup from raw number or discipline text', () => {
      const itemWithNum: RawRaspItem = {
        код: 1,
        дата: '2026-10-17',
        датаНачала: '2026-10-17T08:30:00',
        датаОкончания: '2026-10-17T10:00:00',
        начало: '08:30',
        конец: '10:00',
        деньНедели: 6,
        день_недели: 'Суббота',
        дисциплина: 'лаб Физика',
        номерПодгруппы: 2,
      } as any;
      expect(parseSubgroup(itemWithNum)).toBe(2);

      const itemWithText: RawRaspItem = {
        ...itemWithNum,
        номерПодгруппы: 0,
        дисциплина: 'лаб Химия, п/г 1',
      };
      expect(parseSubgroup(itemWithText)).toBe(1);

      const generalItem: RawRaspItem = {
        ...itemWithNum,
        номерПодгруппы: 0,
        дисциплина: 'лек Математика',
      };
      expect(parseSubgroup(generalItem)).toBe(0);
    });
  });

  describe('isUserLesson filter', () => {
    it('preserves entire group and subgroup 1 lessons', () => {
      expect(isUserLesson({ rawDiscipline: 'лек Математика', subgroup: 0 })).toBe(true);
      expect(isUserLesson({ rawDiscipline: 'лаб Физика', subgroup: 1 })).toBe(true);
    });

    it('filters out subgroup 2 lessons', () => {
      expect(isUserLesson({ rawDiscipline: 'лаб Физика', subgroup: 2 })).toBe(false);
    });

    it('enforces German language preference for user', () => {
      expect(isUserLesson({ rawDiscipline: 'пр Иностранный язык (немецкий)' })).toBe(true);
      expect(isUserLesson({ rawDiscipline: 'пр Иностранный язык (английский 1)' })).toBe(false);
      expect(isUserLesson({ rawDiscipline: 'пр Английский язык' })).toBe(false);
      expect(isUserLesson({ rawDiscipline: 'пр Французский язык' })).toBe(false);
    });
  });

  describe('filterLessonsBySubgroup across any group', () => {
    it('returns true for all lessons when subgroupPreference is 0 (all subgroups)', () => {
      expect(filterLessonsBySubgroup({ rawDiscipline: 'лаб Физика', subgroup: 1 }, 0, 8611)).toBe(true);
      expect(filterLessonsBySubgroup({ rawDiscipline: 'лаб Физика', subgroup: 2 }, 0, 8611)).toBe(true);
      expect(filterLessonsBySubgroup({ rawDiscipline: 'лек Математика', subgroup: 0 }, 0, 8611)).toBe(true);
    });

    it('filters for subgroup 1 or subgroup 2 correctly for any group', () => {
      // Subgroup 1 preference:
      expect(filterLessonsBySubgroup({ rawDiscipline: 'лаб Физика', subgroup: 1 }, 1, 8611)).toBe(true);
      expect(filterLessonsBySubgroup({ rawDiscipline: 'лаб Физика', subgroup: 2 }, 1, 8611)).toBe(false);
      expect(filterLessonsBySubgroup({ rawDiscipline: 'лек Математика', subgroup: 0 }, 1, 8611)).toBe(true);

      // Subgroup 2 preference:
      expect(filterLessonsBySubgroup({ rawDiscipline: 'лаб Физика', subgroup: 1 }, 2, 8611)).toBe(false);
      expect(filterLessonsBySubgroup({ rawDiscipline: 'лаб Физика', subgroup: 2 }, 2, 8611)).toBe(true);
      expect(filterLessonsBySubgroup({ rawDiscipline: 'лек Математика', subgroup: 0 }, 2, 8611)).toBe(true);
    });

    it('filters foreign language dynamically across any group (not only 8953)', () => {
      // Group 8611 with English preference:
      expect(
        filterLessonsBySubgroup(
          { rawDiscipline: 'пр Иностранный язык (английский)', subgroup: 1 },
          1,
          8611,
          'en'
        )
      ).toBe(true);
      expect(
        filterLessonsBySubgroup(
          { rawDiscipline: 'пр Иностранный язык (немецкий)', subgroup: 1 },
          1,
          8611,
          'en'
        )
      ).toBe(false);

      // Group 8611 with French preference:
      expect(
        filterLessonsBySubgroup(
          { rawDiscipline: 'пр Французский язык', subgroup: 1 },
          1,
          8611,
          'fr'
        )
      ).toBe(true);
    });

    it('loads all 381 available groups from ScheduleService.getAvailableGroups', () => {
      const groups = ScheduleService.getAvailableGroups();
      expect(Array.isArray(groups)).toBe(true);
      expect(groups.length).toBe(381);
      const isbo4 = groups.find((g) => g.id === 8953);
      expect(isbo4).toBeDefined();
      expect(isbo4?.name).toBe('26-ИСбо-4');
      expect(isbo4?.facul).toBe('ИВИТШ');
    });
  });

  describe('parseBuildingAndAuditorium', () => {
    it('resolves KSU buildings and auditoriums correctly', () => {
      expect(parseBuildingAndAuditorium('Б-105')).toEqual({
        building: 'Корпус «Б»',
        auditorium: 'ауд. 105',
      });
      expect(parseBuildingAndAuditorium('Гл-240(3)')).toEqual({
        building: 'Главный корпус',
        auditorium: 'ауд. 240(3)',
      });
      expect(parseBuildingAndAuditorium('СДО')).toEqual({
        building: 'Дистанционно',
        auditorium: 'СДО КГУ',
      });
      expect(parseBuildingAndAuditorium('')).toEqual({
        building: 'КГУ',
        auditorium: 'Не указана',
      });
      expect(parseBuildingAndAuditorium('А-302')).toEqual({
        building: 'Корпус «А»',
        auditorium: 'ауд. 302',
      });
      expect(parseBuildingAndAuditorium('Д-101')).toEqual({
        building: 'Корпус «Д»',
        auditorium: 'ауд. 101',
      });
      expect(parseBuildingAndAuditorium('Ж-205')).toEqual({
        building: 'Корпус «Ж»',
        auditorium: 'ауд. 205',
      });
      expect(parseBuildingAndAuditorium('СК')).toEqual({
        building: 'Спорткомплекс КГУ',
        auditorium: 'Спортзал',
      });
      expect(parseBuildingAndAuditorium('СК-1')).toEqual({
        building: 'Спорткомплекс КГУ',
        auditorium: 'зал 1',
      });
    });
  });

  describe('parseKsuDateTime', () => {
    it('accurately parses standard ISO datetime from KSU API', () => {
      const dt = parseKsuDateTime('2026-10-17T10:10:00');
      expect(dt.getFullYear()).toBe(2026);
      expect(dt.getMonth()).toBe(9); // Oct
      expect(dt.getDate()).toBe(17);
      expect(dt.getHours()).toBe(10);
      expect(dt.getMinutes()).toBe(10);
    });

    it('falls back to date and time strings if iso timestamp is missing or malformed', () => {
      const dt = parseKsuDateTime(undefined, '2026-10-17', '14:20');
      expect(dt.getFullYear()).toBe(2026);
      expect(dt.getDate()).toBe(17);
      expect(dt.getHours()).toBe(14);
      expect(dt.getMinutes()).toBe(20);
    });
  });

  describe('findNextLessonForSubject & getNextLessonDeadline', () => {
    const mockLessons: ParsedLesson[] = [
      {
        id: 101,
        dateStr: '2026-10-17',
        startTime: '10:10',
        endTime: '11:40',
        startDateTime: new Date(2026, 9, 17, 10, 10),
        endDateTime: new Date(2026, 9, 17, 11, 40),
        pairNumber: 2,
        subject: 'Базы данных',
        type: 'lab',
      } as any,
      {
        id: 102,
        dateStr: '2026-10-24',
        startTime: '10:10',
        endTime: '11:40',
        startDateTime: new Date(2026, 9, 24, 10, 10),
        endDateTime: new Date(2026, 9, 24, 11, 40),
        pairNumber: 2,
        subject: 'Базы данных',
        type: 'lab',
      } as any,
    ];

    it('finds the next lesson for the given subject and calculates deadline', () => {
      const current = mockLessons[0];
      const next = findNextLessonForSubject(current, mockLessons);
      expect(next).not.toBeNull();
      expect(next?.id).toBe(102);

      const deadline = getNextLessonDeadline(current, mockLessons);
      expect(deadline.dueDate).toBe('2026-10-24');
      expect(deadline.dueTime).toBe('10:10');
      expect(deadline.nextLesson?.id).toBe(102);
    });

    it('falls back to 7 days later if no subsequent lesson is scheduled', () => {
      const isolated: ParsedLesson = {
        id: 201,
        dateStr: '2026-10-17',
        startTime: '12:00',
        endTime: '13:30',
        startDateTime: new Date(2026, 9, 17, 12, 0),
        endDateTime: new Date(2026, 9, 17, 13, 30),
        pairNumber: 3,
        subject: 'Спецкурс',
        type: 'lecture',
      } as any;

      const deadline = getNextLessonDeadline(isolated, [isolated]);
      expect(deadline.dueDate).toBe('2026-10-24');
      expect(deadline.dueTime).toBe('12:00');
      expect(deadline.nextLesson).toBeNull();
    });
  });

  describe('formatTeacherName', () => {
    it('returns full name unchanged when useInitials is false', () => {
      expect(formatTeacherName('Иванов Иван Иванович', false)).toBe('Иванов Иван Иванович');
      expect(formatTeacherName('Петрова Анна', false)).toBe('Петрова Анна');
    });

    it('formats full 3-part names into compact initials', () => {
      expect(formatTeacherName('Иванов Иван Иванович', true)).toBe('Иванов И. И.');
      expect(formatTeacherName('Смирнова Елена Сергеевна', true)).toBe('Смирнова Е. С.');
    });

    it('formats 2-part names into compact single initial', () => {
      expect(formatTeacherName('Петрова Анна', true)).toBe('Петрова А.');
    });

    it('handles single word or missing teacher gracefully', () => {
      expect(formatTeacherName('Иванов', true)).toBe('Иванов');
      expect(formatTeacherName('Преподаватель не указан', true)).toBe('Преподаватель не указан');
      expect(formatTeacherName(undefined, true)).toBe('Преподаватель не указан');
    });
  });

  describe('sanitizeUrl', () => {
    it('allows valid http, https, and mailto links', () => {
      expect(sanitizeUrl('https://eios.kosgos.ru/')).toBe('https://eios.kosgos.ru/');
      expect(sanitizeUrl('http://ksu.edu.ru')).toBe('http://ksu.edu.ru');
      expect(sanitizeUrl('mailto:teacher@ksu.edu.ru')).toBe('mailto:teacher@ksu.edu.ru');
    });

    it('auto-prefixes raw domain names with https://', () => {
      expect(sanitizeUrl('sferum.ru/j/123')).toBe('https://sferum.ru/j/123');
      expect(sanitizeUrl('zoom.us/my/room')).toBe('https://zoom.us/my/room');
    });

    it('blocks dangerous xss javascript and data urls', () => {
      expect(sanitizeUrl('javascript:alert(document.cookie)')).toBeNull();
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
      expect(sanitizeUrl('vbscript:msgbox(1)')).toBeNull();
      expect(sanitizeUrl('')).toBeNull();
      expect(sanitizeUrl(undefined)).toBeNull();
    });
  });

  describe('SyncService offline QR generation', () => {
    it('generates a valid client-side data URI base64 image in memory', async () => {
      const targetUrl = 'https://ksu-student.app#firebase=https://test.firebaseio.com/sync.json';
      const dataUri = await SyncService.getQrCodeDataUrl(targetUrl);
      expect(typeof dataUri).toBe('string');
      expect(dataUri.startsWith('data:image/png;base64,')).toBe(true);
      expect(dataUri.length).toBeGreaterThan(100);
    });
  });

  describe('KSU_BELL_TIMES', () => {
    it('contains exactly 5 pairs according to official KSU schedule', () => {
      expect(KSU_BELL_TIMES.length).toBe(5);
      expect(KSU_BELL_TIMES.map((b) => b.pair)).toEqual([1, 2, 3, 4, 5]);
    });

    it('matches exact pair start and end times from KSU', () => {
      expect(KSU_BELL_TIMES[0]).toMatchObject({ pair: 1, start: '08:30', end: '10:00' });
      expect(KSU_BELL_TIMES[1]).toMatchObject({ pair: 2, start: '10:10', end: '11:40' });
      expect(KSU_BELL_TIMES[2]).toMatchObject({ pair: 3, start: '11:50', end: '13:20' });
      expect(KSU_BELL_TIMES[3]).toMatchObject({ pair: 4, start: '14:00', end: '15:30' });
      expect(KSU_BELL_TIMES[4]).toMatchObject({ pair: 5, start: '15:40', end: '17:10' });
    });

    it('sets a 40-minute big break after the 3rd pair (13:20 to 14:00)', () => {
      expect(KSU_BELL_TIMES[2].breakAfter).toContain('40 мин');
      expect(KSU_BELL_TIMES[2].breakAfter).toContain('14:00');
    });
  });
});
