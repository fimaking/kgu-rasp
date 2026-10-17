export type ThemeMode = 'light' | 'dark' | 'system';
export type VisualTheme =
  | 'cyber-violet'
  | 'electric-mint'
  | 'acid-lime'
  | 'monochrome'
  | 'classic'
  | 'oled'
  | 'midnight'
  | 'emerald'
  | 'sunset'
  | 'cyber';
export type FontFamily = 'system' | 'inter' | 'roboto' | 'nunito' | 'mono' | 'serif';
export type FontScale = 'compact' | 'normal' | 'large';
export type AppRadius = 'compact' | 'normal' | 'soft';
export type CardStyle = 'glass' | 'solid' | 'bordered';
export type ScheduleDensity = 'cozy' | 'compact';

export interface UserSettings {
  groupId: number;
  groupName: string;
  subgroupPreference: number; // 0 = all, 1 = sub 1, 2 = sub 2
  theme: ThemeMode;
  visualTheme: VisualTheme;
  accentColor: string; // Hex color code e.g. '#007AFF'
  fontFamily: FontFamily;
  fontScale: FontScale;
  appRadius: AppRadius;
  cardStyle: CardStyle;
  scheduleDensity: ScheduleDensity;
  reducedMotion: boolean;
  showTeacherInitials: boolean;
  notifications: {
    enabled: boolean;
    lessonReminderMinutes: number; // e.g. 15 min before
    homeworkReminderHours: number; // e.g. 12 or 24 hrs before
    overdueAlert: boolean;
  };
  lastSyncTimestamp: string | null;
  autoSync: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  groupId: 8953,
  groupName: '26-ИСбо-4',
  subgroupPreference: 1,
  theme: 'dark',
  visualTheme: 'oled',
  accentColor: '#007AFF',
  fontFamily: 'system',
  fontScale: 'normal',
  appRadius: 'normal',
  cardStyle: 'glass',
  scheduleDensity: 'cozy',
  reducedMotion: false,
  showTeacherInitials: false,
  notifications: {
    enabled: false,
    lessonReminderMinutes: 15,
    homeworkReminderHours: 24,
    overdueAlert: true,
  },
  lastSyncTimestamp: null,
  autoSync: true,
};

export interface AccentColorOption {
  id: string;
  name: string;
  hex: string;
  rgb: string; // Space separated for CSS alpha: "0 122 255"
}

export const ACCENT_COLORS: AccentColorOption[] = [
  { id: 'neon-purple', name: 'Кибер-пурпур', hex: '#B5179E', rgb: '181 23 158' },
  { id: 'electric-mint', name: 'Электро-мята', hex: '#00F5A0', rgb: '0 245 160' },
  { id: 'acid-lime', name: 'Кислотный лайм', hex: '#D4FF00', rgb: '212 255 0' },
  { id: 'pure-white', name: 'Монохром', hex: '#E4E4E7', rgb: '228 228 231' },
  { id: 'blue', name: 'Синий Apple', hex: '#007AFF', rgb: '0 122 255' },
  { id: 'indigo', name: 'Индиго', hex: '#5856D6', rgb: '88 86 214' },
  { id: 'purple', name: 'Фиолетовый', hex: '#AF52DE', rgb: '175 82 222' },
  { id: 'pink', name: 'Розовый', hex: '#FF2D55', rgb: '255 45 85' },
  { id: 'red', name: 'Красный', hex: '#FF3B30', rgb: '255 59 48' },
  { id: 'orange', name: 'Оранжевый', hex: '#FF9500', rgb: '255 149 0' },
  { id: 'yellow', name: 'Янтарный', hex: '#FFCC00', rgb: '255 204 0' },
  { id: 'green', name: 'Изумрудный', hex: '#34C759', rgb: '52 199 89' },
  { id: 'teal', name: 'Бирюзовый', hex: '#30B0C7', rgb: '48 176 199' },
  { id: 'mint', name: 'Мятный', hex: '#00C7BE', rgb: '0 199 190' },
  { id: 'graphite', name: 'Графит', hex: '#8E8E93', rgb: '142 142 147' },
];

export interface VisualThemeOption {
  id: VisualTheme;
  name: string;
  description: string;
  previewColorDark: string;
  previewColorLight: string;
  accentDefault: string;
}

export const VISUAL_THEMES: VisualThemeOption[] = [
  {
    id: 'cyber-violet',
    name: 'Cyber Violet',
    description: 'Кибер-пурпурные и неоновые фиолетовые акценты на глубоком темном фоне (Music Player)',
    previewColorDark: '#0B0516',
    previewColorLight: '#F7F3FB',
    accentDefault: '#B5179E',
  },
  {
    id: 'electric-mint',
    name: 'Electric Mint',
    description: 'Электрическая мята и бирюзовые неоновые акценты на графитовом фоне (Fintech)',
    previewColorDark: '#0A1118',
    previewColorLight: '#F0FDF8',
    accentDefault: '#00F5A0',
  },
  {
    id: 'acid-lime',
    name: 'Acid Lime',
    description: 'Кислотно-лаймовые и желтые неоновые акценты на древесно-угольном фоне (Sports Startup)',
    previewColorDark: '#11140E',
    previewColorLight: '#F8FAF0',
    accentDefault: '#D4FF00',
  },
  {
    id: 'monochrome',
    name: 'Monochrome Reader',
    description: 'Минималистичный монохром с мягким белым текстом и многослойными серыми карточками (E-Reader)',
    previewColorDark: '#111114',
    previewColorLight: '#F4F4F5',
    accentDefault: '#E4E4E7',
  },
  {
    id: 'classic',
    name: 'Apple Classic',
    description: 'Фирменный стиль iOS и macOS с мягким серым фоном',
    previewColorDark: '#121214',
    previewColorLight: '#F2F2F7',
    accentDefault: '#007AFF',
  },
  {
    id: 'oled',
    name: 'OLED Black',
    description: 'Истинно чёрный (#000000) для максимальной экономии батареи AMOLED',
    previewColorDark: '#000000',
    previewColorLight: '#F2F2F7',
    accentDefault: '#007AFF',
  },
  {
    id: 'midnight',
    name: 'Midnight Navy',
    description: 'Глубокий тёмно-синий океан и звёздное ночное небо',
    previewColorDark: '#090E1A',
    previewColorLight: '#F0F4F8',
    accentDefault: '#38BDF8',
  },
  {
    id: 'emerald',
    name: 'Nordic Forest',
    description: 'Умиротворяющий хвойно-зелёный скандинавский стиль',
    previewColorDark: '#05140E',
    previewColorLight: '#F2F7F4',
    accentDefault: '#34C759',
  },
  {
    id: 'sunset',
    name: 'Warm Sunset',
    description: 'Тёплые кремовые и сумеречно-закатные тона для отдыха глаз',
    previewColorDark: '#171114',
    previewColorLight: '#F7F3EE',
    accentDefault: '#FF9500',
  },
  {
    id: 'cyber',
    name: 'Cyberpunk',
    description: 'Неоновый киберстиль с яркими футуристичными акцентами',
    previewColorDark: '#0A0A10',
    previewColorLight: '#F4F4F8',
    accentDefault: '#00F0FF',
  },
];

export interface FontOption {
  id: FontFamily;
  name: string;
  sample: string;
  fontFamilyCss: string;
  description: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'system',
    name: 'SF Pro (Системный)',
    sample: '26-ИСбо-4 • Расписание занятий КГУ',
    fontFamilyCss: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif',
    description: 'Фирменный системный шрифт Apple',
  },
  {
    id: 'inter',
    name: 'Inter',
    sample: '26-ИСбо-4 • Расписание занятий КГУ',
    fontFamilyCss: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    description: 'Современный четкий UI-гротеск с идеальной читаемостью',
  },
  {
    id: 'roboto',
    name: 'Roboto',
    sample: '26-ИСбо-4 • Расписание занятий КГУ',
    fontFamilyCss: '"Roboto", "Segoe UI", sans-serif',
    description: 'Привычный удобный шрифт Android и Material Design',
  },
  {
    id: 'nunito',
    name: 'Nunito',
    sample: '26-ИСбо-4 • Расписание занятий КГУ',
    fontFamilyCss: '"Nunito", "Segoe UI", sans-serif',
    description: 'Дружелюбные скругленные линии, снижающие усталость глаз',
  },
  {
    id: 'mono',
    name: 'JetBrains Mono',
    sample: '26-ИСбо-4 • void main(schedule)',
    fontFamilyCss: '"JetBrains Mono", "SF Mono", Consolas, monospace',
    description: 'Стильный моноширинный код для IT-студентов',
  },
  {
    id: 'serif',
    name: 'PT Serif (Университетский)',
    sample: '26-ИСбо-4 • Костромской государственный университет',
    fontFamilyCss: '"PT Serif", Georgia, serif',
    description: 'Классический академический шрифт с элегантными засечками',
  },
];

export const FONT_SCALES = [
  { id: 'compact' as FontScale, label: 'Компактный', percent: '90%', desc: 'Больше пар на экране' },
  { id: 'normal' as FontScale, label: 'Стандартный', percent: '100%', desc: 'Оптимальный баланс' },
  { id: 'large' as FontScale, label: 'Крупный', percent: '110%', desc: 'Увеличенный текст' },
];

export const APP_RADII = [
  { id: 'compact' as AppRadius, label: 'Строгий (14px)', desc: 'Четкие аккуратные углы' },
  { id: 'normal' as AppRadius, label: 'Apple (24px)', desc: 'Классическое скругление' },
  { id: 'soft' as AppRadius, label: 'Экстра (32px)', desc: 'Супер-мягкие плавные формы' },
];

export const CARD_STYLES = [
  { id: 'glass' as CardStyle, label: 'Frosted Glass', desc: 'Полупрозрачное стекло с размытием' },
  { id: 'solid' as CardStyle, label: 'Flat Solid', desc: 'Плотный минимализм без прозрачности' },
  { id: 'bordered' as CardStyle, label: 'Контурный', desc: 'Выраженные контрастные рамки' },
];

export const SCHEDULE_DENSITIES = [
  { id: 'cozy' as ScheduleDensity, label: 'Просторный', desc: 'Удобные карточки с полными деталями' },
  { id: 'compact' as ScheduleDensity, label: 'Компактный', desc: 'Экономит место на телефоне' },
];
