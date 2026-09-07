import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

// Remote config (AdMob units, support, auth, firebase) — cache local, refresh la pornire.
// Schimbarile din web (Admin → Setari) se aplica fara rebuild.
export type RemoteConfig = {
  admob: { android: any; ios: any };
  support: { enabled: boolean; title: any; text: any };
  auth: any;
  firebase: any;
};

let cache: RemoteConfig | null = null;

export async function loadConfig(): Promise<RemoteConfig | null> {
  try {
    const raw = await AsyncStorage.getItem('gb_remote_config');
    if (raw) cache = JSON.parse(raw);
  } catch {}
  try {
    const { data } = await api.get('/settings/config');
    cache = data;
    await AsyncStorage.setItem('gb_remote_config', JSON.stringify(data));
  } catch {}
  return cache;
}

export function getConfig(): RemoteConfig | null {
  return cache;
}
