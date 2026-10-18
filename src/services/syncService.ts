import { Homework } from '../types/homework';
import { CalendarCustomEvent } from '../types/calendar';
import { UserSettings } from '../types/settings';
import { StorageService } from './storageService';

const FIREBASE_URL_STORAGE = 'ksu_student_firebase_url';
const SYNC_LAST_PULL_STORAGE = 'ksu_student_sync_last_pull';
const LEGACY_CUSTOM_URL_STORAGE = 'ksu_student_custom_sync_url';
const LEGACY_REST_ROOM_ID_STORAGE = 'ksu_student_rest_room_id';

export interface CloudPayload {
  version: string;
  updatedAt: string;
  homework: Homework[];
  events: CalendarCustomEvent[];
  deletedHwIds?: string[];
  deletedEventIds?: string[];
  settings?: UserSettings;
}

export function normalizeFirebaseUrl(url: string): string {
  let clean = url.trim();
  if (!clean) return '';
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }
  clean = clean.replace(/\/+$/, '');
  if (!clean.endsWith('.json')) {
    clean = `${clean}/sync.json`;
  }
  return clean;
}

export class SyncService {
  private static updateListeners: Set<() => void> = new Set();

  static onSyncUpdate(cb: () => void): () => void {
    this.updateListeners.add(cb);
    return () => {
      this.updateListeners.delete(cb);
    };
  }

  static notifyUpdate(): void {
    for (const cb of this.updateListeners) {
      try {
        cb();
      } catch (e) {
        console.error('[SyncService] notifyUpdate error', e);
      }
    }
  }

  /* =====================================================================
   * 1. Google Firebase Realtime Database Configuration
   * ===================================================================== */

  static getFirebaseUrl(): string | null {
    const stored =
      localStorage.getItem(FIREBASE_URL_STORAGE) ||
      localStorage.getItem(LEGACY_CUSTOM_URL_STORAGE);
    if (stored && stored.trim()) return stored.trim();
    return null;
  }

  static setFirebaseUrl(url: string | null): void {
    if (url && url.trim()) {
      const clean = normalizeFirebaseUrl(url);
      localStorage.setItem(FIREBASE_URL_STORAGE, clean);
      localStorage.setItem(LEGACY_CUSTOM_URL_STORAGE, clean);
    } else {
      localStorage.removeItem(FIREBASE_URL_STORAGE);
      localStorage.removeItem(LEGACY_CUSTOM_URL_STORAGE);
    }
  }

  static clearFirebaseUrl(): void {
    localStorage.removeItem(FIREBASE_URL_STORAGE);
    localStorage.removeItem(LEGACY_CUSTOM_URL_STORAGE);
    localStorage.removeItem(SYNC_LAST_PULL_STORAGE);
  }

  static isFirebaseConfigured(): boolean {
    return Boolean(this.getFirebaseUrl());
  }

  static getLastSyncTime(): string | null {
    return localStorage.getItem(SYNC_LAST_PULL_STORAGE);
  }

  /**
   * Generates a link that, when opened on another device (e.g. mobile),
   * instantly configures the same Firebase database without typing.
   */
  static getFirebasePairingUrl(url?: string): string {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const fUrl = url || this.getFirebaseUrl() || '';
    return `${origin}${pathname}#firebase=${encodeURIComponent(fUrl)}`;
  }

  /**
   * Generates a QR Code image URL for any target URL
   */
  static getQrCodeForUrl(targetUrl: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(targetUrl)}`;
  }

  /* =====================================================================
   * 2. Core Cloud Push & Pull (Google Firebase HTTPS Port 443)
   * ===================================================================== */

  /**
   * Push local tasks and events to Google Firebase Realtime Database
   */
  static async pushToCloud(): Promise<boolean> {
    const firebaseUrl = this.getFirebaseUrl();
    if (!firebaseUrl) {
      return false;
    }

    try {
      const updatedAt = new Date().toISOString();
      StorageService.recordLastModified(updatedAt);

      const payload: CloudPayload = {
        version: '2.0',
        updatedAt,
        homework: StorageService.getHomework(),
        events: StorageService.getEvents(),
        deletedHwIds: StorageService.getDeletedHomeworkIds(),
        deletedEventIds: StorageService.getDeletedEventIds(),
        settings: StorageService.getSettings(),
      };

      const res = await fetch(firebaseUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.warn('[SyncService] Firebase push failed with status:', res.status);
        return false;
      }

      localStorage.setItem(SYNC_LAST_PULL_STORAGE, updatedAt);
      return true;
    } catch (e) {
      console.error('[SyncService] pushToCloud error', e);
      return false;
    }
  }

  /**
   * Pull and smart-merge tasks from Google Firebase Realtime Database (bi-directional sync)
   */
  static async pullFromCloud(): Promise<{ updated: boolean; countHw?: number; error?: string }> {
    const firebaseUrl = this.getFirebaseUrl();
    if (!firebaseUrl) {
      return { updated: false };
    }

    try {
      const res = await fetch(firebaseUrl, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        if (res.status === 404 || res.status === 401) {
          return {
            updated: false,
            error: `База данных вернула статус ${res.status}. Проверьте правила доступа в Firebase.`,
          };
        }
        return { updated: false, error: `Ошибка связи с облаком (${res.status})` };
      }

      const remoteData = await res.json();
      if (!remoteData || typeof remoteData !== 'object') {
        return { updated: false };
      }

      const prevHomework = StorageService.getHomework();
      const prevEvents = StorageService.getEvents();

      // 1. Merge tombstones
      if (Array.isArray(remoteData.deletedHwIds) && remoteData.deletedHwIds.length > 0) {
        StorageService.recordDeletedHomeworkIds(remoteData.deletedHwIds);
      }
      if (Array.isArray(remoteData.deletedEventIds) && remoteData.deletedEventIds.length > 0) {
        StorageService.recordDeletedEventIds(remoteData.deletedEventIds);
      }
      const allDeletedIds = new Set(StorageService.getDeletedHomeworkIds());
      const allDeletedEvtIds = new Set(StorageService.getDeletedEventIds());

      // 2. Collect remote tasks
      const remoteHwMap = new Map<string, Homework>();
      if (Array.isArray(remoteData.homework)) {
        for (const h of remoteData.homework) {
          if (!h || !h.id || allDeletedIds.has(h.id)) continue;
          remoteHwMap.set(h.id, h);
        }
      }

      // 3. Merge with local tasks (Last-Write-Wins)
      let localHadNewer = false;
      const localHw = prevHomework.filter((h) => !allDeletedIds.has(h.id));
      const mergedMap = new Map<string, Homework>(remoteHwMap);

      for (const h of localHw) {
        const remoteItem = mergedMap.get(h.id);
        if (!remoteItem) {
          mergedMap.set(h.id, h);
          localHadNewer = true;
        } else {
          const localTime = new Date(h.updatedAt || h.createdAt || 0).getTime();
          const remoteTime = new Date(remoteItem.updatedAt || remoteItem.createdAt || 0).getTime();
          if (localTime > remoteTime) {
            mergedMap.set(h.id, h);
            localHadNewer = true;
          }
        }
      }

      const finalHw = Array.from(mergedMap.values());
      const prevHwJson = JSON.stringify(prevHomework);
      const finalHwJson = JSON.stringify(finalHw);
      const hwChanged = prevHwJson !== finalHwJson;

      if (hwChanged) {
        StorageService.saveHomework(finalHw);
      }

      // 4. Merge custom calendar events
      let eventsChanged = false;
      const remoteEvents = (Array.isArray(remoteData.events) ? remoteData.events : []).filter(
        (e: any) => e && e.id && !allDeletedEvtIds.has(e.id)
      );
      const localEvts = prevEvents.filter((e) => !allDeletedEvtIds.has(e.id));
      if (remoteEvents.length > 0 || localEvts.length !== prevEvents.length) {
        const eventMap = new Map<string, CalendarCustomEvent>();
        for (const e of remoteEvents) {
          eventMap.set(e.id, e);
        }
        for (const e of localEvts) {
          if (!eventMap.has(e.id)) {
            eventMap.set(e.id, e);
            localHadNewer = true;
          }
        }
        const finalEvents = Array.from(eventMap.values());
        if (JSON.stringify(prevEvents) !== JSON.stringify(finalEvents)) {
          eventsChanged = true;
          StorageService.saveEvents(finalEvents);
        }
      }

      // 5. Merge settings
      let settingsChanged = false;
      if (remoteData.settings && typeof remoteData.settings === 'object') {
        const localSettings = StorageService.getSettings();
        const remoteSettings = remoteData.settings;
        let diff = false;
        const mergedSettings = { ...localSettings };
        for (const key of Object.keys(remoteSettings)) {
          if (remoteSettings[key] !== undefined && remoteSettings[key] !== (localSettings as any)[key]) {
            (mergedSettings as any)[key] = remoteSettings[key];
            diff = true;
          }
        }
        if (diff) {
          StorageService.saveSettings(mergedSettings);
          settingsChanged = true;
        }
      }

      const updateTimestamp = remoteData.updatedAt || new Date().toISOString();
      localStorage.setItem(SYNC_LAST_PULL_STORAGE, updateTimestamp);

      // If local device had items newer than cloud, push the merged superset back to cloud
      if (localHadNewer) {
        this.pushToCloud();
      }

      const updated = hwChanged || eventsChanged || settingsChanged;
      if (updated) {
        this.notifyUpdate();
      }

      return {
        updated,
        countHw: finalHw.length,
      };
    } catch (e: any) {
      console.warn('[SyncService] pullFromCloud error', e);
      return { updated: false, error: e?.message || 'Не удалось связаться с облаком' };
    }
  }

  /* =====================================================================
   * 3. Direct Offline QR Transfer (0 Server Dependency, 100% Reliable)
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
      deletedEventIds: StorageService.getDeletedEventIds(),
      settings: StorageService.getSettings(),
    };

    const jsonStr = JSON.stringify(payload);

    try {
      if ('CompressionStream' in window) {
        const stream = new Blob([jsonStr])
          .stream()
          .pipeThrough(new (window as any).CompressionStream('gzip'));
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

    const base64 = btoa(encodeURIComponent(jsonStr))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}#rawtransfer=${base64}`;
  }

  /**
   * Decode transfer data from URL hash
   */
  static async decodeTransferData(hash: string): Promise<{
    success: boolean;
    countHw?: number;
    countEvents?: number;
    error?: string;
  }> {
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
          const decStream = new Blob([decBytes])
            .stream()
            .pipeThrough(new (window as any).DecompressionStream('gzip'));
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

      if (Array.isArray(payload.deletedHwIds)) {
        StorageService.recordDeletedHomeworkIds(payload.deletedHwIds);
      }
      if (Array.isArray(payload.deletedEventIds)) {
        StorageService.recordDeletedEventIds(payload.deletedEventIds);
      }

      StorageService.saveHomework(payload.homework);
      if (Array.isArray(payload.events)) {
        StorageService.saveEvents(payload.events);
      }

      if (payload.settings && typeof payload.settings === 'object') {
        const localSettings = StorageService.getSettings();
        StorageService.saveSettings({
          ...localSettings,
          ...payload.settings,
        });
      }

      const updateTimestamp = payload.updatedAt || new Date().toISOString();
      StorageService.recordLastModified(updateTimestamp);
      localStorage.setItem(SYNC_LAST_PULL_STORAGE, updateTimestamp);

      this.notifyUpdate();

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

  /* =====================================================================
   * 4. Backward Compatibility Stubs
   * ===================================================================== */
  static getGistToken(): string | null {
    return null;
  }
  static getGistId(): string | null {
    return null;
  }
  static getRestRoomId(): string {
    return localStorage.getItem(LEGACY_REST_ROOM_ID_STORAGE) || 'legacy';
  }
  static setRestRoomId(id: string): void {
    if (id) localStorage.setItem(LEGACY_REST_ROOM_ID_STORAGE, id.trim());
  }
  static getCustomSyncUrl(): string | null {
    return this.getFirebaseUrl();
  }
  static setCustomSyncUrl(url: string | null): void {
    this.setFirebaseUrl(url);
  }
  static isSyncConfigured(): boolean {
    return this.isFirebaseConfigured();
  }
  static clearGistCredentials(): void {
    this.clearFirebaseUrl();
  }
}
