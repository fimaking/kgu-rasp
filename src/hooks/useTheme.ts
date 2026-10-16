import { useState, useEffect } from 'react';
import { ThemeMode } from '../types/settings';
import { StorageService } from '../services/storageService';

export function useTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return StorageService.getSettings().theme;
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (themeMode === 'dark') return true;
    if (themeMode === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const updateTheme = () => {
      let activeIsDark = false;
      if (themeMode === 'dark') {
        activeIsDark = true;
      } else if (themeMode === 'light') {
        activeIsDark = false;
      } else {
        activeIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      setIsDark(activeIsDark);
      if (activeIsDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    updateTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themeMode === 'system') updateTheme();
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  const changeTheme = (newMode: ThemeMode) => {
    setThemeMode(newMode);
    const settings = StorageService.getSettings();
    StorageService.saveSettings({ ...settings, theme: newMode });
  };

  return {
    themeMode,
    isDark,
    setThemeMode: changeTheme,
  };
}
