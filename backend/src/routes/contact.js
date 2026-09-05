const express = require('express');
const crypto = require('crypto');
const { prisma } = require('../lib/db');
const { authRequired, roleRequired } = require('../middleware/auth');
const { notify } = require('./notifications');

const router = express.Router();

// captcha matematica simpla, server-side (fara servicii externe): id -> raspuns, expira 10 min
const captchas = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of captchas) if (v.exp < now) captchas.delete(k);
}, 60000).unref?.();

// GET /api/contact/captcha -> { id, q: "3 + 5 = ?" }
router.get('/captcha', (req, res) => {
  const a = 1 + Math.floor(Math.random() * 9);
  const b = 1 + Math.floor(Math.random() * 9);
  const id = crypto.randomBytes(16).toString('hex');
  captchas.set(id, { ans: a + b, exp: Date.now() + 10 * 60 * 1000 });
  res.json({ id, q: `${a} + ${b} = ?` });
});

// POST /api/contact { name, email, message, captchaId, captcha }
router.post('/', async (req, res) => {
  const { name, email, message, captchaId, captcha } = req.body || {};
  if (!name || String(name).trim().length < 2) return res.status(400).json({ error: 'invalid_name' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) return res.status(400).json({ error: 'invalid_email' });
  if (!message || String(message).trim().length < 10) return res.status(400).json({ error: 'message_min_10' });
  const c = captchas.get(String(captchaId));
  captchas.delete(String(captchaId));
  if (!c || c.exp < Date.now() || Number(captcha) !== c.ans) {
    return res.status(400).json({ error: 'wrong_captcha' });
  }
  const m = await prisma.contactMessage.create({
    data: { name: String(name).slice(0, 80), email: String(email).slice(0, 120), message: String(message).slice(0, 3000) }
  });
  await notify('contact', `Mesaj contact: ${m.name}`, `${m.email} — ${m.message.slice(0, 120)}`, '/admin?tab=messages');
  res.status(201).json({ ok: true });
});

// GET /api/contact/messages — ADMIN
router.get('/messages', authRequired, roleRequired('ADMIN'), async (req, res) => {
  res.json(await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }));
});

// PATCH /api/contact/messages/:id/read — ADMIN
router.patch('/messages/:id/read', authRequired, roleRequired('ADMIN'), async (req, res) => {
  await prisma.contactMessage.update({ where: { id: Number(req.params.id) }, data: { read: true } });
  res.json({ ok: true });
});

module.exports = router;
