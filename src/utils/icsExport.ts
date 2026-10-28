import { ParsedLesson } from '../types/schedule';

function formatIcsDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getUTCFullYear();
  const m = pad(date.getUTCMonth() + 1);
  const d = pad(date.getUTCDate());
  const h = pad(date.getUTCHours());
  const min = pad(date.getUTCMinutes());
  const s = pad(date.getUTCSeconds());
  return `${y}${m}${d}T${h}${min}${s}Z`;
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate standard RFC 5545 iCalendar (.ics) string from parsed lessons
 */
export function generateIcsSchedule(lessons: ParsedLesson[], groupName = 'UniKGU'): string {
  const nowStr = formatIcsDateTime(new Date());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KSU Student App//RU',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Расписание ${escapeIcsText(groupName)}`,
    'X-WR-TIMEZONE:Europe/Moscow',
  ];

  for (const lesson of lessons) {
    if (!lesson.startDateTime || !lesson.endDateTime) continue;

    const dtStart = formatIcsDateTime(lesson.startDateTime);
    const dtEnd = formatIcsDateTime(lesson.endDateTime);
    const uid = `ksu_${lesson.id || ''}_${lesson.dateStr}_${lesson.pairNumber}@ksu.student`;

    const summary = `${lesson.typeLabel ? `[${lesson.typeLabel}] ` : ''}${lesson.subject}`;
    const location = `${lesson.building}, ${lesson.auditorium}`;
    const description = `Преподаватель: ${lesson.teacher}\\nПодгруппа: ${
      lesson.subgroup === 0 ? 'Вся группа' : `${lesson.subgroup}-я подгруппа`
    }\\nВремя: ${lesson.startTime} - ${lesson.endTime}`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${nowStr}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      `LOCATION:${escapeIcsText(location)}`,
      `DESCRIPTION:${description}`,
      'STATUS:CONFIRMED',
      // Standard 15-minute before pair notification alarm
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcsText(summary)}`,
      'END:VALARM',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Trigger download of .ics calendar file on user's device
 */
export function downloadIcsSchedule(lessons: ParsedLesson[], groupName = 'КГУ'): void {
  const icsContent = generateIcsSchedule(lessons, groupName);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Расписание_${groupName.replace(/[^a-zA-Z0-9а-яА-Я_-]/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
