import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Baza API se rezolva la pornire din hosts_app_dns (poate sa se schimbe):
// md.vadikonline1.gustbebe=<dns>  =>  https://<dns>/api
const DNS_SOURCE =
  Constants.expoConfig?.extra?.dnsSource ||
  'https://raw.githubusercontent.com/vadikonline1/pi.hole/refs/heads/main/hosts_app_dns';
const DNS_KEY =
  Constants.expoConfig?.extra?.apiDnsKey || 'md.vadikonline1.gustbebe';
const FALLBACK_BASE = 'https://gustbebe.aalto.md/api';

let baseURL = FALLBACK_BASE;

export async function initApiBase(): Promise<string> {
  try {
    const cached = await AsyncStorage.getItem('gb_api_base');
    if (cached) baseURL = cached;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(DNS_SOURCE, { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      const text = await res.text();
      const line = text.split('\n').map((x) => x.trim()).find((x) => x.startsWith(DNS_KEY + '='));
      const dns = line ? line.split('=').slice(1).join('=').trim() : '';
      if (dns) {
        baseURL = `https://${dns}/api`;
        await AsyncStorage.setItem('gb_api_base', baseURL);
      }
    }
  } catch {
    // ramane fallback/cache
  }
  api.defaults.baseURL = baseURL;
  return baseURL;
}

export const api = axios.create({ baseURL, timeout: 15000 });

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
