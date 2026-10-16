import { ScheduleResponse, RawRaspItem, ParsedLesson, RaspInfo } from '../types/schedule';
import { parseRawRaspItem, isUserLesson } from '../utils/scheduleParser';
import initialScheduleData from '../data/initialSchedule.json';

const STORAGE_KEY_SCHEDULE = 'ksu_schedule_cache_v3';
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
   * Get schedule instantly on startup (0ms synchronous loading)
   * Reads from localStorage cache, or falls back to embedded dataset immediately
   */
  static getInitialSchedule(groupId = 8953): ScheduleFetchResult {
    const cached = this.getCachedSchedule(groupId);
    if (cached && cached.lessons.length > 0) {
      return cached;
    }

    const fallbackResponse = initialScheduleData as unknown as ScheduleResponse;
    const initialResult = this.processResponse(fallbackResponse, false);
    this.cacheSchedule(groupId, fallbackResponse);
    return initialResult;
  }

  /**
   * Fetch schedule: If not forceRefresh, return initial/cached schedule immediately without network delay!
   * If forceRefresh, attempt fast network sync with a short 2.5s timeout.
   */
  static async fetchSchedule(groupId = 8953, forceRefresh = false): Promise<ScheduleFetchResult> {
    if (!forceRefresh) {
      // 0ms instant return - never block initial render!
      return this.getInitialSchedule(groupId);
    }

    try {
      const isLocal =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname.startsWith('192.168.'));

      const directTarget = `https://eios.kosgos.ru/api/Rasp?idGroup=${groupId}`;
      const endpoints: string[] = [];

      if (isLocal) {
        endpoints.push(`/api/schedule?groupId=${groupId}`, `/api-eios/Rasp?idGroup=${groupId}`);
      }
      endpoints.push(
        directTarget,
        `https://corsproxy.io/?url=${encodeURIComponent(directTarget)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(directTarget)}`
      );

      let rawData: ScheduleResponse | null = null;

      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s fast timeout instead of 8s
          const response = await fetch(endpoint, {
            signal: controller.signal,
            headers: {
              Accept: 'application/json',
            },
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
      console.warn('Network refresh failed, using cached schedule', err);
    }

    return this.getInitialSchedule(groupId);
  }

  private static processResponse(res: ScheduleResponse, isOffline: boolean): ScheduleFetchResult {
    const rawItems = (res.data.rasp || []).filter(isUserLesson);
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
