import { Homework } from '../types/homework';
import { CalendarCustomEvent } from '../types/calendar';
import { StorageService } from './storageService';

const SYNC_KEY_STORAGE = 'ksu_student_sync_key';
const SYNC_LAST_PULL_STORAGE = 'ksu_student_sync_last_pull';
const API_BASE = 'https://api.restful-api.dev/objects';

export interface CloudPayload {
  version: string;
  updatedAt: string;
  homework: Homework[];
  events: CalendarCustomEvent[];
}

export class SyncService {
  static getSyncKey(): string | null {
    return localStorage.getItem(SYNC_KEY_STORAGE);
  }

  static setSyncKey(key: string): void {
    localStorage.setItem(SYNC_KEY_STORAGE, key.trim());
  }

  static clearSyncKey(): void {
    localStorage.removeItem(SYNC_KEY_STORAGE);
    localStorage.removeItem(SYNC_LAST_PULL_STORAGE);
  }

  static getLastSyncTime(): string | null {
    return localStorage.getItem(SYNC_LAST_PULL_STORAGE);
  }

  /**
   * Create a new sync room in the cloud and upload current tasks
   */
  static async createSyncRoom(): Promise<{ success: boolean; syncKey?: string; error?: string }> {
    try {
      const payload: CloudPayload = {
        version: '1.0',
        updatedAt: new Date().toISOString(),
        homework: StorageService.getHomework(),
        events: StorageService.getEvents(),
      };

      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: 'KSU_STUDENT_SYNC',
          data: payload,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const resJson = await response.json();
      const rawId = resJson.id;
      const cleanKey = `KGU-${rawId}`;

      this.setSyncKey(cleanKey);
      localStorage.setItem(SYNC_LAST_PULL_STORAGE, new Date().toISOString());

      return { success: true, syncKey: cleanKey };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка соединения с облаком';
      return { success: false, error: msg };
    }
  }

  /**
   * Connect to an existing sync room and download data
   */
  static async connectToSyncRoom(
    inputKey: string
  ): Promise<{ success: boolean; countHw?: number; countEvents?: number; error?: string }> {
    const rawId = inputKey.trim().replace(/^KGU-/, '');
    if (!rawId) {
      return { success: false, error: 'Неверный формат ключа' };
    }

    try {
      const response = await fetch(`${API_BASE}/${rawId}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'Ключ синхронизации не найден. Проверьте код.' };
        }
        throw new Error(`HTTP Error ${response.status}`);
      }

      const resJson = await response.json();
      const cloudData: CloudPayload = resJson.data;

      if (!cloudData || !Array.isArray(cloudData.homework)) {
        return { success: false, error: 'Облачные данные имеют некорректный формат' };
      }

      // Save to local storage
      StorageService.saveHomework(cloudData.homework);
      if (Array.isArray(cloudData.events)) {
        StorageService.saveEvents(cloudData.events);
      }

      this.setSyncKey(`KGU-${rawId}`);
      localStorage.setItem(SYNC_LAST_PULL_STORAGE, new Date().toISOString());

      return {
        success: true,
        countHw: cloudData.homework.length,
        countEvents: cloudData.events ? cloudData.events.length : 0,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не удалось связаться с облаком';
      return { success: false, error: msg };
    }
  }

  /**
   * Push local tasks and events to the cloud room
   */
  static async pushToCloud(): Promise<boolean> {
    const key = this.getSyncKey();
    if (!key) return false;

    const rawId = key.replace(/^KGU-/, '');

    try {
      const payload: CloudPayload = {
        version: '1.0',
        updatedAt: new Date().toISOString(),
        homework: StorageService.getHomework(),
        events: StorageService.getEvents(),
      };

      const response = await fetch(`${API_BASE}/${rawId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: 'KSU_STUDENT_SYNC',
          data: payload,
        }),
      });

      if (response.ok) {
        localStorage.setItem(SYNC_LAST_PULL_STORAGE, new Date().toISOString());
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Pull newer tasks from the cloud
   */
  static async pullFromCloud(): Promise<{ updated: boolean; countHw?: number }> {
    const key = this.getSyncKey();
    if (!key) return { updated: false };

    const rawId = key.replace(/^KGU-/, '');

    try {
      const response = await fetch(`${API_BASE}/${rawId}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) return { updated: false };

      const resJson = await response.json();
      const cloudData: CloudPayload = resJson.data;

      if (cloudData && Array.isArray(cloudData.homework)) {
        StorageService.saveHomework(cloudData.homework);
        if (Array.isArray(cloudData.events)) {
          StorageService.saveEvents(cloudData.events);
        }
        localStorage.setItem(SYNC_LAST_PULL_STORAGE, new Date().toISOString());
        return { updated: true, countHw: cloudData.homework.length };
      }

      return { updated: false };
    } catch {
      return { updated: false };
    }
  }
}
