import { ParsedLesson } from './schedule';
import { Homework } from './homework';

export type EventType = 'test' | 'exam' | 'colloquium' | 'deadline' | 'consultation' | 'other';

export interface CalendarCustomEvent {
  id: string;
  title: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  time?: string; // "14:00"
  subject?: string;
  room?: string;
  notes?: string;
  color?: string;
  createdAt: string;
}

export type CalendarViewMode = 'month' | 'week' | 'agenda';

export interface DayEventsSummary {
  dateStr: string;
  lessons: ParsedLesson[];
  homeworks: Homework[];
  customEvents: CalendarCustomEvent[];
}
