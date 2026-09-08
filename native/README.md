# GustBebe — aplicație NATIVĂ Android (Jetpack Compose, Material 3 Expressive)

Aplicație 100% nativă (Kotlin), separată de varianta Expo din `mobile/`.

- **Pachet:** `md.vadikonline1.gustbebe`, minSdk 24, target/compile 36, Java 17, Kotlin 2.3.0
- **UI:** Material 3 Expressive light (schema exactă de culori), Roboto (sistem),
  Material Symbols Rounded, Roboto implicit, ripple + press-scale, back nativ.
- **Navigare:** TopAppBar (menu + more) + TabRow (Home/Categorii/Ghid) +
  NavigationBar (Rețete/Random/Favorit/Setări) + sertar lateral.
- **Date:** Retrofit + Gson către același `/api` (DNS rezolvat din hosts_app_dns,
  ca și aplicația Expo), Room (favorite offline), DataStore (limbă/token/setări).
- **Reclame:** play-services-ads (banner la finalul rețetei; Susține →
  rewarded interstitial, fallback rewarded; unități din remote config).
- **Auth:** login/register opțional (ca pe web), editare nume + parolă.

## Build local

```bash
# necesita Android SDK + JDK 17
cd native
gradle :app:assembleRelease   # sau ./gradlew daca ai wrapper
```

## CI

`.github/workflows/build-native-apk.yml` — la push în `native/**`: build release
(semnat cu cheie debug, instalabil direct) +Artifact + Release `native-apk-main-<sha>`.
