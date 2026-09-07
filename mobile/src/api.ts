import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Sursa DNS este DOAR fișierul hosts_app_dns (configurabil oricând, fără rebuild):
//   md.vadikonline1.gustbebe=<host[:port]|full url>  =>  base = http[s]://<valoare>/api
// Valoarea poate fi "host:port" (se prefixează http:// — serverul e pe HTTP) sau
// chiar un URL complet cu schemă (https://...). Rezultatul se cache-uiește local.
// NU există fallback hardcodat în cod — schimbarea DNS-ului = editare în fișier.
const DNS_SOURCE =
  Constants.expoConfig?.extra?.dnsSource ||
  'https://raw.githubusercontent.com/vadikonline1/pi.hole/refs/heads/main/hosts_app_dns';
const DNS_KEY =
  Constants.expoConfig?.extra?.apiDnsKey || 'md.vadikonline1.gustbebe';

// ia valoarea din fișier (deja cu schemă → o lasă; altfel http://, serverul e pe HTTP)
function resolveBase(dns: string): string {
  const v = dns.trim().replace(/\/+$/, '');
  if (!v) return '';
  const baseUrl = /^https?:\/\//i.test(v) ? v : `http://${v}`;
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
}

let baseURL: string | null = null;

export async function initApiBase(): Promise<string | null> {
  let resolved = '';
  try {
    const cached = await AsyncStorage.getItem('gb_api_base');
    if (cached) {
      baseURL = cached;
      resolved = cached;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(DNS_SOURCE, { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      const text = await res.text();
      const line = text.split('\n').map((x) => x.trim()).find((x) => x.startsWith(DNS_KEY + '='));
      const dns = line ? line.split('=').slice(1).join('=').trim() : '';
      const fresh = resolveBase(dns);
      if (fresh) {
        resolved = fresh;
        baseURL = fresh;
        await AsyncStorage.setItem('gb_api_base', fresh);
      }
    }
  } catch {
    // rămâne cache-ul (sau null → ecran reîncercare)
  }
  api.defaults.baseURL = (resolved || baseURL) ?? undefined;
  return baseURL;
}

export const api = axios.create({ baseURL: baseURL ?? undefined, timeout: 15000 });

api.interceptors.request.use(async (cfg) => {
  const token = await SecureStore.getItemAsync('gb_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export function localized(obj: any, base: string, lang: string): string {
  if (!obj) return '';
  const cap = lang.charAt(0).toUpperCase() + lang.slice(1);
  return obj[`${base}${cap}`] ?? obj[`${base}Ro`] ?? '';
}

// id unic stabil al dispozitivului (pentru vot guest) — generat o data, pastrat local
export async function deviceId(): Promise<string> {
  let id = await AsyncStorage.getItem('gb_device_id');
  if (!id) {
    id = 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    await AsyncStorage.setItem('gb_device_id', id);
  }
  return id;
}
