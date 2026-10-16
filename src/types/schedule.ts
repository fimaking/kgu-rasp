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
  typeLabel: string; // "Лекция", "Практика", "Лабораторная"
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
