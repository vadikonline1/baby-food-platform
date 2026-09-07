// Setari server: ENV intai, fallback pe valorile din Admin UI (DB).
// Permite configurarea SMTP / Telegram / APP_URL din interfata
// atunci cand lipsesc din .env — fara restart.
const { prisma } = require('./db');

let cache = { at: 0, map: {} };
const TTL = 30000;

async function dbMap() {
  if (Date.now() - cache.at < TTL) return cache.map;
  try {
    const rows = await prisma.appSetting.findMany();
    cache = { at: Date.now(), map: Object.fromEntries(rows.map((r) => [r.key, r.value])) };
  } catch {}
  return cache.map;
}

function envVal(key) {
  const v = process.env[key];
  return v !== undefined && v !== '' ? v : null;
}

// cheia ENV (ex: SMTP_HOST) sau cheia DB (ex: smtp_host) — intoarce { value, source }
async function getSetting(envKey, dbKey) {
  const e = envVal(envKey);
  if (e !== null) return { value: e, source: 'env' };
  const m = await dbMap();
  const k = (dbKey || envKey).toLowerCase();
  return { value: m[k] !== undefined && m[k] !== '' ? m[k] : '', source: 'db' };
}

async function getValue(envKey, dbKey, fallback = '') {
  const { value } = await getSetting(envKey, dbKey);
  return value !== '' ? value : fallback;
}

function invalidate() {
  cache.at = 0;
}

module.exports = { getSetting, getValue, invalidate, envVal };
