import { Homework } from '../types/homework';
import { CalendarCustomEvent } from '../types/calendar';
import { StorageService } from './storageService';

const SYNC_KEY_STORAGE = 'ksu_student_sync_key';
const SYNC_LAST_PULL_STORAGE = 'ksu_student_sync_last_pull';
const GIST_TOKEN_STORAGE = 'ksu_student_gist_token';
const GIST_ID_STORAGE = 'ksu_student_gist_id';

export interface CloudPayload {
  version: string;
  updatedAt: string;
  homework: Homework[];
  events: CalendarCustomEvent[];
  deletedHwIds?: string[];
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
    return localStorage.getItem(GIST_ID_STORAGE);
  }

  static setGistCredentials(token: string, gistId: string): void {
    localStorage.setItem(GIST_TOKEN_STORAGE, token.trim());
    localStorage.setItem(GIST_ID_STORAGE, gistId.trim());
    this.setSyncKey(`GIST-${gistId.trim().substring(0, 8).toUpperCase()}`);
  }

  static clearGistCredentials(): void {
    localStorage.removeItem(GIST_TOKEN_STORAGE);
    localStorage.removeItem(GIST_ID_STORAGE);
    this.clearSyncKey();
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
        const base64 = hash.split('#transfer=')[1].trim();
        const binStr = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
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
        const base64 = hash.split('#rawtransfer=')[1].trim();
        jsonStr = decodeURIComponent(atob(base64.replace(/-/g, '+').replace(/_/g, '/')));
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
   * Connect to an existing private Gist on another device
   */
  static async connectGistSync(
    token: string,
    gistId: string
  ): Promise<{ success: boolean; countHw?: number; countEvents?: number; error?: string }> {
    const cleanToken = token.trim();
    const cleanGistId = gistId.trim();

    if (!cleanToken || !cleanGistId) {
      return { success: false, error: 'Заполните токен и ID связки' };
    }

    try {
      const res = await fetch(`https://api.github.com/gists/${cleanGistId}`, {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: 'application/vnd.github+json',
        },
      });

      if (!res.ok) {
        if (res.status === 404) {
          return { success: false, error: 'Gist с таким ID не найден на GitHub.' };
        }
        if (res.status === 401) {
          return { success: false, error: 'Неверный токен GitHub или нет доступа к Gist.' };
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

  /* =====================================================================
   * 4. Central Push and Pull Coordinator
   * ===================================================================== */

  /**
   * Push local tasks and events to active cloud store
   */
  static async pushToCloud(): Promise<boolean> {
    const token = this.getGistToken();
    const gistId = this.getGistId();

    if (token && gistId) {
      try {
        const updatedAt = StorageService.getLastModified();
        const payload: CloudPayload = {
          version: '1.0',
          updatedAt,
          homework: StorageService.getHomework(),
          events: StorageService.getEvents(),
          deletedHwIds: StorageService.getDeletedHomeworkIds(),
        };

        const res = await fetch(`https://api.github.com/gists/${gistId}`, {
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

        if (res.ok) {
          localStorage.setItem(SYNC_LAST_PULL_STORAGE, updatedAt);
          return true;
        }
      } catch (e) {
        console.error('Failed to push to GitHub Gist', e);
      }
    }

    return false;
  }

  /**
   * Pull newer tasks from cloud store (strictly timestamp guarded)
   */
  static async pullFromCloud(): Promise<{ updated: boolean; countHw?: number }> {
    const token = this.getGistToken();
    const gistId = this.getGistId();

    if (token && gistId) {
      try {
        const res = await fetch(`https://api.github.com/gists/${gistId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
          },
        });

        if (!res.ok) return { updated: false };

        const resJson = await res.json();
        const fileObj = resJson.files?.['ksu_planner_sync.json'];
        if (!fileObj || !fileObj.content) return { updated: false };

        const cloudData: CloudPayload = JSON.parse(fileObj.content);

        const localTime = new Date(StorageService.getLastModified()).getTime();
        const cloudTime = new Date(cloudData.updatedAt).getTime();

        // ONLY accept cloud data if it is strictly newer than our local state
        if (cloudTime > localTime) {
          if (Array.isArray(cloudData.deletedHwIds)) {
            StorageService.recordDeletedHomeworkIds(cloudData.deletedHwIds);
          }
          StorageService.saveHomework(cloudData.homework);
          if (Array.isArray(cloudData.events)) {
            StorageService.saveEvents(cloudData.events);
          }
          StorageService.recordLastModified(cloudData.updatedAt);
          localStorage.setItem(SYNC_LAST_PULL_STORAGE, cloudData.updatedAt);
          return { updated: true, countHw: cloudData.homework.length };
        } else if (localTime > cloudTime) {
          // Local has newer changes that haven't reached cloud -> push to cloud
          this.pushToCloud();
          return { updated: false };
        }
      } catch (e) {
        console.error('Failed to pull from GitHub Gist', e);
      }
    }

    return { updated: false };
  }
}
