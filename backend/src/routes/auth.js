const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { z } = require('zod');
const { prisma } = require('../lib/db');
const { signToken, authRequired } = require('../middleware/auth');
const { sendVerifyEmail } = require('../lib/mail');

const router = express.Router();

const APP_URL = () => (process.env.APP_URL || 'http://localhost:4000').replace(/\/$/, '');

function makeToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function issueVerification(user) {
  const verifyToken = makeToken();
  const verifyExpires = new Date(Date.now() + 24 * 3600 * 1000);
  await prisma.user.update({ where: { id: user.id }, data: { verifyToken, verifyExpires } });
  const verifyUrl = `${APP_URL()}/verify?token=${verifyToken}`;
  return sendVerifyEmail(user.email, user.name, verifyUrl);
}

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  lang: z.enum(['ro', 'ru', 'en']).optional()
});

// contul se activeaza DOAR dupa confirmarea emailului
router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_data', details: parsed.error.issues });
  const { name, email, password, lang } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (!existing.emailVerified) {
      await issueVerification(existing);
      return res.status(200).json({ ok: true, pendingVerification: true });
    }
    return res.status(409).json({ error: 'email_taken' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, passwordHash, lang: lang || 'ro' } });
  await issueVerification(user);
  res.status(201).json({ ok: true, pendingVerification: true });
});

router.post('/verify', async (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: 'token_required' });
  const user = await prisma.user.findUnique({ where: { verifyToken: String(token) } });
  if (!user) return res.status(400).json({ error: 'invalid_token' });
  if (user.verifyExpires && user.verifyExpires < new Date()) return res.status(400).json({ error: 'token_expired' });
  await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true, verifyToken: null, verifyExpires: null } });
  const jwt = signToken(user);
  res.json({ ok: true, token: jwt, user: { id: user.id, name: user.name, email: user.email, role: user.role, lang: user.lang } });
});

router.post('/resend', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email_required' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.json({ ok: true }); // nu divulgam existenta
  if (user.emailVerified) return res.json({ ok: true, alreadyVerified: true });
  await issueVerification(user);
  res.json({ ok: true });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'missing_credentials' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'invalid_login' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid_login' });
  if (!user.emailVerified) return res.status(403).json({ error: 'email_not_verified' });
  const token = signToken(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, lang: user.lang } });
});

router.get('/me', authRequired, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, role: true, lang: true, avatarUrl: true, emailVerified: true, createdAt: true }
  });
  res.json(user);
});

// date profil (emailul NU se poate schimba)
router.patch('/me', authRequired, async (req, res) => {
  const { name, lang, avatarUrl } = req.body || {};
  if (req.body?.email) return res.status(400).json({ error: 'email_immutable' });
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(name ? { name: String(name).slice(0, 80) } : {}),
      ...(lang && ['ro', 'ru', 'en'].includes(lang) ? { lang } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl } : {})
    },
    select: { id: true, name: true, email: true, role: true, lang: true, avatarUrl: true }
  });
  res.json(user);
});

// schimbare parola (cu parola curenta)
router.patch('/me/password', authRequired, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: 'invalid_password_data' });
  }
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const ok = await bcrypt.compare(String(currentPassword), user.passwordHash);
  if (!ok) return res.status(400).json({ error: 'wrong_current_password' });
  const passwordHash = await bcrypt.hash(String(newPassword), 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  res.json({ ok: true });
});

module.exports = router;
