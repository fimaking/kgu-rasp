import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScheduleService } from '../src/services/scheduleService';
import initialScheduleData from '../src/data/initialSchedule.json';

describe('ScheduleService - Automatic Database Sync & Freshness', () => {
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
    vi.restoreAllMocks();
  });

  it('upgrades stale localStorage cache if bundled initialSchedule is newer', () => {
    // Simulate user having an old cached schedule from October 16
    const staleSchedule = {
      data: {
        isCyclicalSchedule: false,
        rasp: [
          {
            код: 999999,
            дата: '2026-09-01T00:00:00',
            датаНачала: '2026-09-01T10:10:00',
            датаОкончания: '2026-09-01T11:40:00',
            начало: '10:10',
            конец: '11:40',
            деньНедели: 2,
            день_недели: 'Вторник',
            день: '2 Вторник',
            код_Семестра: 1,
            типНедели: 1,
            номерПодгруппы: 1,
            дисциплина: 'пр Философия',
            преподаватель: 'Иванов И.И.',
            аудитория: 'Гл-100',
            учебныйГод: '2026-2027',
            группа: '26-ИСбо-4',
            номерЗанятия: 1,
          },
        ],
        info: {
          group: { name: '26-ИСбо-4', groupID: 8953, year: '2026-2027' },
          dateUploadingRasp: '2026-10-16T18:49:59', // Stale date
        },
      },
    };

    localStorage.setItem('ksu_schedule_cache_v3_8953', JSON.stringify(staleSchedule));

    // Calling getInitialSchedule should detect that initialScheduleData (2026-10-26) is newer
    const result = ScheduleService.getInitialSchedule(8953);

    expect(result.lastUpdated).toBe(initialScheduleData.data.info.dateUploadingRasp);
    expect(result.lessons.length).toBe(initialScheduleData.data.rasp.length);

    // Verify localStorage was automatically upgraded
    const updatedRaw = localStorage.getItem('ksu_schedule_cache_v3_8953');
    expect(updatedRaw).toBeTruthy();
    const updatedParsed = JSON.parse(updatedRaw!);
    expect(updatedParsed.data.info.dateUploadingRasp).toBe(initialScheduleData.data.info.dateUploadingRasp);
  });

  it('retains fresh cache when cached schedule is already up to date', () => {
    const currentUploadDate = initialScheduleData.data.info.dateUploadingRasp;
    const freshSchedule = {
      data: {
        isCyclicalSchedule: false,
        rasp: initialScheduleData.data.rasp,
        info: {
          group: { name: '26-ИСбо-4', groupID: 8953, year: '2026-2027' },
          dateUploadingRasp: currentUploadDate,
        },
      },
    };

    localStorage.setItem('ksu_schedule_cache_v3_8953', JSON.stringify(freshSchedule));

    const result = ScheduleService.getInitialSchedule(8953);
    expect(result.lastUpdated).toBe(currentUploadDate);
    expect(result.lessons.length).toBe(initialScheduleData.data.rasp.length);
  });

  it('detects newer remote schedule and updates cache silently', async () => {
    // Current cache
    const currentSchedule = {
      data: {
        isCyclicalSchedule: false,
        rasp: [{ код: 1, дата: '2026-10-01T00:00:00', начало: '10:10', конец: '11:40', номерЗанятия: 1, дисциплина: 'Тест', группа: '26-ИСбо-4' }],
        info: {
          group: { name: '26-ИСбо-4', groupID: 8953, year: '2026-2027' },
          dateUploadingRasp: '2026-10-20T10:00:00',
        },
      },
    };
    localStorage.setItem('ksu_schedule_cache_v3_8953', JSON.stringify(currentSchedule));

    // Mock fetch to return newer schedule
    const newerDate = '2026-10-28T22:00:00';
    const remoteResponse = {
      data: {
        isCyclicalSchedule: false,
        rasp: [
          { код: 1, дата: '2026-10-01T00:00:00', начало: '10:10', конец: '11:40', номерЗанятия: 1, дисциплина: 'Тест обновленный', группа: '26-ИСбо-4' },
          { код: 2, дата: '2026-10-01T00:00:00', начало: '11:50', конец: '13:20', номерЗанятия: 2, дисциплина: 'Тест пара 2', группа: '26-ИСбо-4' },
        ],
        info: {
          group: { name: '26-ИСбо-4', groupID: 8953, year: '2026-2027' },
          dateUploadingRasp: newerDate,
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => remoteResponse,
    } as any);

    const { hasNewData, result } = await ScheduleService.syncScheduleSilently(8953);

    expect(hasNewData).toBe(true);
    expect(result.lastUpdated).toBe(newerDate);
    expect(result.lessons.length).toBe(2);

    // Verify it updated localStorage
    const cached = ScheduleService.getCachedSchedule(8953);
    expect(cached?.lastUpdated).toBe(newerDate);
  });
});
