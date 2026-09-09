const express = require('express');
const { prisma } = require('../lib/db');
const { authRequired, roleRequired } = require('../middleware/auth');
const { invalidate } = require('../lib/settings');

const router = express.Router();

// chei de server (ENV) cu corespondent editabil in UI (DB, lowercase).
// La runtime: ENV castiga daca e setat, altfel valoarea din UI.
const SERVER_KEYS = [
  { db: 'app_url', env: 'APP_URL' },
  { db: 'dns_source_url', env: 'DNS_SOURCE_URL' },
  { db: 'smtp_host', env: 'SMTP_HOST' },
  { db: 'smtp_port', env: 'SMTP_PORT' },
  { db: 'smtp_secure', env: 'SMTP_SECURE' },
  { db: 'smtp_user', env: 'SMTP_USER' },
  { db: 'smtp_pass', env: 'SMTP_PASS' },
  { db: 'smtp_from', env: 'SMTP_FROM' },
  { db: 'telegram_bot_token', env: 'TELEGRAM_BOT_TOKEN' },
  { db: 'telegram_channel_id', env: 'TELEGRAM_CHANNEL_ID' },
  { db: 'telegram_topic_id', env: 'TELEGRAM_TOPIC_ID' },
  { db: 'telegram_channel_admin', env: 'TELEGRAM_CHANNEL_ADMIN' }
];

// chei publice citite de aplicatiile mobile + web (remote config — fara rebuild)
// ATENTIE: aici intra doar valori publice (cheile Firebase web sunt publice by design)
const PUBLIC_KEYS = [
  'admob_android_banner', 'admob_android_rewarded_interstitial', 'admob_android_rewarded',
  'admob_ios_banner', 'admob_ios_rewarded_interstitial', 'admob_ios_rewarded',
  'support_enabled', 'support_title_ro', 'support_title_ru', 'support_title_en',
  'support_text_ro', 'support_text_ru', 'support_text_en',
  'firebase_web_apikey', 'firebase_web_authdomain', 'firebase_web_projectid',
  'firebase_web_storagebucket', 'firebase_web_senderid', 'firebase_web_appid', 'firebase_web_measurementid',
  'store_android_url', 'store_ios_url',
  'telegram_public_url',
  'home_hero_title_ro', 'home_hero_title_ru', 'home_hero_title_en',
  'home_hero_subtitle_ro', 'home_hero_subtitle_ru', 'home_hero_subtitle_en',
  'auth_google_enabled', 'auth_google_web_client_id', 'auth_google_ios_client_id', 'auth_google_android_client_id',
  'auth_apple_enabled', 'auth_apple_service_id'
];

// GET /api/settings — ADMIN (toate, cu valoarea efectiva si sursa env/db)
router.get('/', authRequired, roleRequired('ADMIN'), async (req, res) => {
  const rows = await prisma.appSetting.findMany({ orderBy: { key: 'asc' } });
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
  const out = rows.map(r => ({ key: r.key, value: r.value, source: 'db' }));
  for (const { db, env } of SERVER_KEYS) {
    const e = process.env[env];
    const existing = out.find(o => o.key === db);
    if (e !== undefined && e !== '') {
      if (existing) { existing.value = e; existing.source = 'env'; }
      else out.push({ key: db, value: e, source: 'env' });
    } else if (!existing) {
      out.push({ key: db, value: '', source: 'db' });
    }
  }
  res.json(out);
});

// PUT /api/settings — ADMIN (upsert in masa {key: value}; cheile ajung in DB)
router.put('/', authRequired, roleRequired('ADMIN'), async (req, res) => {
  const body = req.body || {};
  const keys = Object.keys(body).slice(0, 100);
  for (const key of keys) {
    if (!/^[A-Za-z0-9_]{1,64}$/.test(key)) continue;
    await prisma.appSetting.upsert({
      where: { key },
      create: { key, value: String(body[key] ?? '') },
      update: { value: String(body[key] ?? '') }
    });
  }
  invalidate();
  res.json({ ok: true, saved: keys.length });
});

// GET /api/settings/config — PUBLIC (doar cheile albe, structurat pentru apps)
router.get('/config', async (req, res) => {
  const rows = await prisma.appSetting.findMany({ where: { key: { in: PUBLIC_KEYS } } });
  const m = Object.fromEntries(rows.map(r => [r.key, r.value]));
  res.json({
    admob: {
      android: {
        banner: m.admob_android_banner || '',
        rewardedInterstitial: m.admob_android_rewarded_interstitial || '',
        rewarded: m.admob_android_rewarded || ''
      },
      ios: {
        banner: m.admob_ios_banner || '',
        rewardedInterstitial: m.admob_ios_rewarded_interstitial || '',
        rewarded: m.admob_ios_rewarded || ''
      }
    },
    support: {
      enabled: (m.support_enabled || 'true') === 'true',
      title: { ro: m.support_title_ro || '', ru: m.support_title_ru || '', en: m.support_title_en || '' },
      text: { ro: m.support_text_ro || '', ru: m.support_text_ru || '', en: m.support_text_en || '' }
    },
    firebase: {
      apiKey: m.firebase_web_apikey || '',
      authDomain: m.firebase_web_authdomain || '',
      projectId: m.firebase_web_projectid || '',
      storageBucket: m.firebase_web_storagebucket || '',
      messagingSenderId: m.firebase_web_senderid || '',
      appId: m.firebase_web_appid || '',
      measurementId: m.firebase_web_measurementid || ''
    },
    stores: {
      android: m.store_android_url || '',
      ios: m.store_ios_url || ''
    },
    telegram: {
      channelUrl: m.telegram_public_url || ''
    },
    home: {
      heroTitle: { ro: m.home_hero_title_ro || '', ru: m.home_hero_title_ru || '', en: m.home_hero_title_en || '' },
      heroSubtitle: { ro: m.home_hero_subtitle_ro || '', ru: m.home_hero_subtitle_ru || '', en: m.home_hero_subtitle_en || '' }
    },
    auth: {
      google: {
        enabled: (m.auth_google_enabled || 'false') === 'true',
        webClientId: m.auth_google_web_client_id || '',
        iosClientId: m.auth_google_ios_client_id || '',
        androidClientId: m.auth_google_android_client_id || ''
      },
      apple: {
        enabled: (m.auth_apple_enabled || 'false') === 'true',
        serviceId: m.auth_apple_service_id || ''
      }
    }
  });
});

module.exports = router;
