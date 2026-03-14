import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  actualMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'system';
    }
    const savedMode = localStorage.getItem('theme-mode');
    if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
      return savedMode;
    }
    return 'system';
  });
  const [systemMode, setSystemMode] = useState<'light' | 'dark'>(() => getSystemTheme());

  // Keep system mode updated when OS theme changes.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setSystemMode(getSystemTheme());

    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const actualMode = mode === 'system' ? systemMode : mode;

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-mode', newMode);
    }
  };

  return (
    <ThemeContext.Provider value={{ mode, actualMode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
