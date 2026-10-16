import { Homework } from '../types/homework';
import { CalendarCustomEvent } from '../types/calendar';
import { StorageService } from './storageService';

const SYNC_KEY_STORAGE = 'ksu_student_sync_key';
const SYNC_LAST_PULL_STORAGE = 'ksu_student_sync_last_pull';
const NTFY_BASE = 'https://ntfy.sh';

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
    localStorage.setItem(SYNC_KEY_STORAGE, key.trim().toUpperCase());
  }

  static clearSyncKey(): void {
    localStorage.removeItem(SYNC_KEY_STORAGE);
    localStorage.removeItem(SYNC_LAST_PULL_STORAGE);
  }

  static getLastSyncTime(): string | null {
    return localStorage.getItem(SYNC_LAST_PULL_STORAGE);
  }

  /**
   * Normalize room code and return safe ntfy topic name
   */
  private static getTopicFromKey(key: string): string {
    const clean = key.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    return `ksu_sync_${clean.toLowerCase()}`;
  }

  /**
   * Generate an unambiguous 6-character room code (e.g. KGU-8X2M9K)
   */
  static generateSyncCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `KGU-${code}`;
  }

  /**
   * Get direct share URL for pairing with QR code or link
   */
  static getShareUrl(key: string): string {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}#sync=${encodeURIComponent(key)}`;
  }

  /**
   * Generate a quick QR code image URL for mobile camera scanning
   */
  static getQrCodeUrl(key: string): string {
    const shareUrl = this.getShareUrl(key);
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(shareUrl)}`;
  }

  /**
   * Create a new sync room in the cloud and upload current tasks
   */
  static async createSyncRoom(): Promise<{ success: boolean; syncKey?: string; error?: string }> {
    try {
      const syncKey = this.generateSyncCode();
      const topic = this.getTopicFromKey(syncKey);

      const payload: CloudPayload = {
        version: '1.0',
        updatedAt: new Date().toISOString(),
        homework: StorageService.getHomework(),
        events: StorageService.getEvents(),
      };

      const response = await fetch(`${NTFY_BASE}/${topic}`, {
        method: 'POST',
        headers: {
          'Title': 'KSU_STUDENT_SYNC',
          'Priority': 'urgent',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Ошибка облака (HTTP ${response.status})`);
      }

      this.setSyncKey(syncKey);
      localStorage.setItem(SYNC_LAST_PULL_STORAGE, payload.updatedAt);

      return { success: true, syncKey };
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
    const raw = inputKey.trim().toUpperCase();
    if (!raw) {
      return { success: false, error: 'Введите код связки' };
    }

    const cleanKey = raw.startsWith('KGU-') ? raw : `KGU-${raw}`;
    const topic = this.getTopicFromKey(cleanKey);

    try {
      const response = await fetch(`${NTFY_BASE}/${topic}/json?poll=1`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'Код связки не найден. Проверьте правильность ввода.' };
        }
        throw new Error(`HTTP Error ${response.status}`);
      }

      const text = await response.text();
      const lines = text.trim().split('\n').filter(Boolean);

      let cloudData: CloudPayload | null = null;

      // Read from latest message to oldest
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const msg = JSON.parse(lines[i]);
          if (msg.event === 'message') {
            if (msg.attachment && msg.attachment.url) {
              const fileRes = await fetch(msg.attachment.url);
              if (fileRes.ok) {
                cloudData = await fileRes.json();
                break;
              }
            } else if (msg.message) {
              cloudData = JSON.parse(msg.message);
              break;
            }
          }
        } catch {
          // ignore parsing error and continue
        }
      }

      if (!cloudData || !Array.isArray(cloudData.homework)) {
        return {
          success: false,
          error: 'Данные связки пока не найдены в облаке. Убедитесь, что на первом устройстве была нажата кнопка «Создать код».',
        };
      }

      // Save downloaded data into local storage
      StorageService.saveHomework(cloudData.homework);
      if (Array.isArray(cloudData.events)) {
        StorageService.saveEvents(cloudData.events);
      }

      this.setSyncKey(cleanKey);
      localStorage.setItem(SYNC_LAST_PULL_STORAGE, cloudData.updatedAt || new Date().toISOString());

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

    const topic = this.getTopicFromKey(key);

    try {
      const payload: CloudPayload = {
        version: '1.0',
        updatedAt: new Date().toISOString(),
        homework: StorageService.getHomework(),
        events: StorageService.getEvents(),
      };

      const response = await fetch(`${NTFY_BASE}/${topic}`, {
        method: 'POST',
        headers: {
          'Title': 'KSU_STUDENT_SYNC',
          'Priority': 'urgent',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        localStorage.setItem(SYNC_LAST_PULL_STORAGE, payload.updatedAt);
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

    const topic = this.getTopicFromKey(key);

    try {
      const response = await fetch(`${NTFY_BASE}/${topic}/json?poll=1`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) return { updated: false };

      const text = await response.text();
      const lines = text.trim().split('\n').filter(Boolean);

      let cloudData: CloudPayload | null = null;
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const msg = JSON.parse(lines[i]);
          if (msg.event === 'message') {
            if (msg.attachment && msg.attachment.url) {
              const fileRes = await fetch(msg.attachment.url);
              if (fileRes.ok) {
                cloudData = await fileRes.json();
                break;
              }
            } else if (msg.message) {
              cloudData = JSON.parse(msg.message);
              break;
            }
          }
        } catch {
          // ignore
        }
      }

      if (cloudData && Array.isArray(cloudData.homework)) {
        const lastLocal = localStorage.getItem(SYNC_LAST_PULL_STORAGE);
        // If updatedAt is newer or different, save
        if (!lastLocal || cloudData.updatedAt !== lastLocal) {
          StorageService.saveHomework(cloudData.homework);
          if (Array.isArray(cloudData.events)) {
            StorageService.saveEvents(cloudData.events);
          }
          localStorage.setItem(SYNC_LAST_PULL_STORAGE, cloudData.updatedAt);
          return { updated: true, countHw: cloudData.homework.length };
        }
      }

      return { updated: false };
    } catch {
      return { updated: false };
    }
  }
}
