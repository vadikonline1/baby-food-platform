import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tema aplicatiei: Sistem / Deschisa / Inchisa — persistata local.
// Paleta = cea din web UI (albastru bebe #1486b7 + verde brad #065f46).
export const THEME_MODES = ['system', 'light', 'dark'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

const KEY = 'gb_theme';

export const light = {
  dark: false,
  bg: '#fbf9f7',
  card: '#ffffff',
  ink: '#1e2f2b',
  muted: '#5f7a70',
  line: '#f0f4f1',
  lineStrong: '#cfdfee',
  primary: '#1486b7',
  primaryDark: '#0d6488',
  primarySoft: '#e8f3f9',
  onPrimary: '#ffffff',
  pine: '#065f46',
  tgBlue: '#1c8cd8',
  amber: '#b45309',
  danger: '#b91c1c',
  heart: '#e11d48',
  saveOn: '#15803d',
  tabInactive: '#888888',
  chipBorder: '#bcd9ea',
  ghostBg: '#eef4fa',
  starOff: '#d6cfbd',
  inputBg: '#ffffff',
  overlay: 'rgba(0,0,0,0.45)',
};

export type Palette = typeof light;

export const dark: Palette = {
  dark: true,
  bg: '#101915',
  card: '#16211c',
  ink: '#e9f0eb',
  muted: '#9db3a7',
  line: '#223029',
  lineStrong: '#2e4038',
  primary: '#7fc9e8',
  primaryDark: '#bfe3f4',
  primarySoft: '#123543',
  onPrimary: '#06303f',
  pine: '#7bc8a4',
  tgBlue: '#4aa3e8',
  amber: '#f0b35c',
  danger: '#f2a3a3',
  heart: '#f0608a',
  saveOn: '#1e7a45',
  tabInactive: '#8aa39a',
  chipBorder: '#2e4038',
  ghostBg: '#1c2822',
  starOff: '#3a4a43',
  inputBg: '#1c2822',
  overlay: 'rgba(0,0,0,0.55)',
};

type Ctx = { mode: ThemeMode; setMode: (m: ThemeMode) => void; c: Palette; isDark: boolean };

const ThemeContext = createContext<Ctx>({ mode: 'system', setMode: () => {}, c: light, isDark: false });
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await AsyncStorage.getItem(KEY);
        if (s === 'light' || s === 'dark' || s === 'system') setModeState(s);
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(KEY, m).catch(() => {});
  };

  const isDark = mode === 'dark' || (mode === 'system' && scheme === 'dark');
  if (!loaded) return null;
  return <ThemeContext.Provider value={{ mode, setMode, c: isDark ? dark : light, isDark }}>{children}</ThemeContext.Provider>;
}
