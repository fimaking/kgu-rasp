import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService, sanitizeUrl } from '../src/services/storageService';
import { Homework } from '../src/types/homework';

describe('storageService', () => {
  beforeEach(() => {
    // In-memory mock localStorage
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

  describe('sanitizeUrl', () => {
    it('accepts valid http and https URLs', () => {
      expect(sanitizeUrl('https://eios.kosgos.ru/')).toBe('https://eios.kosgos.ru/');
      expect(sanitizeUrl('http://github.com/fimaking')).toBe('http://github.com/fimaking');
    });

    it('prepends https:// to bare domains', () => {
      expect(sanitizeUrl('eios.kosgos.ru/student')).toBe('https://eios.kosgos.ru/student');
    });

    it('strictly rejects malicious schemes like javascript: and data:', () => {
      expect(sanitizeUrl('javascript:alert(document.cookie)')).toBeUndefined();
      expect(sanitizeUrl('data:text/html;base64,...')).toBeUndefined();
      expect(sanitizeUrl('vbscript:msgbox(1)')).toBeUndefined();
    });

    it('handles undefined or non-string inputs safely', () => {
      expect(sanitizeUrl(undefined)).toBeUndefined();
      expect(sanitizeUrl('')).toBeUndefined();
      expect(sanitizeUrl(null as any)).toBeUndefined();
    });
  });

  describe('Homework CRUD & Tombstones', () => {
    it('creates, retrieves, and updates homework', () => {
      const created = StorageService.addHomework({
        title: 'Лабораторная работа №1',
        subject: 'Базы данных',
        assignedDate: '2026-10-17',
        dueDate: '2026-10-24',
        dueTime: '10:10',
        priority: 'high',
        status: 'todo',
        subtasks: [{ id: 's1', title: 'Создать схему', completed: false }],
      });

      expect(created.id).toBeDefined();
      expect(created.title).toBe('Лабораторная работа №1');

      const all = StorageService.getHomework();
      expect(all.length).toBe(1);
      expect(all[0].id).toBe(created.id);

      // Update
      const updated = StorageService.updateHomework({
        ...created,
        status: 'completed',
      });
      expect(updated.status).toBe('completed');
      expect(StorageService.getHomework()[0].status).toBe('completed');
    });

    it('records tombstones on deletion so deleted tasks never resurrect', () => {
      const hw = StorageService.addHomework({
        title: 'Удаляемое задание',
        subject: 'История',
        assignedDate: '2026-10-17',
        dueDate: '2026-10-20',
        priority: 'normal',
        status: 'todo',
        subtasks: [],
      });

      expect(StorageService.getHomework().length).toBe(1);

      StorageService.deleteHomework(hw.id);
      expect(StorageService.getHomework().length).toBe(0);

      const deletedIds = StorageService.getDeletedHomeworkIds();
      expect(deletedIds.includes(hw.id)).toBe(true);

      // Attempting to re-save with the old deleted task is blocked by tombstone filter
      StorageService.saveHomework([hw]);
      expect(StorageService.getHomework().length).toBe(0);
    });
  });

  describe('importData and schema validation', () => {
    it('returns error on malformed non-JSON string', () => {
      const res = StorageService.importData('invalid json {{{');
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('sanitizes imported homework and prevents script injection', () => {
      const maliciousData = {
        version: '1.0',
        homework: [
          {
            id: 'hw_safe_1',
            title: 'Правильное задание',
            subject: 'Информатика',
            priority: 'high',
            status: 'todo',
            materialLink: 'javascript:alert(1)',
          },
          {
            // Invalid entry: missing title and subject
            id: 'hw_invalid_2',
            title: '',
          },
        ],
      };

      const res = StorageService.importData(JSON.stringify(maliciousData));
      expect(res.success).toBe(true);
      expect(res.countHw).toBe(1); // Only the valid one should be imported

      const list = StorageService.getHomework();
      expect(list.length).toBe(1);
      expect(list[0].id).toBe('hw_safe_1');
      // Malicious link should have been purged during sanitization
      expect(list[0].materialLink).toBeUndefined();
    });
  });
});
