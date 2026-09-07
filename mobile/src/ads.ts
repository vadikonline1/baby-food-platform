import { Platform } from 'react-native';
import { getConfig } from './config';

// Unitatile banner vin din remote config (Admin → Setari). App ID-urile sunt
// build-time (app.json plugin) — unitatile se schimba fara rebuild.
export function bannerUnitId(): string {
  const cfg = getConfig();
  const units = Platform.OS === 'ios' ? cfg?.admob?.ios : cfg?.admob?.android;
  return units?.banner || '';
}
