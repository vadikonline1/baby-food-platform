import React from 'react';
import { View, Platform } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { getConfig } from './config';

// Unitatile banner vin din remote config (Admin → Setări). App ID-urile sunt
// build-time (app.json plugin) — unitatile se schimba fara rebuild.
// Daca nu e configurat nimic, folosim un unit de TEST ca bannerul sa fie
// mereu prezent (reclamă live apare doar cu unit real din admin).
export function bannerUnitId(): string {
  const cfg = getConfig();
  const units = Platform.OS === 'ios' ? cfg?.admob?.ios : cfg?.admob?.android;
  if (units?.banner) return units.banner;
  return Platform.OS === 'ios'
    ? 'ca-app-pub-3940256099942544/2934735716'   // banner test iOS
    : 'ca-app-pub-3940256099942544/6300978111';  // banner test Android
}

// Reclamă banner — reutilizată: Home (sus, în listă) + final de rețetă.
export function BannerAdBlock() {
  const unit = bannerUnitId();
  if (!unit) return null;
  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <BannerAd unitId={unit} size={BannerAdSize.BANNER} />
    </View>
  );
}