# GustBebe — aplicații mobile (etapa 2, planned)

- **Application ID (Android `package` + iOS `bundleIdentifier`): `md.vadikonline1.gustbebe`** (vezi `app.json`).
- **Firebase nativ** (proiect `gustbebe-6513e`) — fișiere deja în repo (branch `main`):
  - Android: `google-services.json` (pachet `md.vadikonline1.gustbebe`)
  - iOS: `GoogleService-Info.plist` (bundle `md.vadikonline1.gustbebe`)
  - La build (EAS/Gradle/Xcode) se copiază din rădăcina repo în `android/app/` respectiv în proiectul iOS.
  - Config web (Analytics) se introduce din Admin → Setări aplicație → Firebase web (remote config, fără rebuild).

- **Application ID (Android `package` + iOS `bundleIdentifier`): `md.vadikonline1.gustbebe`** (vezi `app.json`).
- **Backend URL**: nu se hardcodează. La pornire, aplicația citește DNS-ul din
  `https://raw.githubusercontent.com/vadikonline1/pi.hole/refs/heads/main/hosts_app_dns`
  (linia `md.vadikonline1.gustbebe=<dns>`) și construiește baza API ca
  `https://<dns>/api`. Fallback: ultimul DNS cunoscut salvat local.
- Tot conținutul + setările (inclusiv AdMob) vin din API — vezi secțiunea
  „Aplicații mobile" din `README.md` (remote config, fără rebuild).
- **CI**: `.github/workflows/mobile-app.yml` — build EAS pe Android/iOS la push
  în `mobile/**` sau manual (workflow_dispatch: platformă + profil). Necesită
  secretul `EXPO_TOKEN` în repo Settings → Secrets. Până există `package.json`
  + `eas.json` în `mobile/`, workflow-ul trece pe verde fără să facă nimic.
