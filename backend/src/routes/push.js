const express = require('express');
const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/db');
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

// POST /api/push/send — ADMIN { title, body, target, userId? }
router.post('/send', authRequired, roleRequired('ADMIN'), async (req, res) => {
  const { title, body, target = 'all', userId } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: 'title_body_required' });
  if (!['all', 'users', 'authors', 'admins', 'user'].includes(target)) {
    return res.status(400).json({ error: 'invalid_target' });
  }
  const tokens = await resolveTokens(target, userId);
  const messages = tokens.map(t => ({ to: t.token, sound: 'default', title: String(title).slice(0, 120), body: String(body).slice(0, 180) }));
  let sent = 0, failed = 0;
  if (messages.length) {
    try {
      const tickets = await sendExpoPush(messages);
      for (const t of tickets) (t.status === 'ok' ? sent++ : failed++);
    } catch (e) {
      failed = messages.length;
    }
  }
  await prisma.pushLog.create({ data: { title: String(title).slice(0, 120), body: String(body).slice(0, 300), target, sent, failed } });
  res.json({ ok: true, sent, failed, total: messages.length });
});

// GET /api/push/history — ADMIN
router.get('/history', authRequired, roleRequired('ADMIN'), async (req, res) => {
  res.json(await prisma.pushLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }));
});

module.exports = router;
