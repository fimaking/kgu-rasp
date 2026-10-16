export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserSettings {
  groupId: number;
  groupName: string;
  subgroupPreference: number; // 0 = all, 1 = sub 1, 2 = sub 2
  theme: ThemeMode;
  notifications: {
    enabled: boolean;
    lessonReminderMinutes: number; // e.g. 15 min before
    homeworkReminderHours: number; // e.g. 12 or 24 hrs before
    overdueAlert: boolean;
  };
  lastSyncTimestamp: string | null;
  autoSync: boolean;
  showTeacherInitials: boolean;
  accentColor: string; // Apple blue '#007AFF', etc.
}

export const DEFAULT_SETTINGS: UserSettings = {
  groupId: 8953,
  groupName: '26-ИСбо-4',
  subgroupPreference: 0,
  theme: 'system',
  notifications: {
    enabled: false,
    lessonReminderMinutes: 15,
    homeworkReminderHours: 24,
    overdueAlert: true,
  },
  lastSyncTimestamp: null,
  autoSync: true,
  showTeacherInitials: false,
  accentColor: '#007AFF',
};
