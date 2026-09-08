import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import mobileAds from 'react-native-google-mobile-ads';
import { AuthProvider } from './src/store';
import { LangProvider, deviceLang, t } from './src/lang';
import { initApiBase, refreshApiBase } from './src/api';
import { loadConfig } from './src/config';
import { registerPushToken } from './src/push';
import Navigation from './src/navigation';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  const boot = async () => {
    setState('loading');
    const base = await initApiBase(); // DNS din hosts_app_dns + cache local
    if (!base) {
      setState('error');
      await SplashScreen.hideAsync().catch(() => {});
      return;
    }
    await loadConfig();               // remote config: AdMob units, support, auth
    try { await mobileAds().initialize(); } catch {}
    await registerPushToken();
    setState('ready');
    await SplashScreen.hideAsync().catch(() => {});
  };

  useEffect(() => {
    boot();
  }, []);

  // la revenirea app-ului în prim-plan: re-ia config remote + DNS (setările din
  // /admin -> Setări aplicație se aplică fără repornirea aplicației)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') {
        refreshApiBase();
        loadConfig().catch(() => {});
      }
    });
    return () => sub.remove();
  }, []);

  const lang = deviceLang();
  if (state === 'error') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fbf9f7' }}>
        <Text style={{ fontSize: 32, marginBottom: 12 }}>🌐</Text>
        <Text style={{ fontWeight: '700', fontSize: 16, color: '#333', textAlign: 'center' }}>
          {t('noConnection', lang)}
        </Text>
        <Text style={{ color: '#5f7a70', fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 18 }}>
          {t('noConnectionHint', lang)}
        </Text>
        <TouchableOpacity
          onPress={boot}
          style={{ backgroundColor: '#1486b7', borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>{t('retry', lang)}</Text>
        </TouchableOpacity>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (state !== 'ready') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1486b7' }}>
        <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800' }}>GustBebe</Text>
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 16 }} />
        <StatusBar style="light" />
      </View>
    );
  }
  return (
    <AuthProvider>
      <LangProvider>
        <Navigation />
        <StatusBar style="auto" />
      </LangProvider>
    </AuthProvider>
  );
}
