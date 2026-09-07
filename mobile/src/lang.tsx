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

export function deviceLang(): Lang {
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

// dicționar minim UI (conținutul rețetelor e deja localizat pe server)
const STRINGS: Record<string, Record<Lang, string>> = {
  loading: { ro: 'Se încarcă...', ru: 'Загрузка...', en: 'Loading...' },
  ingredients: { ro: 'Ingrediente', ru: 'Ингредиенты', en: 'Ingredients' },
  prep: { ro: 'Preparare', ru: 'Приготовление', en: 'Preparation' },
  vote: { ro: 'Votează', ru: 'Оценить', en: 'Rate' },
  save: { ro: 'Salvează', ru: 'Сохранить', en: 'Save' },
  saved: { ro: 'Salvat', ru: 'Сохранено', en: 'Saved' },
  search: { ro: 'Caută rețetă...', ru: 'Поиск рецепта...', en: 'Search recipe...' },
  filters: { ro: 'Filtre', ru: 'Фильтры', en: 'Filters' },
  apply: { ro: 'Aplică', ru: 'Применить', en: 'Apply' },
  reset: { ro: 'Resetează', ru: 'Сбросить', en: 'Reset' },
  close: { ro: 'Închide', ru: 'Закрыть', en: 'Close' },
  age: { ro: 'Vârstă', ru: 'Возраст', en: 'Age' },
  categories: { ro: 'Categorii', ru: 'Категории', en: 'Categories' },
  favorites: { ro: 'Favorite', ru: 'Избранное', en: 'Favorites' },
  myFavorites: { ro: '❤ Favoritele mele →', ru: '❤ Моё избранное →', en: '❤ My favorites →' },
  noFavorites: { ro: 'Nicio rețetă salvată încă. ♡', ru: 'Пока нет сохранённых рецептов. ♡', en: 'No saved recipes yet. ♡' },
  home: { ro: 'Rețete', ru: 'Рецепты', en: 'Recipes' },
  plan: { ro: 'Plan', ru: 'План', en: 'Plan' },
  random: { ro: 'Surpriză', ru: 'Сюрприз', en: 'Surprise' },
  profile: { ro: 'Profil', ru: 'Профиль', en: 'Profile' },
  another: { ro: '🔀 Alta rețetă', ru: '🔀 Другой рецепт', en: '🔀 Another recipe' },
  noConnection: { ro: 'Nu s-a putut stabili conexiunea cu serverul GustBebe.', ru: 'Не удалось установить соединение с сервером GustBebe.', en: 'Could not connect to the GustBebe server.' },
  noConnectionHint: { ro: 'Verifică internetul și apasă Reîncearcă.', ru: 'Проверьте интернет и нажмите «Повторить».', en: 'Check your internet and press Retry.' },
  retry: { ro: 'Reîncearcă', ru: 'Повторить', en: 'Retry' },
};

export function t(key: string, lang: Lang): string {
  const row = STRINGS[key];
  return row?.[lang] ?? row?.ro ?? key;
}

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