# GustBebe — aplicații mobile (etapa 2, planned)

- **Application ID (Android `package` + iOS `bundleIdentifier`): `md.vadikonline1.gustbebe`** (vezi `app.json`).
- **Backend URL**: nu se hardcodează. La pornire, aplicația citește DNS-ul din
  `https://raw.githubusercontent.com/vadikonline1/pi.hole/refs/heads/main/hosts_app_dns`
  (linia `md.vadikonline1.gustbebe=<dns>`) și construiește baza API ca
  `https://<dns>/api`. Fallback: ultimul DNS cunoscut salvat local.
- Tot conținutul + setările (inclusiv AdMob) vin din API — vezi secțiunea
  „Aplicații mobile" din `README.md` (remote config, fără rebuild).
