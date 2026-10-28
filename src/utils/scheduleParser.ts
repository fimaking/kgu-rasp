import { RawRaspItem, ParsedLesson, LessonType } from '../types/schedule';
import { formatDateToIso, parseIsoDate } from './dateUtils';

export function parseKsuDateTime(isoDateTimeStr?: string, fallbackDateStr?: string, fallbackTime?: string): Date {
  if (isoDateTimeStr && typeof isoDateTimeStr === 'string') {
    const parts = isoDateTimeStr.split('T');
    if (parts.length === 2) {
      const [y, m, d] = parts[0].split('-').map(Number);
      const [h, min, s] = parts[1].split(':').map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m - 1, d, h || 0, min || 0, s || 0);
      }
    }
    const d = new Date(isoDateTimeStr);
    if (!isNaN(d.getTime())) return d;
  }
  if (fallbackDateStr) {
    const base = parseIsoDate(fallbackDateStr);
    if (fallbackTime && fallbackTime.includes(':')) {
      const [h, min] = fallbackTime.split(':').map(Number);
      base.setHours(h || 0, min || 0, 0, 0);
    }
    return base;
  }
  return new Date();
}

export function parseLessonType(rawDiscipline?: string): { type: LessonType; label: string } {
  const d = (rawDiscipline || '').trim().toLowerCase();
  if (d.startsWith('лек')) {
    return { type: 'lecture', label: 'Лекция' };
  }
  if (d.startsWith('пр')) {
    return { type: 'practice', label: 'Практика' };
  }
  if (d.startsWith('лаб')) {
    return { type: 'lab', label: 'Лабораторная' };
  }
  if (d.startsWith('экз') || d.includes('экзамен')) {
    return { type: 'exam', label: 'Экзамен' };
  }
  if (d.startsWith('зач') || d.includes('зачет') || d.includes('зачёт')) {
    return { type: 'credit', label: 'Зачёт' };
  }
  return { type: 'other', label: 'Занятие' };
}

export function cleanSubjectName(rawDiscipline?: string): string {
  let cleaned = (rawDiscipline || '').trim();

  // Strip prefix like "лек ", "пр ", "лаб ", "зач ", "экз "
  cleaned = cleaned.replace(/^(?:лек|пр|лаб|экз|зач)\s+/i, '');

  // Strip trailing subgroup mentions like ", п/г 1", ", п/г 2", "(п/г 1)"
  cleaned = cleaned.replace(/,\s*п\/г\s*\d+/gi, '');
  cleaned = cleaned.replace(/\(п\/г\s*\d+\)/gi, '');
  cleaned = cleaned.trim();

  return cleaned || 'Без названия';
}

export function parseSubgroup(item: { номерПодгруппы?: number; дисциплина?: string; rawDiscipline?: string }): number {
  if (item.номерПодгруппы && item.номерПодгруппы > 0) {
    return item.номерПодгруппы;
  }
  const d = (item.дисциплина || item.rawDiscipline || '').toLowerCase();
  if (d.includes('п/г 1') || d.includes('1 п/г') || d.includes('подгруппа 1')) return 1;
  if (d.includes('п/г 2') || d.includes('2 п/г') || d.includes('подгруппа 2')) return 2;
  return 0; // Entire group
}

/**
 * Filter lessons by subgroup preference (0 = all, 1 = sub 1, 2 = sub 2)
 * For user's default group 8953 (26-ИСбо-4), preserves German language preference.
 */
export function filterLessonsBySubgroup(
  lesson: {
    rawDiscipline?: string;
    дисциплина?: string;
    subgroup?: number;
    номерПодгруппы?: number;
  },
  subgroupPreference: number = 0,
  _groupId: number = 8953,
  foreignLangPreference: 'all' | 'de' | 'en' | 'fr' = 'de'
): boolean {
  const rawDiscipline = (lesson.rawDiscipline || lesson.дисциплина || '').toLowerCase();

  // Filter by user's chosen foreign language across all groups
  if (foreignLangPreference !== 'all') {
    const isForeignLang =
      rawDiscipline.includes('иностранный язык') ||
      rawDiscipline.includes('англ') ||
      rawDiscipline.includes('франц') ||
      rawDiscipline.includes('немец');

    if (isForeignLang) {
      if (foreignLangPreference === 'de' && !rawDiscipline.includes('немец')) return false;
      if (foreignLangPreference === 'en' && !rawDiscipline.includes('англ')) return false;
      if (foreignLangPreference === 'fr' && !rawDiscipline.includes('франц')) return false;
    }
  }

  if (subgroupPreference === 0) {
    return true; // Show all subgroups
  }

  const sg =
    typeof lesson.subgroup === 'number'
      ? lesson.subgroup
      : parseSubgroup(lesson as RawRaspItem);

  return sg === 0 || sg === subgroupPreference;
}

/**
 * Personalization filter: User attends 1st subgroup and German language only.
 */
export function isUserLesson(lesson: {
  rawDiscipline?: string;
  дисциплина?: string;
  subgroup?: number;
  номерПодгруппы?: number;
}): boolean {
  return filterLessonsBySubgroup(lesson, 1, 8953, 'de');
}

/**
 * Sanitize external URLs to prevent javascript: or data: XSS execution
 */
export function sanitizeUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^(?:https?|mailto):/i.test(trimmed)) {
    return trimmed;
  }
  if (/^[a-zA-Z0-9][-a-zA-Z0-9+&@#/%?=~_|!:,.;]*\.[a-zA-Z]{2,}/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return null;
}

export function parseBuildingAndAuditorium(rawAud: string): { building: string; auditorium: string } {
  if (!rawAud || rawAud.trim() === '') {
    return { building: 'КГУ', auditorium: 'Не указана' };
  }
  const aud = rawAud.trim();
  const audUpper = aud.toUpperCase();

  if (audUpper === 'СДО' || audUpper.startsWith('СДО ')) {
    return { building: 'Дистанционно', auditorium: 'СДО КГУ' };
  }
  if (audUpper.startsWith('ГЛ-')) {
    return { building: 'Главный корпус', auditorium: `ауд. ${aud.slice(3).trim()}` };
  }
  if (audUpper.startsWith('СК-') || audUpper === 'СК' || audUpper.startsWith('СК ')) {
    const rest = aud.replace(/^ск-?\s*/i, '').trim();
    return { building: 'Спорткомплекс КГУ', auditorium: rest ? `зал ${rest}` : 'Спортзал' };
  }

  // Dynamic detection of single-letter buildings: А-, Б-, В-, Г-, Д-, Е-, Ж-, З- etc.
  const singleLetterMatch = aud.match(/^([А-ЯЁA-Z])-(\d+.*)$/i);
  if (singleLetterMatch) {
    const letter = singleLetterMatch[1].toUpperCase();
    return { building: `Корпус «${letter}»`, auditorium: `ауд. ${singleLetterMatch[2].trim()}` };
  }

  return { building: 'Корпус КГУ', auditorium: aud };
}

export function getLessonBadgeColors(type: LessonType): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (type) {
    case 'lecture':
      return {
        bg: 'bg-blue-500/10 dark:bg-blue-500/15',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-500/20 dark:border-blue-400/25',
        dot: 'bg-blue-500',
      };
    case 'practice':
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-500/20 dark:border-emerald-400/25',
        dot: 'bg-emerald-500',
      };
    case 'lab':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/15',
        text: 'text-amber-800 dark:text-amber-300',
        border: 'border-amber-500/25 dark:border-amber-400/30',
        dot: 'bg-amber-500',
      };
    case 'exam':
    case 'credit':
      return {
        bg: 'bg-rose-500/10 dark:bg-rose-500/15',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-500/20 dark:border-rose-400/25',
        dot: 'bg-rose-500',
      };
    default:
      return {
        bg: 'bg-purple-500/10 dark:bg-purple-500/15',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-500/20 dark:border-purple-400/25',
        dot: 'bg-purple-500',
      };
  }
}

export function parseRawRaspItem(item: RawRaspItem): ParsedLesson {
  const { type, label } = parseLessonType(item.дисциплина || '');
  const subject = cleanSubjectName(item.дисциплина || 'Без названия');
  const subgroup = parseSubgroup(item);
  const { building, auditorium } = parseBuildingAndAuditorium(item.аудитория || '');
  const badgeColors = getLessonBadgeColors(type);

  // Parse start / end dates safely
  const startDateTime = parseKsuDateTime(item.датаНачала, item.дата, item.начало);
  const endDateTime = parseKsuDateTime(item.датаОкончания, item.дата, item.конец);
  const dateStr = formatDateToIso(startDateTime);

  return {
    id: item.код,
    dateStr,
    rawDate: item.дата,
    startTime: item.начало,
    endTime: item.конец,
    startDateTime,
    endDateTime,
    pairNumber: item.номерЗанятия,
    dayOfWeek: item.деньНедели,
    dayName: item.день_недели,
    subject,
    rawDiscipline: item.дисциплина,
    type,
    typeLabel: label,
    typeBadgeColor: badgeColors,
    teacher: item.фиоПреподавателя || item.преподаватель || 'Преподаватель не указан',
    auditorium,
    building,
    subgroup,
    isReplacement: Boolean(item.замена),
    link: sanitizeUrl(item.ссылка),
    customNote: item.custom1 || undefined,
  };
}

// Check pair status right now
export function getLessonStatus(lesson: ParsedLesson, now = new Date()): {
  status: 'passed' | 'current' | 'upcoming';
  minutesUntilStart: number;
  minutesUntilEnd: number;
  badgeText: string;
} {
  const nowMs = now.getTime();
  const startMs = lesson.startDateTime.getTime();
  const endMs = lesson.endDateTime.getTime();

  if (nowMs > endMs) {
    return {
      status: 'passed',
      minutesUntilStart: 0,
      minutesUntilEnd: 0,
      badgeText: 'Завершено',
    };
  }

  if (nowMs >= startMs && nowMs <= endMs) {
    const minsLeft = Math.round((endMs - nowMs) / (1000 * 60));
    return {
      status: 'current',
      minutesUntilStart: 0,
      minutesUntilEnd: minsLeft,
      badgeText: `Идёт сейчас (осталось ${minsLeft} мин)`,
    };
  }

  const minsUntil = Math.round((startMs - nowMs) / (1000 * 60));
  let badgeText = `Через ${minsUntil} мин`;
  if (minsUntil > 60) {
    const hours = Math.floor(minsUntil / 60);
    const mins = minsUntil % 60;
    badgeText = `Через ${hours} ч ${mins > 0 ? `${mins} мин` : ''}`;
  }

  return {
    status: 'upcoming',
    minutesUntilStart: minsUntil,
    minutesUntilEnd: 0,
    badgeText,
  };
}

/**
 * Filters today's lessons list:
 * - Each finished pair remains in the list for 10 minutes after ending (marked as "Завершено"),
 *   and is then removed (now >= endDateTime + 10 minutes).
 * - Upcoming and ongoing pairs remain in the list.
 * - When all pairs have ended and their 10 minutes elapsed, the returned array is empty.
 */
export function filterVisibleTodayLessons(
  lessons: ParsedLesson[],
  now: Date = new Date()
): ParsedLesson[] {
  if (!lessons || lessons.length === 0) return [];

  const nowMs = now.getTime();
  const TEN_MINUTES_MS = 10 * 60 * 1000;

  return lessons.filter((lesson) => {
    const endMs = lesson.endDateTime.getTime();
    // A lesson disappears 10 minutes after it finishes
    return nowMs < endMs + TEN_MINUTES_MS;
  });
}

/**
 * Find the next upcoming lesson for a specific subject after the given lesson.
 * Respects lesson type:
 * - Lab matches the next Lab
 * - Practice matches the next Practice
 * - Lecture matches the next Lecture
 */
export function findNextLessonForSubject(
  currentLesson: ParsedLesson,
  allLessons: ParsedLesson[]
): ParsedLesson | null {
  const targetSubject = currentLesson.subject.trim().toLowerCase();
  const currentType = currentLesson.type;

  // 1. Strict match: same subject AND same lesson type on a future day
  const futureSameTypeLessons = allLessons
    .filter(
      (l) =>
        l.subject.trim().toLowerCase() === targetSubject &&
        l.type === currentType &&
        l.dateStr > currentLesson.dateStr
    )
    .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());

  if (futureSameTypeLessons.length > 0) {
    return futureSameTypeLessons[0];
  }

  // 2. Compatible practical match: If lab and no more labs found, check practice (and vice-versa)
  if (currentType === 'lab' || currentType === 'practice') {
    const compatibleType = currentType === 'lab' ? 'practice' : 'lab';
    const futureCompatibleLessons = allLessons
      .filter(
        (l) =>
          l.subject.trim().toLowerCase() === targetSubject &&
          l.type === compatibleType &&
          l.dateStr > currentLesson.dateStr
      )
      .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());

    if (futureCompatibleLessons.length > 0) {
      return futureCompatibleLessons[0];
    }
  }

  // 3. Fallback: Any future lesson of the same subject on a future day
  const futureAnyTypeLessons = allLessons
    .filter(
      (l) =>
        l.subject.trim().toLowerCase() === targetSubject &&
        l.dateStr > currentLesson.dateStr
    )
    .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());

  if (futureAnyTypeLessons.length > 0) {
    return futureAnyTypeLessons[0];
  }

  // 4. Same day later: Look for a later lesson today of same type
  const todaySameType = allLessons
    .filter(
      (l) =>
        l.subject.trim().toLowerCase() === targetSubject &&
        l.type === currentType &&
        l.startDateTime.getTime() > currentLesson.endDateTime.getTime()
    )
    .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());

  if (todaySameType.length > 0) {
    return todaySameType[0];
  }

  // 5. Same day later: Any later lesson today of same subject
  const todayAnyType = allLessons
    .filter(
      (l) =>
        l.subject.trim().toLowerCase() === targetSubject &&
        l.startDateTime.getTime() > currentLesson.endDateTime.getTime()
    )
    .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());

  if (todayAnyType.length > 0) {
    return todayAnyType[0];
  }

  return null;
}

/**
 * Calculates due date (YYYY-MM-DD) and due time (HH:mm) for homework based on the next lesson.
 * If next lesson exists: returns its dateStr and startTime.
 * If no next lesson is found in the schedule: defaults to +7 days at the current lesson's startTime.
 */
export function getNextLessonDeadline(
  currentLesson: ParsedLesson,
  allLessons: ParsedLesson[]
): { dueDate: string; dueTime: string; nextLesson: ParsedLesson | null } {
  const nextLesson = findNextLessonForSubject(currentLesson, allLessons);
  if (nextLesson) {
    return {
      dueDate: nextLesson.dateStr,
      dueTime: nextLesson.startTime,
      nextLesson,
    };
  }

  // Fallback: 7 days after current lesson
  const fallbackDate = new Date(currentLesson.startDateTime);
  fallbackDate.setDate(fallbackDate.getDate() + 7);
  return {
    dueDate: formatDateToIso(fallbackDate),
    dueTime: currentLesson.startTime,
    nextLesson: null,
  };
}

/**
 * Formats a teacher's full name to compact initials if requested.
 * E.g., "Иванов Иван Иванович" -> "Иванов И. И."
 */
export function formatTeacherName(fullName?: string, useInitials = false): string {
  if (!fullName || fullName === 'Преподаватель не указан') return fullName || 'Преподаватель не указан';
  if (!useInitials) return fullName;

  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return fullName;

  const lastName = parts[0];
  const firstInitial = parts[1]?.[0] ? `${parts[1][0]}.` : '';
  const middleInitial = parts[2]?.[0] ? ` ${parts[2][0]}.` : '';

  return `${lastName} ${firstInitial}${middleInitial}`.trim();
}

