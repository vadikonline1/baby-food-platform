import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import mobileAds from 'react-native-google-mobile-ads';
import { AuthProvider } from './src/store';
import { initApiBase } from './src/api';
import { loadConfig } from './src/config';
import { registerPushToken } from './src/push';
import Navigation from './src/navigation';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await initApiBase();      // DNS din hosts_app_dns (cu fallback)
      await loadConfig();       // remote config: AdMob units, support, auth
      try { await mobileAds().initialize(); } catch {}
      await registerPushToken();
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#1486b7" />
        <StatusBar style="auto" />
      </View>
    );
  }
  return (
    <AuthProvider>
      <Navigation />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
