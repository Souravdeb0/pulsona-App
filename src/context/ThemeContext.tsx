import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { SafeStorage } from '@/services/storage';

type ThemeType = 'light' | 'dark';

type ThemeContextType = {
  theme: ThemeType;
  isDark: boolean;
  toggleTheme: () => Promise<void>;
  setTheme: (newTheme: ThemeType) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDark: false,
  toggleTheme: async () => {},
  setTheme: async () => {},
});

export function useAppTheme() {
  return useContext(ThemeContext);
}

const THEME_STORAGE_KEY = 'pulsona_user_theme';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // We default to strictly light mode for the premium clinical aesthetic
  const [theme, setThemeState] = useState<ThemeType>('light');
  const systemScheme = useSystemColorScheme();

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await SafeStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme === 'light' || storedTheme === 'dark') {
          setThemeState(storedTheme);
        } else {
          // If no explicitly stored preference, strictly default to light mode
          setThemeState('light');
        }
      } catch (e) {
        console.warn('Failed to load theme preference, defaulting to light', e);
        setThemeState('light');
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    await SafeStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    await setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
