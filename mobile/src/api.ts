import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Sursa DNS este DOAR fișierul hosts_app_dns (configurabil oricând, fără rebuild):
//   md.vadikonline1.gustbebe=<host[:port]|https://host|http://host>
//   => base = https://<valoare>/api (întâi favoare https), cu fallback pe http://
// Rezultatul se verifică și se cache-uiește local. NU există fallback hardcodat.
const DNS_SOURCE =
  Constants.expoConfig?.extra?.dnsSource ||
  'https://raw.githubusercontent.com/vadikonline1/pi.hole/refs/heads/main/hosts_app_dns';
const DNS_KEY =
  Constants.expoConfig?.extra?.apiDnsKey || 'md.vadikonline1.gustbebe';

// creează candidatele de bază pentru o valoare din fișier (https întâi)
function buildCandidates(dns: string): string[] {
  const v = dns.trim().replace(/\/+$/, '');
  if (!v) return [];
  if (/^https?:\/\//i.test(v)) return [v.endsWith('/api') ? v : `${v}/api`];
  return [`https://${v}/api`, `http://${v}/api`];
}

// verifică rapid că baza răspunde (cheap: GET /settings/config)
async function probe(base: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`${base}/settings/config`, { signal: ctrl.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

export async function initApiBase(): Promise<string | null> {
  // cache prezent → start instant; reîmprospătarea DNS-ului merge în fundal
  let cached = '';
  try {
    cached = (await AsyncStorage.getItem('gb_api_base')) || '';
  } catch {}
  if (cached) {
    api.defaults.baseURL = cached;
    refreshApiBase();
    return cached;
  }
  return resolveApiBaseFresh();
}

async function resolveApiBaseFresh(): Promise<string | null> {
  let fresh = '';
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(DNS_SOURCE, { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      const text = await res.text();
      const line = text.split('\n').map((x) => x.trim()).find((x) => x.startsWith(DNS_KEY + '='));
      const dns = line ? line.split('=').slice(1).join('=').trim() : '';
      for (const cand of buildCandidates(dns)) {
        if (await probe(cand)) {
          fresh = cand;
          break;
        }
      }
    }
  } catch {
    // rămâne cache-ul (sau null → ecran reîncercare)
  }
  if (fresh) {
    api.defaults.baseURL = fresh;
    AsyncStorage.setItem('gb_api_base', fresh).catch(() => {});
    return fresh;
  }
  api.defaults.baseURL = undefined;
  return null;
}

// reîmprospătează DNS-ul în fundal (nu strică base-ul curent dacă eșuează)
export function refreshApiBase() {
  resolveApiBaseFresh().catch(() => {});
}

export const api = axios.create({ timeout: 15000 });

// baza curenta (pentru diagnostic in Profil)
export function getApiBase(): string {
  return typeof api.defaults.baseURL === 'string' ? api.defaults.baseURL : '';
}

// verificare manuala: raspunde baza curenta?
export async function checkConnection(): Promise<boolean> {
  const b = getApiBase();
  if (!b) return false;
  return probe(b);
}

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

// origin-ul serverului (http(s)://host[:port]) — fără /api, pentru imagini statice
export function apiOrigin(): string {
  const b = typeof api.defaults.baseURL === 'string' ? api.defaults.baseURL : '';
  return b.replace(/\/api\/?$/, '');
}

// convertește cale relativă /uploads/... → URL absolut (necesar pe mobil)
export function imgUrl(u?: string | null): string {
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  const origin = apiOrigin();
  const p = u.startsWith('/') ? u : `/${u}`;
  return origin ? `${origin}${p}` : p;
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
