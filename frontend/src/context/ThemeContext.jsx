import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'appPreferences';

const DEFAULT_PREFERENCES = {
  themeMode: 'system',
  displayName: '',
  contactEmail: '',
  timezone:
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC',
  language: 'English',
  emailNotifications: true,
  smsNotifications: false,
  twoFactor: true,
  reducedMotion: false,
};

const getSystemTheme = () => {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getInitialPreferences = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_PREFERENCES;
    }

    return {
      ...DEFAULT_PREFERENCES,
      ...JSON.parse(stored),
    };
  } catch (error) {
    console.error('Failed to read saved preferences:', error);
    return DEFAULT_PREFERENCES;
  }
};

export const ThemeProvider = ({ children }) => {
  const [preferences, setPreferences] = useState(getInitialPreferences);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  const resolvedTheme =
    preferences.themeMode === 'system'
      ? systemTheme
      : preferences.themeMode;

  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', isDark);
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [isDark, preferences, resolvedTheme]);

  const setThemeMode = (themeMode) => {
    setPreferences((current) => ({
      ...current,
      themeMode,
    }));
  };

  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const updatePreferences = (updates) => {
    setPreferences((current) => ({
      ...current,
      ...updates,
    }));
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  const value = useMemo(
    () => ({
      preferences,
      resolvedTheme,
      isDark,
      setThemeMode,
      toggleTheme,
      updatePreferences,
      resetPreferences,
    }),
    [isDark, preferences, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
