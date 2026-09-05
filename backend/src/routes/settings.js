const express = require('express');
const { prisma } = require('../lib/db');
const { authRequired, roleRequired } = require('../middleware/auth');

const router = express.Router();

// chei publice citite de aplicatiile mobile (remote config — fara rebuild)
const PUBLIC_KEYS = [
  'admob_android_banner', 'admob_android_rewarded_interstitial', 'admob_android_rewarded',
  'admob_ios_banner', 'admob_ios_rewarded_interstitial', 'admob_ios_rewarded',
  'support_enabled', 'support_title_ro', 'support_title_ru', 'support_title_en',
  'support_text_ro', 'support_text_ru', 'support_text_en'
];

// GET /api/settings — ADMIN (toate)
router.get('/', authRequired, roleRequired('ADMIN'), async (req, res) => {
  res.json(await prisma.appSetting.findMany({ orderBy: { key: 'asc' } }));
});

// PUT /api/settings — ADMIN (upsert in masa {key: value})
router.put('/', authRequired, roleRequired('ADMIN'), async (req, res) => {
  const body = req.body || {};
  const keys = Object.keys(body).slice(0, 100);
  for (const key of keys) {
    if (!/^[a-z0-9_]{1,64}$/.test(key)) continue;
    await prisma.appSetting.upsert({
      where: { key },
      create: { key, value: String(body[key] ?? '') },
      update: { value: String(body[key] ?? '') }
    });
  }
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
    }
  });
});

module.exports = router;
