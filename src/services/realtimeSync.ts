import mqtt, { MqttClient } from 'mqtt';
import { StorageService } from './storageService';
import { Homework } from '../types/homework';
import { CalendarCustomEvent } from '../types/calendar';

const REALTIME_ROOM_STORAGE = 'ksu_student_realtime_room';
const DEVICE_ID_STORAGE = 'ksu_student_device_id';

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
  senderId: string;
  updatedAt: string;
  homework: Homework[];
  events: CalendarCustomEvent[];
  deletedHwIds: string[];
}

type SyncCallback = () => void;

export class RealtimeSyncService {
  private static client: MqttClient | null = null;
  private static currentRoom: string | null = null;
  private static subscribers: Set<SyncCallback> = new Set();
  private static isConnected: boolean = false;
  private static isPublishing: boolean = false;

  /**
   * Get active sync room code
   */
  static getRoomCode(): string {
    // Priority: stored room code, or fallback to active gistId
    const stored = localStorage.getItem(REALTIME_ROOM_STORAGE);
    if (stored) return stored;

    const gistId = localStorage.getItem('ksu_student_gist_id');
    if (gistId) return gistId.trim();

    return '';
  }

  /**
   * Set active sync room code and connect
   */
  static setRoomCode(code: string): void {
    const clean = code.trim().toLowerCase();
    localStorage.setItem(REALTIME_ROOM_STORAGE, clean);
    this.connect(clean);
  }

  /**
   * Subscribe to incoming realtime updates (from other device)
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
   * Connect to HiveMQ Public WebSocket broker
   */
  static connect(roomCode?: string): void {
    const room = roomCode || this.getRoomCode();
    if (!room) return;

    if (this.client && this.currentRoom === room && this.isConnected) {
      return;
    }

    if (this.client) {
      try {
        this.client.end(true);
      } catch {
        // ignore
      }
      this.client = null;
    }

    this.currentRoom = room;
    const topic = `ksu/rasp/v1/${room}`;

    console.log(`[RealtimeSync] Connecting to room: ${room}`);

    try {
      const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
        clientId: `${getDeviceId()}_${Math.random().toString(36).substring(2, 6)}`,
        clean: true,
        reconnectPeriod: 2000,
        connectTimeout: 6000,
      });

      this.client = client;

      client.on('connect', () => {
        this.isConnected = true;
        console.log(`[RealtimeSync] Connected! Subscribing to: ${topic}`);
        client.subscribe(topic, { qos: 1 });
      });

      client.on('message', (incomingTopic: string, payloadBuffer: Buffer) => {
        if (incomingTopic !== topic) return;

        try {
          const payloadStr = payloadBuffer.toString();
          const data: RealtimeSyncPayload = JSON.parse(payloadStr);

          // Ignore messages sent by this same device
          if (data.senderId === getDeviceId()) {
            return;
          }

          console.log('[RealtimeSync] Live message received from other device!', data);

          // 1. Apply tombstones permanently
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
          for (const h of localHw) {
            const remoteItem = mergedMap.get(h.id);
            if (!remoteItem) {
              mergedMap.set(h.id, h);
            } else {
              const localTime = new Date(h.updatedAt || h.createdAt || 0).getTime();
              const remoteTime = new Date(remoteItem.updatedAt || remoteItem.createdAt || 0).getTime();
              if (localTime > remoteTime) {
                mergedMap.set(h.id, h);
              }
            }
          }

          const finalHw = Array.from(mergedMap.values());
          StorageService.saveHomework(finalHw);

          // 3. Smart merge events
          if (Array.isArray(data.events)) {
            const localEvents = StorageService.getEvents();
            const eventMap = new Map<string, CalendarCustomEvent>();
            for (const e of data.events) {
              eventMap.set(e.id, e);
            }
            for (const e of localEvents) {
              if (!eventMap.has(e.id)) {
                eventMap.set(e.id, e);
              }
            }
            StorageService.saveEvents(Array.from(eventMap.values()));
          }

          // 4. Update last modified timestamp
          StorageService.recordLastModified(data.updatedAt || new Date().toISOString());

          // 5. Notify UI to update immediately with zero reload!
          this.notifySubscribers();
        } catch (err) {
          console.error('[RealtimeSync] Failed to process message', err);
        }
      });

      client.on('error', (err) => {
        console.warn('[RealtimeSync] Error:', err);
      });

      client.on('close', () => {
        this.isConnected = false;
      });
    } catch (err) {
      console.error('[RealtimeSync] Connection failed', err);
    }
  }

  /**
   * Broadcast state to all other connected devices instantly (< 100ms)
   */
  static broadcast(): void {
    const room = this.currentRoom || this.getRoomCode();
    if (!room) return;

    if (!this.client || !this.isConnected) {
      // Connect first if not already connected
      this.connect(room);
    }

    if (this.isPublishing) return;
    this.isPublishing = true;

    // Small debounce so multiple rapid state changes batch into a single live packet
    setTimeout(() => {
      this.isPublishing = false;
      if (!this.client || !this.isConnected) return;

      const topic = `ksu/rasp/v1/${room}`;
      const payload: RealtimeSyncPayload = {
        senderId: getDeviceId(),
        updatedAt: new Date().toISOString(),
        homework: StorageService.getHomework(),
        events: StorageService.getEvents(),
        deletedHwIds: StorageService.getDeletedHomeworkIds(),
      };

      try {
        console.log(`[RealtimeSync] Broadcasting update to ${topic}...`);
        this.client.publish(topic, JSON.stringify(payload), { qos: 1, retain: true });
      } catch (err) {
        console.error('[RealtimeSync] Publish failed', err);
      }
    }, 100);
  }

  /**
   * Disconnect from current room
   */
  static disconnect(): void {
    if (this.client) {
      try {
        this.client.end(true);
      } catch {
        // ignore
      }
      this.client = null;
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
