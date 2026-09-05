// Firebase web (Analytics) — initializare lenesa, doar daca exista config in setari.
// SDK-ul se incarca ca chunk separat, la nevoie. Fara config, zero cost.
let started = false;

export async function initFirebase() {
  if (started) return;
  started = true;
  try {
    const { api } = await import('./api');
    const { data } = await api.get('/settings/config');
    const f = data?.firebase;
    if (!f?.apiKey || !f?.appId) return;
    const { initializeApp } = await import('firebase/app');
    const app = initializeApp({
      apiKey: f.apiKey,
      authDomain: f.authDomain || undefined,
      projectId: f.projectId || undefined,
      storageBucket: f.storageBucket || undefined,
      messagingSenderId: f.messagingSenderId || undefined,
      appId: f.appId,
      measurementId: f.measurementId || undefined
    });
    if (f.measurementId) {
      const { getAnalytics, isSupported } = await import('firebase/analytics');
      if (await isSupported()) getAnalytics(app);
    }
  } catch {
    // analytics optional — site-ul functioneaza si fara
  }
}
