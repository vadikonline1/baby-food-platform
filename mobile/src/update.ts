import { Alert, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';

// Verifica Release-urile GitHub dupa tag-urile `apk-main-*` (feed de actualizari).
// Daca sha difera de build_sha incorporat la build, propune descarcarea.
const REPO = 'vadikonline1/baby-food-platform';

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
    if (current && latestSha === current) return false;
    const apk = (latest.assets || []).find((a: any) => String(a.name || '').endsWith('.apk'));
    const url = apk?.browser_download_url || latest.html_url;
    if (!silent) {
      Alert.alert('Actualizare disponibilă', `Versiune nouă a aplicației GustBebe.`, [
        { text: 'Mai târziu', style: 'cancel' },
        { text: 'Descarcă', onPress: () => Linking.openURL(url) }
      ]);
    }
    return true;
  } catch {
    return false;
  }
}
