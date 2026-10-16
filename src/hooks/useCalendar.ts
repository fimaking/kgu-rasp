import { useState, useMemo, useCallback } from 'react';
import { CalendarCustomEvent, CalendarViewMode, DayEventsSummary } from '../types/calendar';
import { ParsedLesson } from '../types/schedule';
import { Homework } from '../types/homework';
import { StorageService } from '../services/storageService';
import { SyncService } from '../services/syncService';
import { formatDateToIso } from '../utils/dateUtils';

export function useCalendar(lessons: ParsedLesson[], homeworks: Homework[]) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [events, setEvents] = useState<CalendarCustomEvent[]>(() => StorageService.getEvents());

  const reload = useCallback(() => {
    setEvents(StorageService.getEvents());
  }, []);

  const addEvent = useCallback((event: Omit<CalendarCustomEvent, 'id' | 'createdAt'>) => {
    const created = StorageService.addEvent(event);
    setEvents(StorageService.getEvents());
    SyncService.pushToCloud();
    return created;
  }, []);

  const deleteEvent = useCallback((id: string) => {
    StorageService.deleteEvent(id);
    setEvents(StorageService.getEvents());
    SyncService.pushToCloud();
  }, []);

  // Selected date ISO string
  const selectedDateStr = useMemo(() => formatDateToIso(selectedDate), [selectedDate]);

  // Combined day items for selected day
  const selectedDaySummary: DayEventsSummary = useMemo(() => {
    const dayLessons = lessons
      .filter((l) => l.dateStr === selectedDateStr)
      .sort((a, b) => a.pairNumber - b.pairNumber);

    const dayHomeworks = homeworks.filter((h) => h.dueDate === selectedDateStr);

    const dayCustomEvents = events.filter((e) => e.date === selectedDateStr);

    return {
      dateStr: selectedDateStr,
      lessons: dayLessons,
      homeworks: dayHomeworks,
      customEvents: dayCustomEvents,
    };
  }, [lessons, homeworks, events, selectedDateStr]);

  // Map of date strings to dot counts for the month view
  const eventsByDate = useMemo(() => {
    const map = new Map<string, { lessonCount: number; hwCount: number; customCount: number }>();

    for (const l of lessons) {
      const cur = map.get(l.dateStr) || { lessonCount: 0, hwCount: 0, customCount: 0 };
      cur.lessonCount++;
      map.set(l.dateStr, cur);
    }

    for (const h of homeworks) {
      if (h.status !== 'completed') {
        const cur = map.get(h.dueDate) || { lessonCount: 0, hwCount: 0, customCount: 0 };
        cur.hwCount++;
        map.set(h.dueDate, cur);
      }
    }

    for (const e of events) {
      const cur = map.get(e.date) || { lessonCount: 0, hwCount: 0, customCount: 0 };
      cur.customCount++;
      map.set(e.date, cur);
    }

    return map;
  }, [lessons, homeworks, events]);

  return {
    selectedDate,
    setSelectedDate,
    selectedDateStr,
    viewMode,
    setViewMode,
    events,
    selectedDaySummary,
    eventsByDate,
    addEvent,
    deleteEvent,
    reload,
  };
}
