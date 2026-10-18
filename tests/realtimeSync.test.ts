import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RealtimeSyncService, RealtimeSyncPayload } from '../src/services/realtimeSync';
import { StorageService } from '../src/services/storageService';
import { Homework } from '../src/types/homework';
import { CalendarCustomEvent } from '../src/types/calendar';

describe('RealtimeSyncService - Offline-First & Multi-Device Sync', () => {
  beforeEach(() => {
    let store: Record<string, string> = {};
    global.localStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      key: (i: number) => Object.keys(store)[i] || null,
      length: 0,
    } as any;
  });

  it('merges remote tasks without losing locally created offline tasks', () => {
    // 1. Phone was offline and user created a task locally
    const localHw = StorageService.addHomework({
      title: 'Офлайн лаба на телефоне',
      subject: 'Физика',
      assignedDate: '2026-10-18',
      dueDate: '2026-10-25',
      dueTime: '23:59',
      priority: 'high',
      status: 'todo',
      subtasks: [],
    });

    expect(StorageService.getHomework()).toHaveLength(1);

    // 2. Incoming remote payload from PC created while phone was disconnected
    const remotePayload: RealtimeSyncPayload = {
      version: '2.0',
      senderId: 'dev_pc_123',
      updatedAt: '2026-10-18T12:00:00.000Z',
      homework: [
        {
          id: 'hw_pc_001',
          title: 'Задание созданное на ПК',
          subject: 'Математика',
          assignedDate: '2026-10-18',
          dueDate: '2026-10-22',
          dueTime: '12:00',
          priority: 'normal',
          status: 'todo',
          subtasks: [],
          createdAt: '2026-10-18T12:00:00.000Z',
          updatedAt: '2026-10-18T12:00:00.000Z',
        },
      ],
      events: [],
      deletedHwIds: [],
    };

    let notified = false;
    const unsub = RealtimeSyncService.onUpdate(() => {
      notified = true;
    });

    const changed = RealtimeSyncService.applyPayload(remotePayload);
    unsub();

    expect(changed).toBe(true);
    expect(notified).toBe(true);

    const merged = StorageService.getHomework();
    // Must contain BOTH tasks!
    expect(merged).toHaveLength(2);
    expect(merged.some((h) => h.id === localHw.id)).toBe(true);
    expect(merged.some((h) => h.id === 'hw_pc_001')).toBe(true);
  });

  it('permanently removes deleted tasks using tombstones and never resurrects them', () => {
    const hw = StorageService.addHomework({
      title: 'Задание под удаление',
      subject: 'История',
      assignedDate: '2026-10-18',
      dueDate: '2026-10-20',
      dueTime: '10:00',
      priority: 'normal',
      status: 'todo',
      subtasks: [],
    });

    expect(StorageService.getHomework()).toHaveLength(1);

    // Remote device deleted the task and sends payload with deletedHwIds
    const deletePayload: RealtimeSyncPayload = {
      version: '2.0',
      senderId: 'dev_pc_456',
      updatedAt: '2026-10-18T13:00:00.000Z',
      homework: [],
      events: [],
      deletedHwIds: [hw.id],
    };

    RealtimeSyncService.applyPayload(deletePayload);

    // Task must be gone
    expect(StorageService.getHomework()).toHaveLength(0);
    expect(StorageService.getDeletedHomeworkIds()).toContain(hw.id);

    // If an outdated device tries to resend that task, it MUST NOT resurrect
    const stalePayload: RealtimeSyncPayload = {
      version: '2.0',
      senderId: 'dev_old_789',
      updatedAt: '2026-10-18T10:00:00.000Z',
      homework: [hw],
      events: [],
      deletedHwIds: [],
    };

    RealtimeSyncService.applyPayload(stalePayload);
    expect(StorageService.getHomework()).toHaveLength(0);
  });

  it('resolves concurrent task edits using Last-Write-Wins (LWW)', () => {
    const baseHw = StorageService.addHomework({
      title: 'Конспект',
      subject: 'Химия',
      assignedDate: '2026-10-18',
      dueDate: '2026-10-20',
      dueTime: '10:00',
      priority: 'normal',
      status: 'todo',
      subtasks: [],
    });

    // Local edit at 14:00
    baseHw.title = 'Конспект - локальная правка (новее)';
    baseHw.updatedAt = '2026-10-18T14:00:00.000Z';
    StorageService.saveHomework([baseHw]);

    // Remote edit arrived with older timestamp (13:30)
    const olderRemotePayload: RealtimeSyncPayload = {
      version: '2.0',
      senderId: 'dev_other',
      updatedAt: '2026-10-18T13:30:00.000Z',
      homework: [
        {
          ...baseHw,
          title: 'Конспект - старая правка с другого устройства',
          updatedAt: '2026-10-18T13:30:00.000Z',
        },
      ],
      events: [],
      deletedHwIds: [],
    };

    RealtimeSyncService.applyPayload(olderRemotePayload);

    // Local newer edit must win
    const current = StorageService.getHomework();
    expect(current[0].title).toBe('Конспект - локальная правка (новее)');

    // Now a newer remote edit arrives (15:00)
    const newerRemotePayload: RealtimeSyncPayload = {
      version: '2.0',
      senderId: 'dev_other',
      updatedAt: '2026-10-18T15:00:00.000Z',
      homework: [
        {
          ...baseHw,
          title: 'Конспект - свежая правка с ПК',
          updatedAt: '2026-10-18T15:00:00.000Z',
        },
      ],
      events: [],
      deletedHwIds: [],
    };

    RealtimeSyncService.applyPayload(newerRemotePayload);

    // Remote newer edit must now win
    const updated = StorageService.getHomework();
    expect(updated[0].title).toBe('Конспект - свежая правка с ПК');
  });

  it('merges custom calendar events and honors event tombstones', () => {
    const event = StorageService.addEvent({
      title: 'Коллоквиум',
      date: '2026-10-25',
      time: '14:00',
      type: 'colloquium',
    });

    expect(StorageService.getEvents()).toHaveLength(1);

    const remotePayload: RealtimeSyncPayload = {
      version: '2.0',
      senderId: 'dev_pc_999',
      updatedAt: '2026-10-18T14:00:00.000Z',
      homework: [],
      events: [
        {
          id: 'evt_remote_001',
          title: 'Экзамен',
          date: '2026-11-10',
          time: '09:00',
          type: 'exam',
          createdAt: '2026-10-18T14:00:00.000Z',
        },
      ],
      deletedHwIds: [],
      deletedEventIds: [event.id],
    };

    RealtimeSyncService.applyPayload(remotePayload);

    const events = StorageService.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe('evt_remote_001');
    expect(StorageService.getDeletedEventIds()).toContain(event.id);
  });

  it('queues offline pending changes when broadcast is called while offline', () => {
    // When offline, calling broadcast saves pending flag in localStorage
    StorageService.addHomework({
      title: 'Офлайн задача перед синхронизацией',
      subject: 'Информатика',
      assignedDate: '2026-10-18',
      dueDate: '2026-10-21',
      dueTime: '23:59',
      priority: 'high',
      status: 'todo',
      subtasks: [],
    });

    RealtimeSyncService.broadcast();

    expect(localStorage.getItem('ksu_student_pending_sync')).toBe('true');
  });
});
