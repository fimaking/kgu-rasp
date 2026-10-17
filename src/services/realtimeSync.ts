import { StorageService } from './storageService';
import { Homework } from '../types/homework';
import { CalendarCustomEvent } from '../types/calendar';

const REALTIME_ROOM_STORAGE = 'ksu_student_realtime_room';
const DEVICE_ID_STORAGE = 'ksu_student_device_id';

export const DEFAULT_ROOM_CODE = 'e2d779451fca13d7005a7453b0df880b';

// Stable unique device ID to prevent self-echo loops
function getDeviceId(): string {
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
}

type SyncCallback = () => void;

export class RealtimeSyncService {
  private static eventSource: EventSource | null = null;
  private static currentRoom: string | null = null;
  private static subscribers: Set<SyncCallback> = new Set();
  private static isConnected: boolean = false;
  private static publishTimer: any = null;
  private static isListeningToOnline: boolean = false;

  /**
   * Get active sync room code
   */
  static getRoomCode(): string {
    const stored = localStorage.getItem(REALTIME_ROOM_STORAGE);
    if (stored && stored.trim()) return stored.trim().toLowerCase();

    const gistId = localStorage.getItem('ksu_student_gist_id');
    if (gistId && gistId.trim()) return gistId.trim().toLowerCase();

    return DEFAULT_ROOM_CODE;
  }

  /**
   * Safe topic name for ntfy.sh
   */
  static getTopicName(roomCode?: string): string {
    const raw = (roomCode || this.getRoomCode()).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    return `ksu_rasp_v2_${raw || 'default'}`;
  }

  /**
   * Set active sync room code and reconnect
   */
  static setRoomCode(code: string): void {
    const clean = code.trim().toLowerCase();
    localStorage.setItem(REALTIME_ROOM_STORAGE, clean);
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
  private static notifySubscribers(): void {
    for (const cb of this.subscribers) {
      try {
        cb();
      } catch (e) {
        console.error('Subscriber notify error', e);
      }
    }
  }

  /**
   * Connect to Realtime EventSource (SSE) over HTTPS port 443
   * Fully unmetered, zero firewall issues on mobile networks
   */
  static connect(roomCode?: string): void {
    if (typeof window === 'undefined') return;

    const room = roomCode || this.getRoomCode();
    if (!room) return;

    // Listen for online recovery once
    if (!this.isListeningToOnline) {
      this.isListeningToOnline = true;
      window.addEventListener('online', () => {
        console.log('[RealtimeSync] Network back online. Reconnecting and polling...');
        this.connect();
        this.pullLatest();
        this.broadcast();
      });
    }

    if (this.eventSource && this.currentRoom === room && this.isConnected) {
      return;
    }

    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {
        // ignore
      }
      this.eventSource = null;
    }

    this.currentRoom = room;
    const topic = this.getTopicName(room);
    const sseUrl = `https://ntfy.sh/${topic}/sse`;

    console.log(`[RealtimeSync] Connecting SSE to: ${topic}`);

    try {
      const es = new EventSource(sseUrl);
      this.eventSource = es;

      es.onopen = () => {
        this.isConnected = true;
        console.log(`[RealtimeSync] SSE live connection established to: ${topic}`);
      };

      es.onmessage = async (e) => {
        try {
          if (!e.data) return;
          const msgObj = JSON.parse(e.data);

          if (msgObj.event === 'open') {
            this.isConnected = true;
            return;
          }

          if (msgObj.event !== 'message') return;

          let payload: RealtimeSyncPayload | null = null;

          if (msgObj.attachment && msgObj.attachment.url) {
            try {
              const fileRes = await fetch(msgObj.attachment.url);
              payload = await fileRes.json();
            } catch (err) {
              console.warn('[RealtimeSync] Failed to fetch attachment', err);
            }
          } else if (msgObj.message) {
            payload = JSON.parse(msgObj.message);
          }

          if (!payload) return;

          // Ignore echoes from self
          if (payload.senderId && payload.senderId === getDeviceId()) {
            return;
          }

          console.log('[RealtimeSync] Live update received from another device!', payload);
          this.applyPayload(payload);
        } catch (err) {
          console.error('[RealtimeSync] Error processing incoming SSE message', err);
        }
      };

      es.onerror = (err) => {
        console.warn('[RealtimeSync] SSE connection interrupted, auto-reconnecting...', err);
        this.isConnected = false;
      };

      // Poll latest cached state immediately on connect
      this.pullLatest();
    } catch (err) {
      console.error('[RealtimeSync] Failed to start SSE', err);
    }
  }

  /**
   * Pull latest cached state from topic and apply
   */
  static async pullLatest(): Promise<boolean> {
    const payload = await this.pullLatestPayload();
    if (payload) {
      if (payload.senderId && payload.senderId === getDeviceId()) {
        return false;
      }
      return this.applyPayload(payload);
    }
    return false;
  }

  /**
   * Fetch latest payload from cloud topic cache
   */
  static async pullLatestPayload(): Promise<RealtimeSyncPayload | null> {
    try {
      const topic = this.getTopicName();
      const res = await fetch(`https://ntfy.sh/${topic}/json?poll=1`, {
        cache: 'no-store',
      });
      if (!res.ok) return null;

      const text = await res.text();
      if (!text.trim()) return null;

      const lines = text.trim().split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const item = JSON.parse(lines[i]);
          if (item.event === 'message') {
            if (item.attachment && item.attachment.url) {
              const fileRes = await fetch(item.attachment.url);
              return await fileRes.json();
            }
            if (item.message) {
              return JSON.parse(item.message);
            }
          }
        } catch {
          // ignore corrupted lines
        }
      }
      return null;
    } catch (e) {
      console.warn('[RealtimeSync] pullLatestPayload error', e);
      return null;
    }
  }

  /**
   * Smart merge remote payload with local data
   */
  static applyPayload(data: RealtimeSyncPayload): boolean {
    try {
      // 1. Tombstones (deleted items stay deleted permanently)
      if (Array.isArray(data.deletedHwIds) && data.deletedHwIds.length > 0) {
        StorageService.recordDeletedHomeworkIds(data.deletedHwIds);
      }
      const allDeletedIds = new Set(StorageService.getDeletedHomeworkIds());

      // 2. Smart merge homework
      const remoteHw = (data.homework || []).filter((h) => !allDeletedIds.has(h.id));
      const localHw = StorageService.getHomework().filter((h) => !allDeletedIds.has(h.id));

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
      const localRaw = JSON.stringify(localHw);
      const finalRaw = JSON.stringify(finalHw);
      const changed = localRaw !== finalRaw;

      if (changed) {
        StorageService.saveHomework(finalHw);
      }

      // 3. Smart merge custom events
      if (Array.isArray(data.events) && data.events.length > 0) {
        const localEvents = StorageService.getEvents();
        const eventMap = new Map<string, CalendarCustomEvent>();
        for (const e of data.events) {
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

      // 4. Update last modified
      StorageService.recordLastModified(data.updatedAt || new Date().toISOString());

      // 5. Notify UI immediately
      if (changed) {
        this.notifySubscribers();
      }

      // 6. If local had unique/newer items that remote was missing, broadcast back merged state
      if (localHadUniqueOrNewer) {
        this.broadcast();
      }

      return changed;
    } catch (err) {
      console.error('[RealtimeSync] applyPayload error', err);
      return false;
    }
  }

  /**
   * Broadcast state to all other connected devices instantly (< 150ms)
   */
  static broadcast(): void {
    if (this.publishTimer) {
      clearTimeout(this.publishTimer);
    }

    // Small debounce to batch rapid state changes
    this.publishTimer = setTimeout(async () => {
      this.publishTimer = null;
      const topic = this.getTopicName();

      const payload: RealtimeSyncPayload = {
        version: '1.0',
        senderId: getDeviceId(),
        updatedAt: new Date().toISOString(),
        homework: StorageService.getHomework(),
        events: StorageService.getEvents(),
        deletedHwIds: StorageService.getDeletedHomeworkIds(),
      };

      try {
        console.log(`[RealtimeSync] Broadcasting update to ${topic}...`);
        await fetch(`https://ntfy.sh/${topic}`, {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log(`[RealtimeSync] Broadcast successfully delivered!`);
      } catch (err) {
        console.warn('[RealtimeSync] Broadcast failed, will retry on online', err);
      }
    }, 150);
  }

  /**
   * Disconnect from current room
   */
  static disconnect(): void {
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {
        // ignore
      }
      this.eventSource = null;
    }
    this.isConnected = false;
    this.currentRoom = null;
    localStorage.removeItem(REALTIME_ROOM_STORAGE);
  }

  static getStatus(): { isConnected: boolean; room: string | null } {
    return {
      isConnected: this.isConnected,
      room: this.currentRoom || this.getRoomCode() || null,
    };
  }
}
