// Schedule data types matching KSU EIOS API

export interface RawRaspItem {
  код: number;
  дата: string; // e.g. "2026-10-12T00:00:00"
  датаНачала: string; // e.g. "2026-10-12T10:10:00"
  датаОкончания: string; // e.g. "2026-10-12T11:40:00"
  перерыв?: number | null;
  начало: string; // e.g. "10:10"
  конец: string; // e.g. "11:40"
  деньНедели: number; // 1 = Пн, 2 = Вт ... 7 = Вс
  день_недели: string; // "Понедельник"
  дисциплина: string; // "лек Основы российской государственности"
  преподаватель: string; // "Ганжа Н.В."
  фиоПреподавателя?: string;
  должность?: string;
  аудитория: string; // "Б-407"
  учебныйГод: string; // "2026-2027"
  группа: string; // "26-ИСбо-4"
  номерЗанятия: number; // 1, 2, 3, 4, 5...
  номерПодгруппы: number; // 0 = вся группа, 1 = 1-я п/г, 2 = 2-я п/г
  типНедели?: number; // week type id
  замена?: boolean; // replacement flag
  цвет?: string;
  custom1?: string;
  ссылка?: string | null;
  вебинарЗапущен?: boolean;
}

export type LessonType = 'lecture' | 'practice' | 'lab' | 'exam' | 'credit' | 'other';

export interface ParsedLesson {
  id: number;
  dateStr: string; // YYYY-MM-DD
  rawDate: string;
  startTime: string; // "10:10"
  endTime: string; // "11:40"
  startDateTime: Date;
  endDateTime: Date;
  pairNumber: number;
  dayOfWeek: number; // 1-7 (1=Пн)
  dayName: string;
  subject: string; // Cleaned subject name, e.g. "Основы российской государственности"
  rawDiscipline: string;
  type: LessonType;
  typeLabel: string; // "Лекция", "Практика", "Лаба"
  typeBadgeColor: {
    bg: string;
    text: string;
    border: string;
    dot: string;
  };
  teacher: string;
  auditorium: string;
  building: string;
  subgroup: number; // 0, 1, 2
  isReplacement: boolean;
  link?: string | null;
  customNote?: string;
}

export interface RaspInfo {
  group: {
    name: string;
    groupID: number;
    year: string;
  };
  curWeekNumber: number;
  curNumNed: number; // 1 = числитель, 2 = знаменатель
  selectedNumNed?: number;
  curSem: number;
  year: string;
  dateUploadingRasp: string; // e.g. "2026-10-16T18:49:59"
}

export interface ScheduleResponse {
  data: {
    rasp: RawRaspItem[];
    info: RaspInfo;
    isCyclicalSchedule: boolean;
  };
  state: number;
  msg?: string;
  time?: string;
}

export interface WeekDaySchedule {
  date: Date;
  dateStr: string; // "2026-10-16"
  dayOfWeek: number; // 1-7
  dayName: string; // "Понедельник"
  shortDayName: string; // "Пн"
  isToday: boolean;
  isPast: boolean;
  lessons: ParsedLesson[];
}

export interface KsuGroup {
  id: number;
  name: string;
  kurs?: number;
  facul?: string;
  facultyID?: number;
  lessonsCount?: number;
}

export interface GroupPreset {
  id: string;
  title: string;
  subtitle: string;
  groupId: number;
  groupName: string;
  subgroup: number;
  subgroupLabel: string;
  foreignLang: 'all' | 'de' | 'en' | 'fr';
  langLabel: string;
  facul: string;
  kurs: number;
}

export const GROUP_PRESETS: GroupPreset[] = [
  {
    id: 'my-group',
    title: 'Моя группа',
    subtitle: 'Основной профиль',
    groupId: 8953,
    groupName: '26-ИСбо-4',
    subgroup: 1,
    subgroupLabel: '1 подгруппа',
    foreignLang: 'de',
    langLabel: 'Немецкий',
    facul: 'ИВИТШ',
    kurs: 1,
  },
  {
    id: 'friend-group',
    title: 'Группа моего друга',
    subtitle: 'Профиль друга',
    groupId: 8921,
    groupName: '26-ТМбо-8',
    subgroup: 0,
    subgroupLabel: 'Вся группа',
    foreignLang: 'en',
    langLabel: 'Английский',
    facul: 'ИПТД',
    kurs: 1,
  },
];
