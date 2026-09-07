import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { api } from './api';

// Limba aplicației: selectată în Profil, persistată local; implicit = limba telefonului.
// Dacă utilizatorul e logat, alegerea se sincronizează și pe cont (câmpul user.lang).
export const LANGS = ['ro', 'ru', 'en'] as const;
export type Lang = (typeof LANGS)[number];

const STORAGE_KEY = 'gb_lang';

function pickSupported(tag: string): Lang {
  const code = String(tag || '').split('-')[0].toLowerCase();
  return (LANGS as readonly string[]).includes(code) ? (code as Lang) : 'ro';
}

function deviceLang(): Lang {
  try {
    const locales = Localization.getLocales();
    return pickSupported(locales[0]?.languageCode || '');
  } catch {
    return 'ro';
  }
}

type Ctx = { lang: Lang; setLang: (l: Lang) => void };

const LangContext = createContext<Ctx>({ lang: 'ro', setLang: () => {} });
export const useLang = () => useContext(LangContext);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ro');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      let initial: Lang = deviceLang();
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) initial = pickSupported(saved);
      } catch {}
      setLangState(initial);
      setLoaded(true);
    })();
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {});
    // sincronizare pe cont (dacă există token, PATCH /auth/me acceptă lang ro/ru/en)
    api.patch('/auth/me', { lang: l }).catch(() => {});
  };

  if (!loaded) return null;
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}