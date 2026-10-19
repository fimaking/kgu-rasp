import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_SETTINGS,
  ACCENT_COLORS,
  VISUAL_THEMES,
  FONT_OPTIONS,
  FONT_SCALES,
  APP_RADII,
  CARD_STYLES,
  SCHEDULE_DENSITIES,
} from '../src/types/settings';
import { StorageService } from '../src/services/storageService';

describe('App Customization & Theming Suite', () => {
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

  it('provides comprehensive default settings for all customization parameters', () => {
    expect(DEFAULT_SETTINGS.theme).toBe('dark');
    expect(DEFAULT_SETTINGS.visualTheme).toBe('oled');
    expect(DEFAULT_SETTINGS.accentColor).toBe('#007AFF');
    expect(DEFAULT_SETTINGS.fontFamily).toBe('comfortaa');
    expect(DEFAULT_SETTINGS.fontScale).toBe('normal');
    expect(DEFAULT_SETTINGS.appRadius).toBe('normal');
    expect(DEFAULT_SETTINGS.cardStyle).toBe('glass');
    expect(DEFAULT_SETTINGS.scheduleDensity).toBe('cozy');
    expect(DEFAULT_SETTINGS.reducedMotion).toBe(false);
    expect(DEFAULT_SETTINGS.showTeacherInitials).toBe(false);
  });

  it('persists and restores custom visual themes and accent colors in StorageService', () => {
    const initial = StorageService.getSettings();
    expect(initial.visualTheme).toBe('oled');

    const updated = {
      ...initial,
      visualTheme: 'midnight' as const,
      accentColor: '#AF52DE',
      fontFamily: 'mono' as const,
      fontScale: 'large' as const,
      appRadius: 'soft' as const,
      cardStyle: 'solid' as const,
      reducedMotion: true,
    };

    StorageService.saveSettings(updated);

    const retrieved = StorageService.getSettings();
    expect(retrieved.visualTheme).toBe('midnight');
    expect(retrieved.accentColor).toBe('#AF52DE');
    expect(retrieved.fontFamily).toBe('mono');
    expect(retrieved.fontScale).toBe('large');
    expect(retrieved.appRadius).toBe('soft');
    expect(retrieved.cardStyle).toBe('solid');
    expect(retrieved.reducedMotion).toBe(true);
  });

  it('validates ACCENT_COLORS contains signature and Apple colors with valid rgb channels', () => {
    expect(ACCENT_COLORS.length).toBeGreaterThanOrEqual(15);
    for (const color of ACCENT_COLORS) {
      expect(color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(color.rgb).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/);
      expect(color.name).toBeTruthy();
    }
  });

  it('validates VISUAL_THEMES covers classic, OLED and creative dark themes', () => {
    expect(VISUAL_THEMES.length).toBe(16);
    const themeIds = VISUAL_THEMES.map((t) => t.id);
    expect(new Set(themeIds).size).toBe(16);
    expect(themeIds).toContain('cyber-violet');
    expect(themeIds).toContain('electric-mint');
    expect(themeIds).toContain('acid-lime');
    expect(themeIds).toContain('monochrome');
    expect(themeIds).toContain('classic');
    expect(themeIds).toContain('oled');
    expect(themeIds).toContain('midnight');
    expect(themeIds).toContain('emerald');
    expect(themeIds).toContain('sunset');
    expect(themeIds).toContain('cyber');
    expect(themeIds).toContain('cyberpunk');
    expect(themeIds).toContain('matrix');
    expect(themeIds).toContain('dracula');
    expect(themeIds).toContain('tokyo-night');
    expect(themeIds).toContain('coffee');
    expect(themeIds).toContain('solar');

    for (const theme of VISUAL_THEMES) {
      expect(theme.previewColorDark).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.previewColorLight).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.accentDefault).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('validates FONT_OPTIONS covers standard, modern, friendly, monospaced, academic and creative fonts', () => {
    expect(FONT_OPTIONS.length).toBe(12);
    const fontIds = FONT_OPTIONS.map((f) => f.id);
    expect(fontIds).toContain('system');
    expect(fontIds).toContain('inter');
    expect(fontIds).toContain('roboto');
    expect(fontIds).toContain('nunito');
    expect(fontIds).toContain('mono');
    expect(fontIds).toContain('serif');
    expect(fontIds).toContain('montserrat');
    expect(fontIds).toContain('comfortaa');
    expect(fontIds).toContain('fira-code');
    expect(fontIds).toContain('playfair');
    expect(fontIds).toContain('caveat');
    expect(fontIds).toContain('russo');

    for (const font of FONT_OPTIONS) {
      expect(font.name).toBeTruthy();
      expect(font.sample).toBeTruthy();
      expect(font.fontFamilyCss).toBeTruthy();
    }
  });

  it('verifies scales, radii, card styles and densities definitions', () => {
    expect(FONT_SCALES.map((s) => s.id)).toEqual(['compact', 'normal', 'large']);
    expect(APP_RADII.map((r) => r.id)).toEqual(['compact', 'normal', 'soft']);
    expect(CARD_STYLES.map((c) => c.id)).toEqual(['glass', 'solid', 'bordered']);
    expect(SCHEDULE_DENSITIES.map((d) => d.id)).toEqual(['cozy', 'compact']);
  });
});
