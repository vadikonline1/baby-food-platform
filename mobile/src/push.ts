import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

// Inregistreaza tokenul Expo Push pe backend (cu/fara cont). Apelat la pornire + login/logout.
export async function registerPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null;
    const enabled = await AsyncStorage.getItem('gb_push_enabled');
    if (enabled === 'off') return null;
    const { status: existing } = await Notifications.getPermissionsAsync();
    const { status } =
      existing === 'granted' ? { status: existing } : await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return null;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const token = data as unknown as string;
    await api.post('/push/tokens', { token, platform: Platform.OS }).catch(() => {});
    await AsyncStorage.setItem('gb_push_token', token);
    return token;
  } catch {
    return null;
  }
}

// Dezactivare push (Profil): sterge tokenul de pe backend + flag local
export async function disablePush(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem('gb_push_token');
    if (token) await api.delete('/push/tokens', { data: { token } }).catch(() => {});
    await AsyncStorage.removeItem('gb_push_token');
    await AsyncStorage.setItem('gb_push_enabled', 'off');
  } catch {}
}

export async function enablePush(): Promise<void> {
  await AsyncStorage.setItem('gb_push_enabled', 'on');
  await registerPushToken();
}

export async function isPushEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem('gb_push_enabled')) !== 'off';
}
