import { useState, useEffect, useCallback } from 'react';
import {
  ThemeMode,
  VisualTheme,
  FontFamily,
  FontScale,
  AppRadius,
  CardStyle,
  ScheduleDensity,
  ACCENT_COLORS,
  DEFAULT_SETTINGS,
} from '../types/settings';
import { StorageService } from '../services/storageService';
import { SyncService } from '../services/syncService';
import { RealtimeSyncService } from '../services/realtimeSync';

function hexToRgb(hex: string): string {
  const match = ACCENT_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase());
  if (match) return match.rgb;

  const clean = hex.replace('#', '');
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return `${r} ${g} ${b}`;
    }
  }
  return '0 122 255';
}

export function useTheme() {
  const [settings, setSettings] = useState(() => StorageService.getSettings());

  const themeMode = settings.theme || DEFAULT_SETTINGS.theme;
  const visualTheme = settings.visualTheme || DEFAULT_SETTINGS.visualTheme;
  const accentColor = settings.accentColor || DEFAULT_SETTINGS.accentColor;
  const fontFamily = settings.fontFamily || DEFAULT_SETTINGS.fontFamily;
  const fontScale = settings.fontScale || DEFAULT_SETTINGS.fontScale;
  const appRadius = settings.appRadius || DEFAULT_SETTINGS.appRadius;
  const cardStyle = settings.cardStyle || DEFAULT_SETTINGS.cardStyle;
  const scheduleDensity = settings.scheduleDensity || DEFAULT_SETTINGS.scheduleDensity;
  const reducedMotion = settings.reducedMotion ?? DEFAULT_SETTINGS.reducedMotion;
  const showTeacherInitials = settings.showTeacherInitials ?? DEFAULT_SETTINGS.showTeacherInitials;

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (themeMode === 'dark') return true;
    if (themeMode === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply theme classes and CSS variables to DOM
  useEffect(() => {
    const updateThemeState = () => {
      let activeIsDark = false;
      if (themeMode === 'dark') {
        activeIsDark = true;
      } else if (themeMode === 'light') {
        activeIsDark = false;
      } else {
        activeIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      setIsDark(activeIsDark);
      const root = document.documentElement;

      if (activeIsDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      // Attributes for CSS styling engines
      root.setAttribute('data-visual-theme', visualTheme);
      root.setAttribute('data-font', fontFamily);
      root.setAttribute('data-font-scale', fontScale);
      root.setAttribute('data-radius', appRadius);
      root.setAttribute('data-card-style', cardStyle);
      root.setAttribute('data-density', scheduleDensity);
      root.setAttribute('data-reduced-motion', String(reducedMotion));
      root.setAttribute('data-initials', String(showTeacherInitials));

      // Dynamic CSS variables for accent color
      const rgb = hexToRgb(accentColor);
      root.style.setProperty('--color-accent-rgb', rgb);
      root.style.setProperty('--color-accent-hex', accentColor);

      // Dynamic Mobile Header theme-color tag
      const metaTheme = document.querySelector('meta[name="theme-color"]:not([media])');
      if (metaTheme) {
        metaTheme.setAttribute('content', activeIsDark ? '#000000' : '#F2F2F7');
      }
    };

    updateThemeState();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themeMode === 'system') updateThemeState();
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [
    themeMode,
    visualTheme,
    accentColor,
    fontFamily,
    fontScale,
    appRadius,
    cardStyle,
    scheduleDensity,
    reducedMotion,
    showTeacherInitials,
  ]);

  const updateSetting = useCallback(<K extends keyof typeof DEFAULT_SETTINGS>(
    key: K,
    value: typeof DEFAULT_SETTINGS[K]
  ) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      StorageService.saveSettings(next);
      SyncService.pushToCloud();
      RealtimeSyncService.broadcast();
      return next;
    });
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => updateSetting('theme', mode), [updateSetting]);
  const setVisualTheme = useCallback((vt: VisualTheme) => updateSetting('visualTheme', vt), [updateSetting]);
  const setAccentColor = useCallback((hex: string) => updateSetting('accentColor', hex), [updateSetting]);
  const setFontFamily = useCallback((ff: FontFamily) => updateSetting('fontFamily', ff), [updateSetting]);
  const setFontScale = useCallback((scale: FontScale) => updateSetting('fontScale', scale), [updateSetting]);
  const setAppRadius = useCallback((radius: AppRadius) => updateSetting('appRadius', radius), [updateSetting]);
  const setCardStyle = useCallback((style: CardStyle) => updateSetting('cardStyle', style), [updateSetting]);
  const setScheduleDensity = useCallback((density: ScheduleDensity) => updateSetting('scheduleDensity', density), [updateSetting]);
  const setReducedMotion = useCallback((enabled: boolean) => updateSetting('reducedMotion', enabled), [updateSetting]);
  const setShowTeacherInitials = useCallback((enabled: boolean) => updateSetting('showTeacherInitials', enabled), [updateSetting]);

  const resetCustomizations = useCallback(() => {
    setSettings((prev) => {
      const next = {
        ...prev,
        theme: DEFAULT_SETTINGS.theme,
        visualTheme: DEFAULT_SETTINGS.visualTheme,
        accentColor: DEFAULT_SETTINGS.accentColor,
        fontFamily: DEFAULT_SETTINGS.fontFamily,
        fontScale: DEFAULT_SETTINGS.fontScale,
        appRadius: DEFAULT_SETTINGS.appRadius,
        cardStyle: DEFAULT_SETTINGS.cardStyle,
        scheduleDensity: DEFAULT_SETTINGS.scheduleDensity,
        reducedMotion: DEFAULT_SETTINGS.reducedMotion,
        showTeacherInitials: DEFAULT_SETTINGS.showTeacherInitials,
      };
      StorageService.saveSettings(next);
      SyncService.pushToCloud();
      RealtimeSyncService.broadcast();
      return next;
    });
  }, []);

  const reload = useCallback(() => {
    setSettings(StorageService.getSettings());
  }, []);

  useEffect(() => {
    const unsub = RealtimeSyncService.onUpdate(() => {
      reload();
    });
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === 'ksu_student_settings_v2') {
        reload();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      unsub();
      window.removeEventListener('storage', handleStorage);
    };
  }, [reload]);

  return {
    settings,
    updateSetting,
    themeMode,
    isDark,
    visualTheme,
    accentColor,
    fontFamily,
    fontScale,
    appRadius,
    cardStyle,
    scheduleDensity,
    reducedMotion,
    showTeacherInitials,
    setThemeMode,
    setVisualTheme,
    setAccentColor,
    setFontFamily,
    setFontScale,
    setAppRadius,
    setCardStyle,
    setScheduleDensity,
    setReducedMotion,
    setShowTeacherInitials,
    resetCustomizations,
    reload,
  };
}
