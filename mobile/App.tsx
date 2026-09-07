import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import mobileAds from 'react-native-google-mobile-ads';
import { AuthProvider } from './src/store';
import { LangProvider } from './src/lang';
import { initApiBase } from './src/api';
import { loadConfig } from './src/config';
import { registerPushToken } from './src/push';
import Navigation from './src/navigation';

export default function App() {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  const boot = async () => {
    setState('loading');
    const base = await initApiBase(); // DNS din hosts_app_dns + cache local
    if (!base) {
      setState('error');
      return;
    }
    await loadConfig();               // remote config: AdMob units, support, auth
    try { await mobileAds().initialize(); } catch {}
    await registerPushToken();
    setState('ready');
  };

  useEffect(() => {
    boot();
  }, []);

  if (state === 'error') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fbf9f7' }}>
        <Text style={{ fontSize: 32, marginBottom: 12 }}>🌐</Text>
        <Text style={{ fontWeight: '700', fontSize: 16, color: '#333', textAlign: 'center' }}>
          Nu s-a putut stabili conexiunea cu serverul GustBebe.
        </Text>
        <Text style={{ color: '#5f7a70', fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 18 }}>
          Verifică internetul și apasă Reîncearcă.
        </Text>
        <TouchableOpacity
          onPress={boot}
          style={{ backgroundColor: '#1486b7', borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Reîncearcă</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (state !== 'ready') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#1486b7" />
        <StatusBar style="auto" />
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
