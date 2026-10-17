// Date utility functions for Russian locale and Apple Calendar style

const MONTH_NAMES_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

const MONTH_NAMES_NOMINATIVE = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const DAY_NAMES = [
  'Воскресенье', 'Понедельник', 'Вторник', 'Среда',
  'Четверг', 'Пятница', 'Суббота'
];

const DAY_NAMES_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export function formatDateToIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function pluralizeRussian(count: number, one: string, few: string, many: string): string {
  const abs = Math.abs(Math.round(count)) % 100;
  const rem = abs % 10;
  if (abs > 10 && abs < 20) return `${count} ${many}`;
  if (rem > 1 && rem < 5) return `${count} ${few}`;
  if (rem === 1) return `${count} ${one}`;
  return `${count} ${many}`;
}

export function parseIsoDate(iso: string): Date {
  if (!iso || typeof iso !== 'string') {
    return new Date();
  }
  const dateOnly = iso.includes('T') ? iso.split('T')[0] : iso.trim();
  const parts = dateOnly.split('-').map(Number);

  if (parts.length >= 3 && !parts.some(isNaN)) {
    const [year, month, day] = parts;
    return new Date(year, month - 1, day);
  }

  const fallback = new Date(iso);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
}

export function formatRussianDate(d: Date, withYear = false): string {
  const day = d.getDate();
  const month = MONTH_NAMES_GENITIVE[d.getMonth()];
  return withYear ? `${day} ${month} ${d.getFullYear()} г.` : `${day} ${month}`;
}

export function formatDayOfWeek(d: Date): string {
  return DAY_NAMES[d.getDay()];
}

export function formatShortDayOfWeek(d: Date): string {
  return DAY_NAMES_SHORT[d.getDay()];
}

export function getMonthNameNominative(monthIndex: number): string {
  return MONTH_NAMES_NOMINATIVE[monthIndex];
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

export function getGreeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return 'Доброе утро';
  if (hour >= 12 && hour < 18) return 'Добрый день';
  if (hour >= 18 && hour < 23) return 'Добрый вечер';
  return 'Доброй ночи';
}

// Get Monday of the given week
export function getMondayOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Get 6 days (Mon-Sat) or 7 days of the week starting from Monday
export function getDaysOfWeek(monday: Date, includeSunday = true): Date[] {
  const days: Date[] = [];
  const count = includeSunday ? 7 : 6;
  for (let i = 0; i < count; i++) {
    const next = new Date(monday);
    next.setDate(monday.getDate() + i);
    days.push(next);
  }
  return days;
}

// Format relative deadline: "Сегодня", "Завтра", "Вчера", "Через 3 дня"
export function formatRelativeDeadline(dueDateIso: string, dueTime = '23:59'): {
  label: string;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueTomorrow: boolean;
  colorClass: string;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = parseIsoDate(dueDateIso);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const now = new Date();
  const [hours, minutes] = dueTime.split(':').map(Number);
  const deadlineFull = new Date(targetDate);
  deadlineFull.setHours(hours || 23, minutes || 59, 0, 0);

  const isExactOverdue = now.getTime() > deadlineFull.getTime();

  if (diffDays < 0 || isExactOverdue) {
    const daysAgo = Math.abs(diffDays);
    const overdueLabel =
      daysAgo === 0
        ? `Просрочено (${dueTime})`
        : daysAgo === 1
        ? 'Просрочено вчера'
        : `Просрочено на ${pluralizeRussian(daysAgo, 'день', 'дня', 'дней')}`;

    return {
      label: overdueLabel,
      isOverdue: true,
      isDueToday: false,
      isDueTomorrow: false,
      colorClass: 'text-apple-red dark:text-red-400 font-medium'
    };
  }

  if (diffDays === 0) {
    return {
      label: `Сегодня до ${dueTime}`,
      isOverdue: false,
      isDueToday: true,
      isDueTomorrow: false,
      colorClass: 'text-apple-orange dark:text-amber-400 font-medium'
    };
  }

  if (diffDays === 1) {
    return {
      label: `Завтра до ${dueTime}`,
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: true,
      colorClass: 'text-apple-blue dark:text-blue-400'
    };
  }

  if (diffDays <= 7) {
    return {
      label: `${formatShortDayOfWeek(targetDate)}, ${formatRussianDate(targetDate)}`,
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: false,
      colorClass: 'text-apple-gray-600 dark:text-apple-gray-400'
    };
  }

  return {
    label: formatRussianDate(targetDate, true),
    isOverdue: false,
    isDueToday: false,
    isDueTomorrow: false,
    colorClass: 'text-apple-gray-500 dark:text-apple-gray-400'
  };
}

// Academic week description (1 = числитель, 2 = знаменатель)
export function getWeekTypeDescription(numNed: number): string {
  if (numNed === 1) return 'Числитель (над чертой)';
  if (numNed === 2) return 'Знаменатель (под чертой)';
  return 'Обычная неделя';
}
