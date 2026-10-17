import { Homework } from '../types/homework';
import { CalendarCustomEvent } from '../types/calendar';
import { StorageService } from './storageService';
import { RealtimeSyncService } from './realtimeSync';

const SYNC_KEY_STORAGE = 'ksu_student_sync_key';
const SYNC_LAST_PULL_STORAGE = 'ksu_student_sync_last_pull';
const GIST_TOKEN_STORAGE = 'ksu_student_gist_token';
const GIST_ID_STORAGE = 'ksu_student_gist_id';
const CLOUD_ROOM_ID_STORAGE = 'ksu_student_cloud_room_id';

export const DEFAULT_GIST_ID = 'e2d779451fca13d7005a7453b0df880b';

export interface CloudPayload {
  version: string;
  updatedAt: string;
  homework: Homework[];
  events: CalendarCustomEvent[];
  deletedHwIds?: string[];
  cloudRoomId?: string;
}

export class SyncService {
  /* =====================================================================
   * 1. Storage Helpers
   * ===================================================================== */
  static getSyncKey(): string | null {
    return localStorage.getItem(SYNC_KEY_STORAGE);
  }

  static setSyncKey(key: string): void {
    localStorage.setItem(SYNC_KEY_STORAGE, key.trim().toUpperCase());
  }

  static clearSyncKey(): void {
    localStorage.removeItem(SYNC_KEY_STORAGE);
    localStorage.removeItem(SYNC_LAST_PULL_STORAGE);
  }

  static getGistToken(): string | null {
    return localStorage.getItem(GIST_TOKEN_STORAGE);
  }

  static getGistId(): string | null {
    const stored = localStorage.getItem(GIST_ID_STORAGE);
    if (stored && stored.trim()) return stored.trim();
    return DEFAULT_GIST_ID;
  }

  static getCloudRoomId(): string | null {
    const stored = localStorage.getItem(CLOUD_ROOM_ID_STORAGE);
    if (stored && stored.trim()) return stored.trim();
    return DEFAULT_GIST_ID;
  }

  static setCloudRoomId(roomId: string): void {
    if (roomId && roomId.trim()) {
      localStorage.setItem(CLOUD_ROOM_ID_STORAGE, roomId.trim());
      RealtimeSyncService.setRoomCode(roomId.trim());
    }
  }

  static setGistCredentials(token: string | undefined | null, gistId: string): void {
    if (token && token.trim()) {
      localStorage.setItem(GIST_TOKEN_STORAGE, token.trim());
    } else {
      localStorage.removeItem(GIST_TOKEN_STORAGE);
    }
    const cleanId = (gistId || DEFAULT_GIST_ID).trim();
    localStorage.setItem(GIST_ID_STORAGE, cleanId);
    this.setSyncKey(`GIST-${cleanId.substring(0, 8).toUpperCase()}`);
    RealtimeSyncService.setRoomCode(cleanId);
  }

  static setGistToken(token: string): void {
    if (token && token.trim()) {
      localStorage.setItem(GIST_TOKEN_STORAGE, token.trim());
    } else {
      localStorage.removeItem(GIST_TOKEN_STORAGE);
    }
  }

  static hasWritePermission(): boolean {
    const t = this.getGistToken();
    return Boolean(t && t.trim());
  }

  static isSyncConfigured(): boolean {
    return true; // Permanently linked for the user
  }

  static clearGistCredentials(): void {
    localStorage.removeItem(GIST_TOKEN_STORAGE);
    localStorage.removeItem(GIST_ID_STORAGE);
    localStorage.removeItem(CLOUD_ROOM_ID_STORAGE);
    this.clearSyncKey();
    RealtimeSyncService.disconnect();
  }

  static getLastSyncTime(): string | null {
    return localStorage.getItem(SYNC_LAST_PULL_STORAGE);
  }

  /* =====================================================================
   * 2. Direct Offline QR Transfer (0 Server Dependency, 100% Reliable)
   * ===================================================================== */

  /**
   * Compress local tasks into a compact, serverless URL for scanning via camera
   */
  static async createDirectTransferUrl(): Promise<string> {
    if (typeof window === 'undefined') return '';

    const payload: CloudPayload = {
      version: '1.0',
      updatedAt: StorageService.getLastModified(),
      homework: StorageService.getHomework(),
      events: StorageService.getEvents(),
      deletedHwIds: StorageService.getDeletedHomeworkIds(),
    };

    const jsonStr = JSON.stringify(payload);

    try {
      if ('CompressionStream' in window) {
        const stream = new Blob([jsonStr]).stream().pipeThrough(new (window as any).CompressionStream('gzip'));
        const buffer = await new Response(stream).arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const origin = window.location.origin;
        const pathname = window.location.pathname;
        return `${origin}${pathname}#transfer=${base64}`;
      }
    } catch (e) {
      console.warn('CompressionStream failed, using raw base64', e);
    }

    // Fallback: standard base64 URL safe
    const base64 = btoa(encodeURIComponent(jsonStr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}#rawtransfer=${base64}`;
  }

  /**
   * Decode transfer data from URL hash
   */
  static async decodeTransferData(hash: string): Promise<{ success: boolean; countHw?: number; countEvents?: number; error?: string }> {
    try {
      let jsonStr = '';

      if (hash.includes('#transfer=')) {
        let base64 = hash.split('#transfer=')[1].trim();
        if (base64.includes('&')) base64 = base64.split('&')[0];
        if (base64.includes('#')) base64 = base64.split('#')[0];
        let b64 = base64.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4 !== 0) {
          b64 += '=';
        }
        const binStr = atob(b64);
        const decBytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) {
          decBytes[i] = binStr.charCodeAt(i);
        }

        if ('DecompressionStream' in window) {
          const decStream = new Blob([decBytes]).stream().pipeThrough(new (window as any).DecompressionStream('gzip'));
          jsonStr = await new Response(decStream).text();
        } else {
          return { success: false, error: 'Браузер не поддерживает распаковку данных' };
        }
      } else if (hash.includes('#rawtransfer=')) {
        let base64 = hash.split('#rawtransfer=')[1].trim();
        if (base64.includes('&')) base64 = base64.split('&')[0];
        if (base64.includes('#')) base64 = base64.split('#')[0];
        let b64 = base64.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4 !== 0) {
          b64 += '=';
        }
        jsonStr = decodeURIComponent(atob(b64));
      } else {
        return { success: false, error: 'Неверная ссылка передачи' };
      }

      const payload: CloudPayload = JSON.parse(jsonStr);
      if (!payload || !Array.isArray(payload.homework)) {
        return { success: false, error: 'Некорректный формат переданных заданий' };
      }

      // 1. Record tombstones first
      if (Array.isArray(payload.deletedHwIds)) {
        StorageService.recordDeletedHomeworkIds(payload.deletedHwIds);
      }

      // 2. Save active tasks and events
      StorageService.saveHomework(payload.homework);
      if (Array.isArray(payload.events)) {
        StorageService.saveEvents(payload.events);
      }

      const updateTimestamp = payload.updatedAt || new Date().toISOString();
      StorageService.recordLastModified(updateTimestamp);
      localStorage.setItem(SYNC_LAST_PULL_STORAGE, updateTimestamp);

      // 3. Broadcast to all other devices so everyone stays synced
      RealtimeSyncService.broadcast();

      return {
        success: true,
        countHw: payload.homework.length,
        countEvents: payload.events ? payload.events.length : 0,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка импорта данных';
      return { success: false, error: msg };
    }
  }

  /**
   * Generate QR Code image URL for any target URL
   */
  static getQrCodeForUrl(targetUrl: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(targetUrl)}`;
  }

  /* =====================================================================
   * 3. GitHub Gist Cloud Sync (Permanent, Private, Unlimited Size)
   * ===================================================================== */

  /**
   * Create a new private Gist for student planner tasks
   */
  static async createGistSync(token: string): Promise<{ success: boolean; gistId?: string; error?: string }> {
    const cleanToken = token.trim();
    if (!cleanToken) return { success: false, error: 'Укажите токен GitHub' };

    try {
      const payload: CloudPayload = {
        version: '1.0',
        updatedAt: StorageService.getLastModified(),
        homework: StorageService.getHomework(),
        events: StorageService.getEvents(),
        deletedHwIds: StorageService.getDeletedHomeworkIds(),
      };

      const res = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: 'КГУ Расписание и Домашние задания (Синхронизация студента)',
          public: false,
          files: {
            'ksu_planner_sync.json': {
              content: JSON.stringify(payload, null, 2),
            },
          },
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          return { success: false, error: 'Неверный токен GitHub. Проверьте права (scope: gist).' };
        }
        throw new Error(`Ошибка GitHub API (${res.status})`);
      }

      const resJson = await res.json();
      const gistId = resJson.id;

      this.setGistCredentials(cleanToken, gistId);
      localStorage.setItem(SYNC_LAST_PULL_STORAGE, payload.updatedAt);

      return { success: true, gistId };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не удалось связаться с GitHub';
      return { success: false, error: msg };
    }
  }

  /**
   * Connect to an existing private Gist on another device (token is optional for reading)
   */
  static async connectGistSync(
    gistId: string,
    token?: string
  ): Promise<{ success: boolean; countHw?: number; countEvents?: number; error?: string }> {
    const cleanGistId = gistId ? gistId.trim() : '';
    const cleanToken = token ? token.trim() : '';

    if (!cleanGistId) {
      return { success: false, error: 'Введите ID связки Gist' };
    }

    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
      };
      if (cleanToken) {
        headers.Authorization = `Bearer ${cleanToken}`;
      }

      const res = await fetch(`https://api.github.com/gists/${cleanGistId}`, { headers });

      if (!res.ok) {
        if (res.status === 404) {
          return { success: false, error: 'Gist с таким ID не найден на GitHub.' };
        }
        if (res.status === 401) {
          return { success: false, error: 'Ошибка доступа к Gist. Проверьте ID или токен.' };
        }
        throw new Error(`Ошибка GitHub API (${res.status})`);
      }

      const resJson = await res.json();
      const fileObj = resJson.files?.['ksu_planner_sync.json'];
      if (!fileObj || !fileObj.content) {
        return { success: false, error: 'В выбранном Gist нет файла ksu_planner_sync.json' };
      }

      const cloudData: CloudPayload = JSON.parse(fileObj.content);

      // Record tombstones first
      if (Array.isArray(cloudData.deletedHwIds)) {
        StorageService.recordDeletedHomeworkIds(cloudData.deletedHwIds);
      }

      // Save homework and events
      StorageService.saveHomework(cloudData.homework);
      if (Array.isArray(cloudData.events)) {
        StorageService.saveEvents(cloudData.events);
      }

      const updateTimestamp = cloudData.updatedAt || new Date().toISOString();
      StorageService.recordLastModified(updateTimestamp);

      this.setGistCredentials(cleanToken, cleanGistId);
      localStorage.setItem(SYNC_LAST_PULL_STORAGE, updateTimestamp);

      // Realtime live sync channel
      RealtimeSyncService.broadcast();

      return {
        success: true,
        countHw: cloudData.homework.length,
        countEvents: cloudData.events ? cloudData.events.length : 0,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка подключения к GitHub Gist';
      return { success: false, error: msg };
    }
  }

  /**
   * Get direct URL to pair this Gist on another device
   */
  static getGistPairingUrl(gistId: string, token?: string): string {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const tParam = token ? `&token=${encodeURIComponent(token)}` : '';
    return `${origin}${pathname}#gist=${encodeURIComponent(gistId)}${tParam}`;
  }

  /* =====================================================================
   * 4. Central Push and Pull Coordinator
   * ===================================================================== */

  /**
   * Push local tasks and events to active cloud store
   */
  static async pushToCloud(): Promise<boolean> {
    const token = this.getGistToken();
    const gistId = this.getGistId();

    try {
      const updatedAt = new Date().toISOString();
      StorageService.recordLastModified(updatedAt);

      const payload: CloudPayload = {
        version: '1.0',
        updatedAt,
        homework: StorageService.getHomework(),
        events: StorageService.getEvents(),
        deletedHwIds: StorageService.getDeletedHomeworkIds(),
      };

      // 1. Instant zero-auth realtime broadcast over HTTPS port 443
      RealtimeSyncService.broadcast();

      // 2. Push to GitHub Gist if personal access token is configured
      if (token && gistId) {
        try {
          await fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              files: {
                'ksu_planner_sync.json': {
                  content: JSON.stringify(payload, null, 2),
                },
              },
            }),
          });
        } catch (e) {
          console.error('Failed to push to GitHub Gist', e);
        }
      }

      localStorage.setItem(SYNC_LAST_PULL_STORAGE, updatedAt);
      return true;
    } catch (e) {
      console.error('pushToCloud error', e);
      return false;
    }
  }

  /**
   * Pull and smart-merge tasks from cloud store (bi-directional synchronization)
   */
  static async pullFromCloud(): Promise<{ updated: boolean; countHw?: number }> {
    const token = this.getGistToken();
    const gistId = this.getGistId();

    let gistPayload: CloudPayload | null = null;
    let roomPayload: CloudPayload | null = null;

    // 1. Pull from Gist if gistId is configured (works without token for reading)
    if (gistId) {
      try {
        const headers: Record<string, string> = {
          Accept: 'application/vnd.github+json',
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(`https://api.github.com/gists/${gistId}`, { headers });
        if (res.ok) {
          const resJson = await res.json();
          const fileObj = resJson.files?.['ksu_planner_sync.json'];
          if (fileObj && fileObj.content) {
            gistPayload = JSON.parse(fileObj.content);
          }
        }
      } catch (e) {
        console.warn('Gist pull failed', e);
      }
    }

    // 2. Pull from unmetered realtime cloud channel
    try {
      const liveData = await RealtimeSyncService.pullLatestPayload();
      if (liveData) {
        roomPayload = {
          version: liveData.version || '1.0',
          updatedAt: liveData.updatedAt,
          homework: liveData.homework || [],
          events: liveData.events || [],
          deletedHwIds: liveData.deletedHwIds || [],
        };
      }
    } catch (e) {
      console.warn('Realtime channel pull failed', e);
    }

    if (!gistPayload && !roomPayload) {
      return { updated: false };
    }

    // 1. Merge tombstones (any task deleted on either device stays deleted permanently)
    const allRemoteTombstones: string[] = [];
    if (Array.isArray(gistPayload?.deletedHwIds)) allRemoteTombstones.push(...gistPayload.deletedHwIds);
    if (Array.isArray(roomPayload?.deletedHwIds)) allRemoteTombstones.push(...roomPayload.deletedHwIds);
    if (allRemoteTombstones.length > 0) {
      StorageService.recordDeletedHomeworkIds(allRemoteTombstones);
    }
    const allDeletedIds = new Set(StorageService.getDeletedHomeworkIds());

    // 2. Collect remote homework items from both sources (prefer newer item)
    const remoteHwMap = new Map<string, Homework>();
    const feedHw = (list?: Homework[]) => {
      if (!Array.isArray(list)) return;
      for (const h of list) {
        if (allDeletedIds.has(h.id)) continue;
        const existing = remoteHwMap.get(h.id);
        if (!existing) {
          remoteHwMap.set(h.id, h);
        } else {
          const eTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
          const hTime = new Date(h.updatedAt || h.createdAt || 0).getTime();
          if (hTime > eTime) {
            remoteHwMap.set(h.id, h);
          }
        }
      }
    };

    feedHw(gistPayload?.homework);
    feedHw(roomPayload?.homework);

    // 3. Smart Merge with local tasks
    const localHw = StorageService.getHomework().filter((h) => !allDeletedIds.has(h.id));
    const mergedMap = new Map<string, Homework>(remoteHwMap);

    let localHadUniqueOrNewer = false;
    for (const h of localHw) {
      const remoteItem = mergedMap.get(h.id);
      if (!remoteItem) {
        // Task exists locally but is not in remote yet!
        mergedMap.set(h.id, h);
        localHadUniqueOrNewer = true;
      } else {
        const localTime = new Date(h.updatedAt || h.createdAt || 0).getTime();
        const remoteTime = new Date(remoteItem.updatedAt || remoteItem.createdAt || 0).getTime();
        if (localTime > remoteTime) {
          mergedMap.set(h.id, h);
          localHadUniqueOrNewer = true;
        }
      }
    }

    const finalHw = Array.from(mergedMap.values());

    // Check if local tasks changed
    const localRaw = JSON.stringify(localHw);
    const finalRaw = JSON.stringify(finalHw);
    const hasLocalChanges = localRaw !== finalRaw;

    if (hasLocalChanges) {
      StorageService.saveHomework(finalHw);
    }

    // 4. Merge custom calendar events
    const remoteEvents = [...(gistPayload?.events || []), ...(roomPayload?.events || [])];
    if (remoteEvents.length > 0) {
      const localEvents = StorageService.getEvents();
      const eventMap = new Map<string, CalendarCustomEvent>();
      for (const e of remoteEvents) {
        eventMap.set(e.id, e);
      }
      for (const e of localEvents) {
        if (!eventMap.has(e.id)) {
          eventMap.set(e.id, e);
          localHadUniqueOrNewer = true;
        }
      }
      StorageService.saveEvents(Array.from(eventMap.values()));
    }

    // 5. If local had newer changes or merged data, push back so all devices stay in sync!
    if (localHadUniqueOrNewer) {
      this.pushToCloud();
    }

    const latestTs = new Date().toISOString();
    localStorage.setItem(SYNC_LAST_PULL_STORAGE, latestTs);

    return { updated: hasLocalChanges, countHw: finalHw.length };
  }
}
