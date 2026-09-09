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
  feeding: { ro: 'Tip alimentare', ru: 'Тип питания', en: 'Meal type' },
  restrictions: { ro: 'Restricții', ru: 'Ограничения', en: 'Restrictions' },
  categories: { ro: 'Categorii', ru: 'Категории', en: 'Categories' },
  favorites: { ro: 'Favorite', ru: 'Избранное', en: 'Favorites' },
  myFavorites: { ro: '❤ Favoritele mele →', ru: '❤ Моё избранное →', en: '❤ My favorites →' },
  noFavorites: { ro: 'Nicio rețetă salvată încă. ♡', ru: 'Пока нет сохранённых рецептов. ♡', en: 'No saved recipes yet. ♡' },
  home: { ro: 'Rețete', ru: 'Рецепты', en: 'Recipes' },
  plan: { ro: 'Ghid', ru: 'Гид', en: 'Guide' },
  random: { ro: 'Random', ru: 'Random', en: 'Random' },
  profile: { ro: 'Profil', ru: 'Профиль', en: 'Profile' },
  another: { ro: 'Alta rețetă', ru: 'Другой рецепт', en: 'Another recipe' },
  anotherShort: { ro: 'Alta', ru: 'Другая', en: 'Another' },
  noConnection: { ro: 'Nu s-a putut stabili conexiunea cu serverul GustBebe.', ru: 'Не удалось установить соединение с сервером GustBebe.', en: 'Could not connect to the GustBebe server.' },
  noConnectionHint: { ro: 'Verifică internetul și apasă Reîncearcă.', ru: 'Проверьте интернет и нажмите «Повторить».', en: 'Check your internet and press Retry.' },
  retry: { ro: 'Reîncearcă', ru: 'Повторить', en: 'Retry' },
  details: { ro: 'Detalii', ru: 'Подробнее', en: 'Details' },
  openDetails: { ro: 'deschide →', ru: 'открыть →', en: 'open →' },
  planTitle: { ro: 'Ghid diversificare', ru: 'Гид по прикорму', en: 'Feeding guide' },
  recommended: { ro: 'Rețete recomandate', ru: 'Рекомендуемые рецепты', en: 'Recommended recipes' },
  filterActive: { ro: 'Filtru activ', ru: 'Фильтр активен', en: 'Active filter' },
  clearFilter: { ro: 'Șterge', ru: 'Убрать', en: 'Clear' },
  recipesCount: { ro: 'rețete', ru: 'рецептов', en: 'recipes' },
  detailTitle: { ro: 'Rețeta', ru: 'Рецепт', en: 'Recipe' },
  favTitle: { ro: 'Favorite', ru: 'Избранное', en: 'Favorites' },
  updateAvailable: { ro: '⬇️ Actualizare disponibilă — apasă pentru detalii', ru: '⬇️ Доступно обновление — нажмите', en: '⬇️ Update available — tap for details' },
  pushNotif: { ro: 'Notificări push', ru: 'Push-уведомления', en: 'Push notifications' },
  language: { ro: 'Limba', ru: 'Язык', en: 'Language' },
  authName: { ro: 'Nume', ru: 'Имя', en: 'Name' },
  authEmail: { ro: 'Email', ru: 'Email', en: 'Email' },
  authPass: { ro: 'Parolă', ru: 'Пароль', en: 'Password' },
  continueOpt: { ro: 'Continuă (opțional)', ru: 'Продолжить (необязательно)', en: 'Continue (optional)' },
  optionalNote: { ro: 'Contul e opțional — rețetele, votul și favoritele merg și fără.', ru: 'Аккаунт необязателен — рецепты, оценки и избранное работают и без него.', en: 'Account is optional — recipes, ratings and favorites work without it.' },
  newName: { ro: 'Nume nou', ru: 'Новое имя', en: 'New name' },
  saveName: { ro: 'Salvează numele', ru: 'Сохранить имя', en: 'Save name' },
  curPass: { ro: 'Parola curentă', ru: 'Текущий пароль', en: 'Current password' },
  newPass: { ro: 'Parola nouă', ru: 'Новый пароль', en: 'New password' },
  changePass: { ro: 'Schimbă parola', ru: 'Сменить пароль', en: 'Change password' },
  logout: { ro: 'Deconectare', ru: 'Выйти', en: 'Log out' },
  verifyEmail: { ro: 'Verifică emailul pentru activare.', ru: 'Подтвердите email для активации.', en: 'Check your email to activate.' },
  invalidData: { ro: 'Date invalide.', ru: 'Неверные данные.', en: 'Invalid credentials.' },
  unverified: { ro: 'Cont neconfirmat — verifică emailul.', ru: 'Аккаунт не подтверждён — проверьте email.', en: 'Unverified account — check your email.' },
  okSaved: { ro: 'Nume salvat.', ru: 'Имя сохранено.', en: 'Name saved.' },
  okPass: { ro: 'Parolă schimbată.', ru: 'Пароль сменён.', en: 'Password changed.' },
  errSave: { ro: 'Nu s-a salvat.', ru: 'Не сохранено.', en: 'Not saved.' },
  errPass: { ro: 'Parola curentă e greșită.', ru: 'Неверный текущий пароль.', en: 'Wrong current password.' },
  minChars: { ro: 'Minim 6 caractere.', ru: 'Минимум 6 символов.', en: 'Minimum 6 characters.' },
  supportFallback: { ro: 'Susține proiectul 🎁', ru: 'Поддержать проект 🎁', en: 'Support the project 🎁' },
  tgSubscribe: { ro: '📢 Abonare Telegram', ru: '📢 Telegram-канал', en: '📢 Telegram channel' },
  apiBase: { ro: 'Server API', ru: 'Сервер API', en: 'API server' },
  checkConn: { ro: 'Verifică conexiunea', ru: 'Проверить соединение', en: 'Check connection' },
  connOk: { ro: 'Conexiune OK — serverul răspunde.', ru: 'Соединение в порядке.', en: 'Connection OK — server responds.' },
  connFail: { ro: 'Fără conexiune — verifică internetul, VPN-ul sau DNS-ul.', ru: 'Нет соединения — проверьте интернет.', en: 'No connection — check internet, VPN or DNS.' },
  theme: { ro: 'Tema', ru: 'Тема', en: 'Theme' },
  themeSystem: { ro: 'Sistem', ru: 'Система', en: 'System' },
  themeLight: { ro: 'Deschisă', ru: 'Светлая', en: 'Light' },
  themeDark: { ro: 'Închisă', ru: 'Тёмная', en: 'Dark' },
  acasa: { ro: 'Acasă', ru: 'Главная', en: 'Home' },
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