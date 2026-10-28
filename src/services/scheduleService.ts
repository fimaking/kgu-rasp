import { ScheduleResponse, RawRaspItem, ParsedLesson, RaspInfo, KsuGroup } from '../types/schedule';
import { parseRawRaspItem } from '../utils/scheduleParser';
import initialScheduleData from '../data/initialSchedule.json';
import ksuGroupsData from '../data/ksuGroups.json';

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
   * Get all 381 available groups in KSU (with faculties and courses)
   */
  static getAvailableGroups(): KsuGroup[] {
    return ksuGroupsData as KsuGroup[];
  }

  /**
   * Get schedule instantly on startup (0ms synchronous loading)
   * Reads from localStorage cache, or falls back to embedded dataset immediately.
   * If the bundled dataset has a newer upload date than localStorage, upgrades cache immediately.
   */
  static getInitialSchedule(groupId = 8953): ScheduleFetchResult {
    let cachedResult: ScheduleFetchResult | null = null;
    try {
      cachedResult = this.getCachedSchedule(groupId);
    } catch (e) {
      console.warn('Error reading cached schedule:', e);
    }

    if (groupId === 8953) {
      try {
        const bundledResponse = initialScheduleData as unknown as ScheduleResponse;
        const bundledDateStr = bundledResponse.data?.info?.dateUploadingRasp;
        const cachedDateStr = cachedResult?.info?.dateUploadingRasp;

        // If no cache or bundled dataset has a newer upload date, immediately upgrade localStorage!
        const isBundledNewer =
          !cachedResult ||
          !cachedResult.lessons ||
          cachedResult.lessons.length === 0 ||
          (bundledDateStr && (!cachedDateStr || new Date(bundledDateStr) > new Date(cachedDateStr)));

        if (isBundledNewer) {
          const freshResult = this.processResponse(bundledResponse, false);
          this.cacheSchedule(groupId, bundledResponse);
          return freshResult;
        }
      } catch (e) {
        console.error('Error processing fallback schedule:', e);
      }
    }

    if (cachedResult && cachedResult.lessons && cachedResult.lessons.length > 0) {
      return cachedResult;
    }

    return {
      lessons: [],
      rawItems: [],
      info: null as any,
      isCyclicalSchedule: false,
      isOffline: true,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Fetch schedule:
   * If not forceRefresh and cached schedule exists, return it immediately (0ms).
   * Otherwise, fetch from live KSU EIOS, GitHub Raw CDN, or same-origin static files with cache-busting.
   */
  static async fetchSchedule(groupId = 8953, forceRefresh = false): Promise<ScheduleFetchResult> {
    const cached = this.getCachedSchedule(groupId);
    if (!forceRefresh && cached && cached.lessons && cached.lessons.length > 0) {
      return cached;
    }

    try {
      const isLocal =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname.startsWith('192.168.'));

      const cacheBuster = `_t=${Date.now()}`;
      const endpoints: string[] = [];

      // 1. In local dev, Vite proxy to KSU is fast, direct, and eliminates CORS completely
      if (isLocal) {
        endpoints.push(`/api-eios/Rasp?idGroup=${groupId}&${cacheBuster}`);
      }

      // 2. Direct KSU EIOS API (works directly when CORS is allowed or running in non-browser context)
      endpoints.push(`https://eios.kosgos.ru/api/Rasp?idGroup=${groupId}`);

      // 3. Fallback CDN on GitHub Raw (has Access-Control-Allow-Origin: * and is updated by auto-sync bot)
      endpoints.push(
        `https://raw.githubusercontent.com/fimaking/kgu-rasp/main/public/schedules/${groupId}.json?${cacheBuster}`
      );

      // 4. Same-origin static schedules (bundled in PWA, with cache-busting parameter)
      if (typeof window !== 'undefined') {
        const basePath = import.meta.env.BASE_URL || './';
        const cleanBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
        endpoints.push(`${cleanBase}schedules/${groupId}.json?${cacheBuster}`);
        endpoints.push(`./schedules/${groupId}.json?${cacheBuster}`);
      }

      // 5. jsDelivr global CDN fallback
      endpoints.push(
        `https://cdn.jsdelivr.net/gh/fimaking/kgu-rasp@main/public/schedules/${groupId}.json?${cacheBuster}`
      );

      let rawData: ScheduleResponse | null = null;

      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const response = await fetch(endpoint, {
            signal: controller.signal,
            headers: {
              Accept: 'application/json',
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
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
          // Continue to next endpoint in cascade
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

    if (cached) {
      return cached;
    }

    return this.getInitialSchedule(groupId);
  }

  /**
   * Check for schedule updates silently in the background.
   * Returns whether a newer schedule was found and applied.
   */
  static async syncScheduleSilently(groupId = 8953): Promise<{ hasNewData: boolean; result: ScheduleFetchResult }> {
    const currentCached = this.getCachedSchedule(groupId);
    const currentDateStr = currentCached?.info?.dateUploadingRasp;

    try {
      const freshResult = await this.fetchSchedule(groupId, true);
      const newDateStr = freshResult.info?.dateUploadingRasp;

      // Check if the freshly fetched schedule has a newer upload date or changed lesson count
      const isNewer =
        !currentCached ||
        !currentDateStr ||
        (newDateStr && new Date(newDateStr).getTime() > new Date(currentDateStr).getTime()) ||
        freshResult.lessons.length !== (currentCached?.lessons?.length || 0);

      if (isNewer) {
        return { hasNewData: true, result: freshResult };
      }

      return { hasNewData: false, result: freshResult };
    } catch {
      return {
        hasNewData: false,
        result: currentCached || this.getInitialSchedule(groupId),
      };
    }
  }

  private static processResponse(res: ScheduleResponse, isOffline: boolean): ScheduleFetchResult {
    try {
      const rawItems = res.data?.rasp || [];
      const lessons = rawItems.map(parseRawRaspItem);
      
      // Sort lessons chronologically by start date/time
      lessons.sort((a, b) => {
        const timeA = a.startDateTime ? a.startDateTime.getTime() : 0;
        const timeB = b.startDateTime ? b.startDateTime.getTime() : 0;
        return timeA - timeB;
      });

      const lastUpdated = res.data?.info?.dateUploadingRasp || new Date().toISOString();

      return {
        lessons,
        rawItems,
        info: res.data?.info || (null as any),
        isCyclicalSchedule: Boolean(res.data?.isCyclicalSchedule),
        isOffline,
        lastUpdated,
      };
    } catch (e) {
      console.error('Error in processResponse:', e);
      return {
        lessons: [],
        rawItems: [],
        info: null as any,
        isCyclicalSchedule: false,
        isOffline: true,
        lastUpdated: new Date().toISOString(),
      };
    }
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
      const raw =
        localStorage.getItem(`${STORAGE_KEY_SCHEDULE}_${groupId}`) ||
        (groupId === 8953 ? localStorage.getItem(STORAGE_KEY_SCHEDULE) : null);
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
