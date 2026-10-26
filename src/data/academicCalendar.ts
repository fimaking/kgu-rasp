// Official Academic Schedule (График учебного процесса) for KSU
// Faculty: ИВИТШ, Group: 26-ИСбо-4, Academic Year: 2026-2027, Study Plan: B09030202_26_1_ИТ.plx

export type AcademicPeriodType = 'theory' | 'session' | 'vacation' | 'practice' | 'holiday';

export interface AcademicStageInfo {
  id: string;
  title: string;
  type: AcademicPeriodType;
  shortCode: string; // ' ', 'Э', 'К', 'У', '*'
  semester: 1 | 2;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  weeksLabel: string;
  durationLabel: string;
  color: {
    bg: string;
    border: string;
    text: string;
    badge: string;
    dot: string;
  };
  description: string;
}

export interface AcademicDayStatus {
  dateStr: string; // YYYY-MM-DD
  dayOfWeek: number; // 1 = Пн ... 7 = Вс
  symbol: ' ' | 'Э' | 'К' | 'У' | '*';
  label: string;
  isHoliday: boolean;
  holidayName?: string;
}

export interface AcademicWeekData {
  weekNumber: number; // 1..52
  startDate: string; // YYYY-MM-DD (Monday)
  endDate: string; // YYYY-MM-DD (Sunday)
  semester: 1 | 2;
  primaryType: AcademicPeriodType;
  primaryTypeLabel: string;
  primaryCode: ' ' | 'Э' | 'К' | 'У';
  hasHoliday: boolean;
  days: AcademicDayStatus[];
}

export const GROUP_ACADEMIC_METADATA = {
  faculty: 'ИВИТШ',
  groupName: '26-ИСбо-4',
  course: 1,
  academicYear: '2026-2027',
  studyPlan: 'B09030202_26_1_ИТ.plx',
  title: 'График учебного процесса 1 курса',
};

// 7 Key academic periods from the official calendar
export const ACADEMIC_STAGES: AcademicStageInfo[] = [
  {
    id: 'sem1-theory',
    title: '1 семестр (Теоретическое обучение)',
    type: 'theory',
    shortCode: ' ',
    semester: 1,
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    weeksLabel: 'Недели 1 – 18',
    durationLabel: '18 недель',
    color: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      border: 'border-blue-500/30',
      text: 'text-blue-600 dark:text-blue-400',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      dot: 'bg-blue-500',
    },
    description: 'Учебные занятия (лекции, практические и лабораторные занятия) по расписанию осеннего семестра.',
  },
  {
    id: 'sem1-session',
    title: 'Зимняя экзаменационная сессия',
    type: 'session',
    shortCode: 'Э',
    semester: 1,
    startDate: '2027-01-11',
    endDate: '2027-01-31',
    weeksLabel: 'Недели 20 – 22',
    durationLabel: '3 недели',
    color: {
      bg: 'bg-purple-500/10 dark:bg-purple-500/20',
      border: 'border-purple-500/30',
      text: 'text-purple-600 dark:text-purple-400',
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
      dot: 'bg-purple-500',
    },
    description: 'Сдача зачётов и экзаменов 1 семестра.',
  },
  {
    id: 'winter-vacation',
    title: 'Зимние каникулы',
    type: 'vacation',
    shortCode: 'К',
    semester: 1,
    startDate: '2027-02-01',
    endDate: '2027-02-07',
    weeksLabel: 'Неделя 23',
    durationLabel: '1 неделя',
    color: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      border: 'border-emerald-500/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
      dot: 'bg-emerald-500',
    },
    description: 'Зимние студенческие каникулы между семестрами.',
  },
  {
    id: 'sem2-theory',
    title: '2 семестр (Теоретическое обучение)',
    type: 'theory',
    shortCode: ' ',
    semester: 2,
    startDate: '2027-02-08',
    endDate: '2027-06-06',
    weeksLabel: 'Недели 24 – 40',
    durationLabel: '17 недель',
    color: {
      bg: 'bg-sky-500/10 dark:bg-sky-500/20',
      border: 'border-sky-500/30',
      text: 'text-sky-600 dark:text-sky-400',
      badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
      dot: 'bg-sky-500',
    },
    description: 'Учебные занятия весеннего семестра.',
  },
  {
    id: 'sem2-session',
    title: 'Летняя экзаменационная сессия',
    type: 'session',
    shortCode: 'Э',
    semester: 2,
    startDate: '2027-06-07',
    endDate: '2027-06-20',
    weeksLabel: 'Недели 41 – 42',
    durationLabel: '2 недели',
    color: {
      bg: 'bg-rose-500/10 dark:bg-rose-500/20',
      border: 'border-rose-500/30',
      text: 'text-rose-600 dark:text-rose-400',
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
      dot: 'bg-rose-500',
    },
    description: 'Сдача зачётов и экзаменов весеннего семестра.',
  },
  {
    id: 'practice',
    title: 'Учебная практика',
    type: 'practice',
    shortCode: 'У',
    semester: 2,
    startDate: '2027-06-21',
    endDate: '2027-07-04',
    weeksLabel: 'Недели 43 – 44',
    durationLabel: '2 недели',
    color: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      border: 'border-amber-500/30',
      text: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
      dot: 'bg-amber-500',
    },
    description: 'Прохождение учебной практики 1 курса.',
  },
  {
    id: 'summer-vacation',
    title: 'Летние каникулы',
    type: 'vacation',
    shortCode: 'К',
    semester: 2,
    startDate: '2027-07-05',
    endDate: '2027-08-31',
    weeksLabel: 'Недели 45 – 52',
    durationLabel: '8 недель',
    color: {
      bg: 'bg-teal-500/10 dark:bg-teal-500/20',
      border: 'border-teal-500/30',
      text: 'text-teal-600 dark:text-teal-400',
      badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
      dot: 'bg-teal-500',
    },
    description: 'Летние каникулы до начала следующего учебного года.',
  },
];

// Official Russian public non-working holidays during 2026-2027 academic year
export const ACADEMIC_HOLIDAYS: { dateStr: string; name: string }[] = [
  { dateStr: '2026-11-04', name: 'День народного единства' },
  { dateStr: '2027-01-01', name: 'Новый год' },
  { dateStr: '2027-01-02', name: 'Новогодние каникулы' },
  { dateStr: '2027-01-04', name: 'Новогодние каникулы' },
  { dateStr: '2027-01-05', name: 'Новогодние каникулы' },
  { dateStr: '2027-01-06', name: 'Новогодние каникулы' },
  { dateStr: '2027-01-07', name: 'Рождество Христово' },
  { dateStr: '2027-01-08', name: 'Новогодние каникулы' },
  { dateStr: '2027-02-23', name: 'День защитника Отечества' },
  { dateStr: '2027-03-08', name: 'Международный женский день' },
  { dateStr: '2027-05-01', name: 'Праздник Весны и Труда' },
  { dateStr: '2027-05-09', name: 'День Победы' },
  { dateStr: '2027-05-10', name: 'Праздничный выходной (перенос с Дня Победы)' },
  { dateStr: '2027-06-12', name: 'День России' },
  { dateStr: '2027-06-14', name: 'Праздничный выходной (перенос с Дня России)' },
];

const HOLIDAY_MAP = new Map<string, string>(
  ACADEMIC_HOLIDAYS.map((h) => [h.dateStr, h.name])
);

// Format date helper
function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Generate complete 52 weeks dataset for 2026-2027
export const ACADEMIC_WEEKS: AcademicWeekData[] = (() => {
  const weeks: AcademicWeekData[] = [];
  // Monday August 31, 2026 is week 1 Monday (first day of studies is Sep 1)
  const baseMonday = new Date(2026, 7, 31); // Month 7 is August

  for (let w = 1; w <= 52; w++) {
    const monday = new Date(baseMonday);
    monday.setDate(baseMonday.getDate() + (w - 1) * 7);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const startDateStr = toIsoDate(monday);
    const endDateStr = toIsoDate(sunday);

    let primaryType: AcademicPeriodType = 'theory';
    let primaryTypeLabel = 'Теоретическое обучение';
    let primaryCode: ' ' | 'Э' | 'К' | 'У' = ' ';
    const semester: 1 | 2 = w <= 23 ? 1 : 2;

    if (w >= 20 && w <= 22) {
      primaryType = 'session';
      primaryTypeLabel = 'Экзаменационная сессия';
      primaryCode = 'Э';
    } else if (w === 23) {
      primaryType = 'vacation';
      primaryTypeLabel = 'Зимние каникулы';
      primaryCode = 'К';
    } else if (w >= 41 && w <= 42) {
      primaryType = 'session';
      primaryTypeLabel = 'Экзаменационная сессия';
      primaryCode = 'Э';
    } else if (w >= 43 && w <= 44) {
      primaryType = 'practice';
      primaryTypeLabel = 'Учебная практика';
      primaryCode = 'У';
    } else if (w >= 45 && w <= 52) {
      primaryType = 'vacation';
      primaryTypeLabel = 'Летние каникулы';
      primaryCode = 'К';
    }

    const days: AcademicDayStatus[] = [];
    let hasHoliday = false;

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + dayOffset);
      const dateStr = toIsoDate(cur);
      const dayOfWeek = dayOffset + 1; // 1 = Пн ... 7 = Вс

      const holidayName = HOLIDAY_MAP.get(dateStr);
      const isHoliday = Boolean(holidayName);
      if (isHoliday) hasHoliday = true;

      let symbol: ' ' | 'Э' | 'К' | 'У' | '*' = primaryCode;
      let label = primaryTypeLabel;

      if (isHoliday) {
        symbol = '*';
        label = holidayName || 'Нерабочий праздничный день';
      } else if (dayOfWeek === 7) {
        label = 'Воскресенье (выходной)';
      }

      days.push({
        dateStr,
        dayOfWeek,
        symbol,
        label,
        isHoliday,
        holidayName,
      });
    }

    weeks.push({
      weekNumber: w,
      startDate: startDateStr,
      endDate: endDateStr,
      semester,
      primaryType,
      primaryTypeLabel,
      primaryCode,
      hasHoliday,
      days,
    });
  }

  return weeks;
})();

// Lookup helpers
export function getAcademicWeekByNumber(weekNumber: number): AcademicWeekData | undefined {
  return ACADEMIC_WEEKS.find((w) => w.weekNumber === weekNumber);
}

export function getAcademicWeekByDate(date: Date): AcademicWeekData | undefined {
  const dateStr = toIsoDate(date);
  return ACADEMIC_WEEKS.find((w) => dateStr >= w.startDate && dateStr <= w.endDate);
}

export function getAcademicStageForDate(date: Date): AcademicStageInfo | undefined {
  const dateStr = toIsoDate(date);
  return ACADEMIC_STAGES.find((s) => dateStr >= s.startDate && dateStr <= s.endDate);
}

export function getHolidayForDate(date: Date): { dateStr: string; name: string } | undefined {
  const dateStr = toIsoDate(date);
  const name = HOLIDAY_MAP.get(dateStr);
  return name ? { dateStr, name } : undefined;
}
