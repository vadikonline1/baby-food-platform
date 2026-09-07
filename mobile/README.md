# GustBebe — aplicație mobilă (Expo, Android + iOS)

- **Application ID:** `md.vadikonline1.gustbebe` (Android `package` + iOS `bundleIdentifier`)
- **Expo:** slug `mdvadikonline1gustbebe`, owner `vadikonline1`, project `3f0b4b3e-8ea9-4671-9ffe-5ef549ad3f84`
- **Backend URL**: rezolvat la pornire din
  `https://raw.githubusercontent.com/vadikonline1/pi.hole/refs/heads/main/hosts_app_dns`
  (`md.vadikonline1.gustbebe=<dns>` → `https://<dns>/api`), cu fallback la ultimul cunoscut.
- **Tot conținutul + setările vin din API** (remote config — fără rebuild):
  `GET /api/settings/config` (AdMob units, buton Susține, login social).
- **Meniu:** Rețete (carduri + filtru + căutare), Categorii, Plan (ghid + populare),
  Random Rețeta, Profil (push on/off, login opțional, editare nume/parolă, favorite, susținere).
- **Fără cont obligatoriu:** votul merge ca guest (`deviceId`), favoritele guest în cache local.
- **Reclame:** Banner **doar la finalul rețetei** (unit din remote config);
  butonul „Susține proiectul” → Intercalat cu recompensă, fallback Cu recompensă.
  ATENȚIE: App ID-urile AdMob sunt **build-time** (`app.json` plugin) — pune ID-urile
  reale înainte de buildul de producție (momentan `ca-app-pub-XXXX~XXXX`).
- **Push:** token Expo înregistrat pe backend (`/push/tokens`); comutator în Profil.
  Android push necesită `google-services.json` (din rădăcina repo) — EAS îl ia
  automat dacă e în `mobile/` la build sau via `eas credentials`. iOS push: APNs key în EAS.
- **Firebase nativ** (proiect `gustbebe-6513e`): `google-services.json` + `GoogleService-Info.plist`
  în rădăcina repo-ului.

## Dezvoltare

```bash
cd mobile
npm install
npx expo start        # + Expo Go, sau:
npm run android / npm run ios
npm run typecheck
```

## Build producție (EAS)

```bash
eas login
eas build --platform android --profile preview   # APK test
eas build --platform android --profile production
eas build --platform ios --profile production
```

CI: `.github/workflows/build-apk.yml` + `build-ios.yml` (necesită secretul `EXPO_TOKEN`).
