import { ScheduleResponse, RawRaspItem, ParsedLesson, RaspInfo } from '../types/schedule';
import { parseRawRaspItem } from '../utils/scheduleParser';
import initialScheduleData from '../data/initialSchedule.json';

const STORAGE_KEY_SCHEDULE = 'ksu_schedule_cache_v2';
const STORAGE_KEY_TIMESTAMP = 'ksu_schedule_last_sync';

export interface ScheduleFetchResult {
  lessons: ParsedLesson[];
  rawItems: RawRaspItem[];
  info: RaspInfo;
  isCyclicalSchedule: boolean;
  isOffline: boolean;
  lastUpdated: string;
}

export class ScheduleService {
  /**
   * Fetch schedule for a given group ID
   * Tries live proxy first, then localStorage cache, then embedded dataset
   */
  static async fetchSchedule(groupId = 8953, forceRefresh = false): Promise<ScheduleFetchResult> {
    const cached = !forceRefresh ? this.getCachedSchedule(groupId) : null;
    if (cached) {
      return cached;
    }

    try {
      // Try fetching from development proxy or backend proxy
      const directTarget = `https://eios.kosgos.ru/api/Rasp?idGroup=${groupId}`;
      const endpoints = [
        `/api/schedule?groupId=${groupId}`,
        `/api-eios/Rasp?idGroup=${groupId}`,
        directTarget,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(directTarget)}`,
        `https://corsproxy.io/?url=${encodeURIComponent(directTarget)}`
      ];

      let rawData: ScheduleResponse | null = null;

      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const response = await fetch(endpoint, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json'
            }
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            if (data && data.data && Array.isArray(data.data.rasp) && data.data.rasp.length > 0) {
              rawData = data;
              break;
            }
          }
        } catch {
          // Continue to next endpoint
        }
      }

      if (rawData && rawData.data) {
        const result = this.processResponse(rawData, false);
        this.cacheSchedule(groupId, rawData);
        return result;
      }
    } catch (err) {
      console.warn('Network fetch failed, falling back to local storage or embedded schedule', err);
    }

    // Fallback 1: LocalStorage cache even if forceRefresh was requested
    const savedCache = this.getCachedSchedule(groupId);
    if (savedCache) {
      return { ...savedCache, isOffline: true };
    }

    // Fallback 2: Embedded real schedule dataset for group 8953
    const fallbackResponse = initialScheduleData as unknown as ScheduleResponse;
    const fallbackResult = this.processResponse(fallbackResponse, true);
    return fallbackResult;
  }

  private static processResponse(res: ScheduleResponse, isOffline: boolean): ScheduleFetchResult {
    const rawItems = res.data.rasp || [];
    const lessons = rawItems.map(parseRawRaspItem);
    
    // Sort lessons chronologically by start date/time
    lessons.sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());

    const lastUpdated = res.data.info?.dateUploadingRasp || new Date().toISOString();

    return {
      lessons,
      rawItems,
      info: res.data.info,
      isCyclicalSchedule: Boolean(res.data.isCyclicalSchedule),
      isOffline,
      lastUpdated,
    };
  }

  private static cacheSchedule(groupId: number, data: ScheduleResponse): void {
    try {
      localStorage.setItem(`${STORAGE_KEY_SCHEDULE}_${groupId}`, JSON.stringify(data));
      localStorage.setItem(`${STORAGE_KEY_TIMESTAMP}_${groupId}`, new Date().toISOString());
    } catch (e) {
      console.warn('Failed to save schedule to localStorage', e);
    }
  }

  static getCachedSchedule(groupId: number): ScheduleFetchResult | null {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_SCHEDULE}_${groupId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ScheduleResponse;
      if (!parsed || !parsed.data || !Array.isArray(parsed.data.rasp)) return null;
      return this.processResponse(parsed, false);
    } catch {
      return null;
    }
  }

  static getLastSyncDate(groupId = 8953): string | null {
    return localStorage.getItem(`${STORAGE_KEY_TIMESTAMP}_${groupId}`);
  }

  /**
   * Extract distinct subject names for homework selector
   */
  static extractSubjects(lessons: ParsedLesson[]): string[] {
    const subjects = new Set<string>();
    for (const l of lessons) {
      if (l.subject) subjects.add(l.subject);
    }
    return Array.from(subjects).sort((a, b) => a.localeCompare(b, 'ru'));
  }
}
