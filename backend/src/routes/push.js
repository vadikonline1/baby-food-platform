const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/db');
const { getValue } = require('../lib/settings');
const { authRequired, roleRequired } = require('../middleware/auth');

const router = express.Router();

function optionalAuth(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET || 'gustbebe-dev-secret-change-me');
    return { id: p.id, role: p.role };
  } catch { return null; }
}

// POST /api/push/tokens { token, platform? } — inregistrare token Expo Push (guest sau logat)
router.post('/tokens', async (req, res) => {
  const { token, platform } = req.body || {};
  if (!token || !String(token).startsWith('ExponentPushToken[')) {
    return res.status(400).json({ error: 'invalid_token' });
  }
  const me = optionalAuth(req);
  await prisma.pushToken.upsert({
    where: { token: String(token) },
    create: { token: String(token), platform: platform || null, userId: me?.id || null },
    update: { platform: platform || null, ...(me?.id ? { userId: me.id } : {}) }
  });
  res.json({ ok: true });
});

// DELETE /api/push/tokens — stergere token (body {token}) sau toate ale userului logat
router.delete('/tokens', async (req, res) => {
  const { token } = req.body || {};
  const me = optionalAuth(req);
  if (token) {
    const row = await prisma.pushToken.findUnique({ where: { token: String(token) } });
    if (row && (me?.id === row.userId || !row.userId)) {
      await prisma.pushToken.delete({ where: { token: String(token) } });
    }
  } else if (me?.id) {
    await prisma.pushToken.deleteMany({ where: { userId: me.id } });
  }
  res.json({ ok: true });
});

// POST /api/push/native-tokens { token, platform? } — token FCM aplicatie nativa (guest sau logat)
router.post('/native-tokens', async (req, res) => {
  const { token, platform } = req.body || {};
  const t = String(token || '');
  if (!t || t.length < 20 || t.startsWith('ExponentPushToken[')) {
    return res.status(400).json({ error: 'invalid_token' });
  }
  const me = optionalAuth(req);
  const plat = String(platform || 'fcm-android').slice(0, 32);
  await prisma.pushToken.upsert({
    where: { token: t },
    create: { token: t, platform: plat, userId: me?.id || null },
    update: { platform: plat, ...(me?.id ? { userId: me.id } : {}) }
  });
  res.json({ ok: true });
});

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// target: all | users | authors | admins | user (+ userId)
// roluri backend: USER (utilizatori), MODERATOR (autori), ADMIN (administratori)
async function resolveTokens(target, userId) {
  if (target === 'user' && userId) {
    return prisma.pushToken.findMany({ where: { userId: Number(userId) } });
  }
  if (target === 'users' || target === 'authors' || target === 'admins') {
    const role = target === 'users' ? 'USER' : target === 'authors' ? 'MODERATOR' : 'ADMIN';
    return prisma.pushToken.findMany({ where: { user: { role } } });
  }
  return prisma.pushToken.findMany();
}

async function sendExpoPush(messages) {
  const tickets = [];
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(chunk)
    });
    const data = await res.json().catch(() => ({}));
    if (Array.isArray(data.data)) tickets.push(...data.data);
    else tickets.push(...chunk.map(() => ({ status: 'error' })));
  }
  return tickets;
}

// ---- FCM HTTP v1 (aplicatia nativa; service account din setari ADMIN) ----
function b64urlStr(s) {
  return Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function fcmAccessToken() {
  const [email, keyRaw, project] = await Promise.all([
    getValue('FCM_CLIENT_EMAIL'), getValue('FCM_PRIVATE_KEY'), getValue('FCM_PROJECT_ID')
  ]);
  if (!email || !keyRaw || !project) {
    const e = new Error('fcm_not_configured');
    e.code = 'not_configured';
    throw e;
  }
  const key = String(keyRaw).replace(/\\n/g, '\n');
  const now = Math.floor(Date.now() / 1000);
  const header = b64urlStr(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64urlStr(JSON.stringify({
    iss: email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600
  }));
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${header}.${payload}`);
  signer.end();
  const sig = signer.sign(key, 'base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const assertion = `${header}.${payload}.${sig}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${encodeURIComponent(assertion)}`
  });
  const data = await res.json().catch(() => ({}));
  if (!data.access_token) throw new Error('fcm_auth_failed: ' + (data.error_description || data.error || 'unknown'));
  return { token: data.access_token, project };
}

// messages: [{ token, title, body, data? }] → [{ status, error?, dead? }]
async function sendFcmPush(messages) {
  const results = [];
  let creds = null;
  for (const m of messages) {
    try {
      if (!creds) creds = await fcmAccessToken();
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${creds.project}/messages:send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${creds.token}` },
        body: JSON.stringify({
          message: {
            token: m.token,
            notification: { title: String(m.title || '').slice(0, 120), body: String(m.body || '').slice(0, 180) },
            data: Object.fromEntries(Object.entries(m.data || {}).map(([k, v]) => [k, String(v)])),
            android: { priority: 'high' }
          }
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.name) { results.push({ status: 'ok' }); continue; }
      const st = data?.error?.status || '';
      results.push({ status: 'error', error: `${st || res.status}: ${(data?.error?.message || '').slice(0, 120)}`, dead: st === 'NOT_FOUND' || st === 'UNREGISTERED' });
    } catch (e) {
      if (e.code === 'not_configured') throw e;
      results.push({ status: 'error', error: 'network: ' + e.message });
    }
  }
  return results;
}

function isFcmRow(t) {
  return !String(t.token).startsWith('ExponentPushToken[') && /^fcm/i.test(t.platform || '');
}

// POST /api/push/send — ADMIN { title, body, target, userId? }
router.post('/send', authRequired, roleRequired('ADMIN'), async (req, res) => {
  const { title, body, target = 'all', userId } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: 'title_body_required' });
  if (!['all', 'users', 'authors', 'admins', 'user'].includes(target)) {
    return res.status(400).json({ error: 'invalid_target' });
  }
  const tokens = await resolveTokens(target, userId);
  const expoRows = tokens.filter(t => !isFcmRow(t));
  const fcmRows = tokens.filter(isFcmRow);
  const expoMessages = expoRows.map(t => ({ to: t.token, sound: 'default', title: String(title).slice(0, 120), body: String(body).slice(0, 180) }));
  const fcmMessages = fcmRows.map(t => ({ token: t.token, title: String(title).slice(0, 120), body: String(body).slice(0, 180), data: {} }));
  let sent = 0, failed = 0, cleaned = 0;
  const errors = [];
  const note = async (ok, code, rowToken) => {
    if (ok) { sent++; return; }
    failed++;
    if (errors.length < 5) errors.push({ token: String(rowToken).slice(0, 24) + '…', error: code });
  };
  if (expoMessages.length) {
    try {
      const tickets = await sendExpoPush(expoMessages);
      for (let i = 0; i < tickets.length; i++) {
        const tk = tickets[i] || {};
        if (tk.status === 'ok') { await note(true); continue; }
        const code = tk.details?.error || tk.message || 'unknown';
        await note(false, code, expoMessages[i].to);
        // tokenuri moarte (dezinstalări) se șterg automat
        if (code === 'DeviceNotRegistered') {
          try { await prisma.pushToken.delete({ where: { token: expoMessages[i].to } }); cleaned++; } catch {}
        }
      }
    } catch (e) {
      for (const m of expoMessages) await note(false, 'network: ' + e.message, m.to);
    }
  }
  if (fcmMessages.length) {
    try {
      const results = await sendFcmPush(fcmMessages);
      for (let i = 0; i < results.length; i++) {
        const r = results[i] || {};
        await note(r.status === 'ok', r.error || 'unknown', fcmMessages[i].token);
        if (r.status !== 'ok' && r.dead) {
          try { await prisma.pushToken.delete({ where: { token: fcmMessages[i].token } }); cleaned++; } catch {}
        }
      }
    } catch (e) {
      if (e.code === 'not_configured') {
        for (const m of fcmMessages) await note(false, 'fcm_not_configured', m.token);
      } else {
        for (const m of fcmMessages) await note(false, 'network: ' + e.message, m.token);
      }
    }
  }
  await prisma.pushLog.create({ data: { title: String(title).slice(0, 120), body: String(body).slice(0, 300), target, sent, failed } });
  res.json({ ok: true, sent, failed, cleaned, total: expoMessages.length + fcmMessages.length, errors });
});

// GET /api/push/history — ADMIN
router.get('/history', authRequired, roleRequired('ADMIN'), async (req, res) => {
  res.json(await prisma.pushLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }));
});

module.exports = router;
module.exports.resolveTokens = resolveTokens;
module.exports.sendExpoPush = sendExpoPush;
module.exports.sendFcmPush = sendFcmPush;
