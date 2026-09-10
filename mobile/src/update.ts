import { Alert, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Verifica Release-urile GitHub dupa tag-urile `apk-main-*` (feed de actualizari).
// Daca sha difera de build_sha incorporat la build, propune descarcarea.
// Fiecare release e anuntat o singura data (nu mai "mereu apare actualizare").
const REPO = 'vadikonline1/baby-food-platform';
const SEEN_KEY = 'gb_seen_update_sha';

function versionFromBody(body?: string | null): string {
  const m = String(body || '').match(/\*\*Versiune aplicație:\*\*\s*([^\n*]+)/);
  return m?.[1]?.trim() || '';
}

export async function checkForUpdate(silent = true): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const current = (Constants.expoConfig?.extra as any)?.build_sha as string | undefined;
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=10`);
    if (!res.ok) return false;
    const releases: any[] = await res.json();
    const latest = releases.find((r) => !r.draft && String(r.tag_name || '').startsWith('apk-main-'));
    if (!latest) return false;
    const latestSha = String(latest.tag_name).replace(/^apk-main-/, '');
    if (current && latestSha === current) return false; // deja cea mai noua instalata
    const seen = await AsyncStorage.getItem(SEEN_KEY);
    if (seen === latestSha) return false; // acest release a fost deja anuntat
    await AsyncStorage.setItem(SEEN_KEY, latestSha);

    const version = versionFromBody(latest.body || latest.name);
    const apks = (latest.assets || []).filter((a: any) => String(a.name || '').endsWith('.apk'));
    const apk = apks.find((a: any) => /arm64-v8a/i.test(a.name)) || apks[0];
    const url = apk?.browser_download_url || latest.html_url;
    if (!silent) {
      Alert.alert('Actualizare disponibilă', `Versiune nouă a aplicației GustBebe${version ? ` (${version})` : ''}.`, [
        { text: 'Mai târziu', style: 'cancel' },
        { text: 'Descarcă', onPress: () => Linking.openURL(url) }
      ]);
    }
    return true;
  } catch {
    return false;
  }
}