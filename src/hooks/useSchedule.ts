import { useState, useEffect, useMemo, useCallback } from 'react';
import { ParsedLesson, RaspInfo, WeekDaySchedule } from '../types/schedule';
import { ScheduleService } from '../services/scheduleService';
import { StorageService } from '../services/storageService';
import {
  getMondayOfWeek,
  getDaysOfWeek,
  formatDateToIso,
  isToday,
  formatDayOfWeek,
  formatShortDayOfWeek,
} from '../utils/dateUtils';
import { getLessonStatus, filterLessonsBySubgroup } from '../utils/scheduleParser';

export function useSchedule() {
  // Settings
  const [groupId, setGroupId] = useState<number>(() => StorageService.getSettings().groupId || 8953);
  const [groupName, setGroupName] = useState<string>(() => StorageService.getSettings().groupName || '26-ИСбо-4');
  const [subgroupFilter, setSubgroupFilter] = useState<number>(
    () => StorageService.getSettings().subgroupPreference ?? 1
  );

  // Synchronous 0ms startup from memory / cache:
  const [initialData] = useState(() => ScheduleService.getInitialSchedule(groupId));
  const [lessons, setLessons] = useState<ParsedLesson[]>(() => initialData.lessons);
  const [info, setInfo] = useState<RaspInfo | null>(() => initialData.info);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(() => initialData.isOffline);
  const [lastUpdated, setLastUpdated] = useState<string | null>(() => initialData.lastUpdated);

  // Date selection: default to today
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedWeekMonday, setSelectedWeekMonday] = useState<Date>(() =>
    getMondayOfWeek(new Date())
  );

  const loadData = useCallback(
    async (force = false, targetGroupId?: number) => {
      const idToFetch = typeof targetGroupId === 'number' ? targetGroupId : groupId;
      if (force) setRefreshing(true);
      setError(null);

      try {
        const result = await ScheduleService.fetchSchedule(idToFetch, force);
        setLessons(result.lessons);
        setInfo(result.info);
        setIsOffline(result.isOffline);
        setLastUpdated(result.lastUpdated);
      } catch (err: unknown) {
        console.error('Error fetching schedule:', err);
        if (force) {
          setError('Не удалось загрузить расписание. Проверьте соединение.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [groupId]
  );

  useEffect(() => {
    // Silent background refresh (never blocks initial render!)
    loadData(false);
  }, [loadData]);

  const updateSubgroupFilter = useCallback((sg: number) => {
    setSubgroupFilter(sg);
    const s = StorageService.getSettings();
    StorageService.saveSettings({ ...s, subgroupPreference: sg });
  }, []);

  const changeGroup = useCallback(
    async (newGroupId: number, newGroupName: string, newSubgroup?: number) => {
      setGroupId(newGroupId);
      setGroupName(newGroupName);
      const sg = typeof newSubgroup === 'number' ? newSubgroup : subgroupFilter;
      if (typeof newSubgroup === 'number') {
        setSubgroupFilter(newSubgroup);
      }
      const currentSettings = StorageService.getSettings();
      StorageService.saveSettings({
        ...currentSettings,
        groupId: newGroupId,
        groupName: newGroupName,
        subgroupPreference: sg,
      });

      const cached = ScheduleService.getCachedSchedule(newGroupId);
      if (cached && cached.lessons.length > 0) {
        setLessons(cached.lessons);
        setInfo(cached.info);
        setLastUpdated(cached.lastUpdated);
      } else {
        setLoading(true);
      }

      await loadData(true, newGroupId);
    },
    [loadData, subgroupFilter]
  );

  // Real-time minute ticker for live countdowns & schedule status
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    const syncTime = () => setCurrentTime(new Date());

    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    const timeoutId = setTimeout(() => {
      syncTime();
      intervalId = setInterval(syncTime, 60 * 1000);
    }, Math.max(500, msUntilNextMinute));

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Filter lessons dynamically according to current subgroupFilter and groupId
  const filteredLessons = useMemo(() => {
    return lessons.filter((l) => filterLessonsBySubgroup(l, subgroupFilter, groupId));
  }, [lessons, subgroupFilter, groupId]);

  // Lessons for today (uses currentTime for automatic midnight / day transition)
  const todayDateStr = formatDateToIso(currentTime);
  const todayLessons = useMemo(() => {
    return filteredLessons
      .filter((l) => l.dateStr === todayDateStr)
      .sort((a, b) => a.pairNumber - b.pairNumber);
  }, [filteredLessons, todayDateStr]);

  // Current or next upcoming lesson today (recomputes every minute!)
  const currentOrNextLesson = useMemo(() => {
    // Check if there is an active lesson right now
    for (const l of todayLessons) {
      const stat = getLessonStatus(l, currentTime);
      if (stat.status === 'current') {
        return { lesson: l, status: 'current' as const, info: stat };
      }
    }
    // Otherwise find the first upcoming lesson
    for (const l of todayLessons) {
      const stat = getLessonStatus(l, currentTime);
      if (stat.status === 'upcoming') {
        return { lesson: l, status: 'upcoming' as const, info: stat };
      }
    }
    return null;
  }, [todayLessons, currentTime]);

  // Lessons for the selected week
  const weekSchedule: WeekDaySchedule[] = useMemo(() => {
    const days = getDaysOfWeek(selectedWeekMonday, true); // Mon to Sun
    const now = new Date();

    return days.map((d) => {
      const dStr = formatDateToIso(d);
      const dayLessons = filteredLessons
        .filter((l) => l.dateStr === dStr)
        .sort((a, b) => a.pairNumber - b.pairNumber);

      return {
        date: d,
        dateStr: dStr,
        dayOfWeek: d.getDay() === 0 ? 7 : d.getDay(),
        dayName: formatDayOfWeek(d),
        shortDayName: formatShortDayOfWeek(d),
        isToday: isToday(d),
        isPast: d.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(),
        lessons: dayLessons,
      };
    });
  }, [selectedWeekMonday, filteredLessons]);

  // Distinct subjects list for dropdowns (only user's subjects)
  const subjects = useMemo(() => {
    return ScheduleService.extractSubjects(filteredLessons);
  }, [filteredLessons]);

  // Week navigation
  const prevWeek = () => {
    setSelectedWeekMonday((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 7);
      return next;
    });
  };

  const nextWeek = () => {
    setSelectedWeekMonday((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 7);
      return next;
    });
  };

  const goToToday = () => {
    const now = new Date();
    setSelectedDate(now);
    setSelectedWeekMonday(getMondayOfWeek(now));
  };

  return {
    lessons: filteredLessons,
    allLessons: lessons,
    todayLessons,
    weekSchedule,
    currentOrNextLesson,
    currentTime,
    info,
    loading,
    refreshing,
    error,
    isOffline,
    lastUpdated,
    selectedDate,
    setSelectedDate,
    selectedWeekMonday,
    setSelectedWeekMonday,
    groupId,
    groupName,
    subgroupFilter,
    setSubgroupFilter: updateSubgroupFilter,
    changeGroup,
    subjects,
    prevWeek,
    nextWeek,
    goToToday,
    refresh: () => loadData(true),
  };
}
