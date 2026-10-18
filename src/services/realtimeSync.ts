import { StorageService } from './storageService';
import { SyncService } from './syncService';
import { Homework } from '../types/homework';
import { CalendarCustomEvent } from '../types/calendar';

const REALTIME_ROOM_STORAGE = 'ksu_student_realtime_room';
const DEVICE_ID_STORAGE = 'ksu_student_device_id';
const PENDING_SYNC_STORAGE = 'ksu_student_pending_sync';
const LAST_SYNCED_TIME_STORAGE = 'ksu_student_last_synced_at';
const LAST_KNOWN_REMOTE_STORAGE = 'ksu_student_last_known_remote';

export const DEFAULT_ROOM_CODE = 'e2d779451fca13d7005a7453b0df880b';

// Stable unique device ID to prevent self-echo loops
function getDeviceId(): string {
  if (typeof localStorage === 'undefined') return 'server';
  let id = localStorage.getItem(DEVICE_ID_STORAGE);
  if (!id) {
    id = 'dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem(DEVICE_ID_STORAGE, id);
  }
  return id;
}

export interface RealtimeSyncPayload {
  version?: string;
  senderId?: string;
  updatedAt: string;
  homework: Homework[];
  events: CalendarCustomEvent[];
  deletedHwIds: string[];
  deletedEventIds?: string[];
}

type SyncCallback = () => void;

export class RealtimeSyncService {
  private static currentRoom: string | null = null;
  private static subscribers: Set<SyncCallback> = new Set();
  private static isConnected: boolean = true;
  private static isListeningToEvents: boolean = false;
  private static broadcastChannel: BroadcastChannel | null = null;
  private static heartbeatTimer: any = null;
  private static lastKnownPayload: RealtimeSyncPayload | null = null;

  /**
   * Get active sync room code
   */
  static getRoomCode(): string {
    if (typeof localStorage === 'undefined') return DEFAULT_ROOM_CODE;
    const stored = localStorage.getItem(REALTIME_ROOM_STORAGE);
    if (stored && stored.trim()) return stored.trim().toLowerCase();

    const gistId = localStorage.getItem('ksu_student_gist_id');
    if (gistId && gistId.trim()) return gistId.trim().toLowerCase();

    return DEFAULT_ROOM_CODE;
  }

  /**
   * Safe topic name
   */
  static getTopicName(roomCode?: string): string {
    const raw = (roomCode || this.getRoomCode()).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    return `ksu/student/sync/v4/${raw || 'default'}`;
  }

  /**
   * Set active sync room code
   */
  static setRoomCode(code: string): void {
    const clean = code.trim().toLowerCase();
    if (typeof window !== 'undefined') {
      localStorage.setItem(REALTIME_ROOM_STORAGE, clean);
    }
    this.connect(clean);
  }

  /**
   * Subscribe to incoming realtime updates
   */
  static onUpdate(cb: SyncCallback): () => void {
    this.subscribers.add(cb);
    return () => {
      this.subscribers.delete(cb);
    };
  }

  /**
   * Notify all React listeners
   */
  public static notifySubscribers(): void {
    for (const cb of this.subscribers) {
      try {
        cb();
      } catch (e) {
        console.error('[RealtimeSync] Subscriber notify error', e);
      }
    }
  }

  /**
   * Connect and initialize listeners
   */
  static connect(roomCode?: string): void {
    if (typeof window === 'undefined') return;

    const room = roomCode || this.getRoomCode();
    this.currentRoom = room;

    this.initEventListeners();
    this.initBroadcastChannel();
    this.initHeartbeat();
    this.isConnected = true;
  }

  /**
   * Init window/tab lifecycle event listeners
   */
  private static initEventListeners(): void {
    if (this.isListeningToEvents || typeof window === 'undefined') return;
    this.isListeningToEvents = true;

    window.addEventListener('online', () => {
      console.log('[RealtimeSync] Network connection restored (online). Flushing pending sync...');
      this.checkAndFlushPendingSync();
    });

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkAndFlushPendingSync();
        }
      });
    }

    window.addEventListener('focus', () => {
      this.checkAndFlushPendingSync();
    });
  }

  /**
   * Periodic background health check
   */
  private static initHeartbeat(): void {
    if (this.heartbeatTimer) return;
    this.heartbeatTimer = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        this.checkAndFlushPendingSync();
      }
    }, 25000);
  }

  /**
   * Cross-tab BroadcastChannel for zero-latency multi-tab sync in same browser
   */
  private static initBroadcastChannel(): void {
    if (this.broadcastChannel || typeof BroadcastChannel === 'undefined') return;
    try {
      this.broadcastChannel = new BroadcastChannel('ksu_student_realtime_sync_v4');
      this.broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'sync_payload') {
          const payload = event.data.payload as RealtimeSyncPayload;
          if (payload && payload.senderId !== getDeviceId()) {
            this.applyPayload(payload);
          }
        }
      };
    } catch (e) {
      console.warn('[RealtimeSync] BroadcastChannel init error', e);
    }
  }

  /**
   * Check if any local changes were made while offline, and publish them to cloud
   */
  public static checkAndFlushPendingSync(): void {
    if (typeof localStorage === 'undefined') return;

    const isPending = localStorage.getItem(PENDING_SYNC_STORAGE) === 'true';
    const lastModified = StorageService.getLastModified();
    const lastSynced = localStorage.getItem(LAST_SYNCED_TIME_STORAGE);

    const hasUnsyncedChanges =
      isPending ||
      !lastSynced ||
      new Date(lastModified).getTime() > new Date(lastSynced).getTime();

    if (hasUnsyncedChanges) {
      this.broadcast();
    }
  }

  /**
   * Broadcast current state to all peer devices and tabs
   */
  static broadcast(): void {
    if (typeof localStorage === 'undefined') return;

    // 1. Mark pending sync flag in storage immediately (offline-resilient)
    localStorage.setItem(PENDING_SYNC_STORAGE, 'true');

    const updatedAt = StorageService.getLastModified();
    const payload: RealtimeSyncPayload = {
      version: '2.0',
      senderId: getDeviceId(),
      updatedAt,
      homework: StorageService.getHomework(),
      events: StorageService.getEvents(),
      deletedHwIds: StorageService.getDeletedHomeworkIds(),
      deletedEventIds: StorageService.getDeletedEventIds(),
    };

    // 2. Broadcast immediately to other tabs on this device via BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: 'sync_payload', payload });
      } catch {}
    }

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;

    if (isOnline && SyncService.isFirebaseConfigured()) {
      SyncService.pushToCloud().then((success) => {
        if (success) {
          localStorage.removeItem(PENDING_SYNC_STORAGE);
          localStorage.setItem(LAST_SYNCED_TIME_STORAGE, updatedAt);
        }
      });
    } else {
      console.log('[RealtimeSync] Offline or reconnecting. Changes safely queued in localStorage for auto-sync.');
    }
  }

  /**
   * Smart merge remote payload with local data (Last-Write-Wins with permanent tombstones)
   */
  static applyPayload(data: RealtimeSyncPayload): boolean {
    try {
      if (!data || typeof data !== 'object') return false;

      // 1. Capture snapshot of local state BEFORE applying any remote changes
      const prevHomework = StorageService.getHomework();
      const prevEvents = StorageService.getEvents();
      const prevDeletedHw = new Set(StorageService.getDeletedHomeworkIds());
      const prevDeletedEvt = new Set(StorageService.getDeletedEventIds());

      // 2. Check and record tombstones (deleted items stay deleted permanently)
      let hasNewTombstones = false;
      if (Array.isArray(data.deletedHwIds) && data.deletedHwIds.length > 0) {
        for (const id of data.deletedHwIds) {
          if (!prevDeletedHw.has(id)) {
            hasNewTombstones = true;
          }
        }
        StorageService.recordDeletedHomeworkIds(data.deletedHwIds);
      }

      if (Array.isArray(data.deletedEventIds) && data.deletedEventIds.length > 0) {
        for (const id of data.deletedEventIds) {
          if (!prevDeletedEvt.has(id)) {
            hasNewTombstones = true;
          }
        }
        StorageService.recordDeletedEventIds(data.deletedEventIds);
      }

      const allDeletedHw = new Set(StorageService.getDeletedHomeworkIds());
      const allDeletedEvt = new Set(StorageService.getDeletedEventIds());

      // 3. Smart merge homework
      const remoteHw = (data.homework || []).filter((h) => !allDeletedHw.has(h.id));
      const localHw = prevHomework.filter((h) => !allDeletedHw.has(h.id));

      const mergedMap = new Map<string, Homework>();
      for (const h of remoteHw) {
        mergedMap.set(h.id, h);
      }

      let localHadUniqueOrNewer = false;
      for (const h of localHw) {
        const remoteItem = mergedMap.get(h.id);
        if (!remoteItem) {
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
      StorageService.saveHomework(finalHw);

      // 4. Smart merge custom events
      let eventsChanged = false;
      if (Array.isArray(data.events)) {
        const remoteEvts = data.events.filter((e) => !allDeletedEvt.has(e.id));
        const localEvts = prevEvents.filter((e) => !allDeletedEvt.has(e.id));

        const eventMap = new Map<string, CalendarCustomEvent>();
        for (const e of remoteEvts) {
          eventMap.set(e.id, e);
        }
        for (const e of localEvts) {
          if (!eventMap.has(e.id)) {
            eventMap.set(e.id, e);
            localHadUniqueOrNewer = true;
          }
        }
        const finalEvents = Array.from(eventMap.values());
        if (JSON.stringify(prevEvents) !== JSON.stringify(finalEvents)) {
          eventsChanged = true;
          StorageService.saveEvents(finalEvents);
        }
      }

      // 5. Detect changes compared to BEFORE payload was applied
      const hwChanged =
        hasNewTombstones ||
        prevHomework.length !== finalHw.length ||
        JSON.stringify(prevHomework) !== JSON.stringify(finalHw);

      if (data.updatedAt) {
        StorageService.recordLastModified(data.updatedAt);
      }

      // 6. ALWAYS notify UI subscribers immediately if homework, tombstones or events changed!
      if (hwChanged || eventsChanged) {
        console.log('[RealtimeSync] Merged changes applied to local storage. Notifying subscribers...');
        this.notifySubscribers();
      }

      // 7. If local had items or newer edits that remote was missing, broadcast back merged state
      if (localHadUniqueOrNewer) {
        console.log('[RealtimeSync] Local had unique or newer items. Propagating superset to peers...');
        this.broadcast();
      }

      return hwChanged || eventsChanged;
    } catch (err) {
      console.error('[RealtimeSync] applyPayload error', err);
      return false;
    }
  }

  /**
   * Pull latest payload from local cache
   */
  static async pullLatestPayload(): Promise<RealtimeSyncPayload | null> {
    if (this.lastKnownPayload) return this.lastKnownPayload;
    try {
      const stored = localStorage.getItem(LAST_KNOWN_REMOTE_STORAGE);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return null;
  }

  /**
   * Disconnect from current room
   */
  static disconnect(): void {
    this.isConnected = false;
    this.currentRoom = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(REALTIME_ROOM_STORAGE);
    }
  }

  /**
   * Get sync connection status
   */
  static getStatus(): { isConnected: boolean; room: string | null; broker: string } {
    return {
      isConnected: this.isConnected,
      room: this.currentRoom || this.getRoomCode() || null,
      broker: 'Firebase & Local BroadcastChannel',
    };
  }
}
