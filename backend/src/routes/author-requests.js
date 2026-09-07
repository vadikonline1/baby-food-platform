const express = require('express');
const crypto = require('crypto');
const { prisma } = require('../lib/db');
const { authRequired, roleRequired } = require('../middleware/auth');
const { notify } = require('./notifications');
const { pickQuiz } = require('../lib/quiz');

const router = express.Router();

// provocari quiz active: id -> { correct:[...], exp }
const challenges = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of challenges) if (v.exp < now) challenges.delete(k);
}, 60000).unref?.();

// GET /api/author-requests/quiz?lang=ro — 3 intrebari random (fara raspunsuri corecte)
router.get('/quiz', authRequired, (req, res) => {
  const lang = ['ro', 'ru', 'en'].includes(req.query.lang) ? req.query.lang : 'ro';
  const id = crypto.randomBytes(16).toString('hex');
  const { questions, correct } = pickQuiz(lang);
  const answerMap = Object.fromEntries(questions.map((q, i) => [q.qid, correct[i]]));
  challenges.set(id, { map: answerMap, exp: Date.now() + 15 * 60 * 1000 });
  res.json({ id, questions });
});

// POST /api/author-requests — orice user logat (o singura cerere PENDING)
// cu quiz corect din prima -> aprobare automata (rol MODERATOR pe loc)
router.post('/', authRequired, async (req, res) => {
  const { motivation, experience, quizId, answers } = req.body || {};
  const fail = (code, extra) => {
    console.log(`[author-request] 400 ${code} (user=${req.user.id} role=${req.user.role} ${extra || ''})`);
    return res.status(400).json({ error: code });
  };
  if (!motivation || String(motivation).trim().length < 20) {
    return fail('motivation_min_20', `len=${String(motivation || '').trim().length}`);
  }
  if (!experience || String(experience).trim().length < 10) {
    return fail('experience_min_10', `len=${String(experience || '').trim().length}`);
  }
  if (req.user.role !== 'USER') return fail('already_privileged', `role=${req.user.role}`);
  const pending = await prisma.authorRequest.findFirst({ where: { userId: req.user.id, status: 'PENDING' } });
  if (pending) return res.status(409).json({ error: 'already_pending', request: pending });

  // verificare quiz (optional dar incurajat): 3/3 corect -> aprobare automata
  let autoApproved = false;
  const ch = challenges.get(String(quizId || ''));
  if (ch) {
    challenges.delete(String(quizId));
    const entries = Object.entries(ch.map || {});
    if (ch.exp >= Date.now() && entries.length === 3 && entries.every(([qid, c]) => Number(answers?.[qid]) === c)) {
      autoApproved = true;
    }
  }
  const r = await prisma.authorRequest.create({
    data: {
      userId: req.user.id,
      motivation: String(motivation).slice(0, 2000),
      experience: String(experience).slice(0, 2000),
      status: autoApproved ? 'APPROVED' : 'PENDING'
    },
    include: { user: { select: { name: true, email: true } } }
  });
  if (autoApproved) {
    await prisma.user.update({ where: { id: req.user.id }, data: { role: 'MODERATOR' } });
  } else {
    await notify('author_request', `Cerere autor: ${r.user.name}`, `${r.user.email} dorește să publice rețete.`, '/admin?tab=authors');
  }
  res.status(201).json({ ...r, autoApproved });
});

// GET /api/author-requests/mine — cererea mea
router.get('/mine', authRequired, async (req, res) => {
  const r = await prisma.authorRequest.findFirst({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
  res.json(r);
});

// GET /api/author-requests — ADMIN (toate, pending primele)
router.get('/', authRequired, roleRequired('ADMIN'), async (req, res) => {
  const { status } = req.query;
  const where = status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status) ? { status } : {};
  res.json(await prisma.authorRequest.findMany({
    where, orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: { user: { select: { id: true, name: true, email: true, role: true } } }
  }));
});

// PATCH /api/author-requests/:id — ADMIN (APPROVED => user devine MODERATOR/Autor)
router.patch('/:id', authRequired, roleRequired('ADMIN'), async (req, res) => {
  const { status } = req.body || {};
  if (!['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ error: 'invalid_status' });
  const r = await prisma.authorRequest.update({ where: { id: Number(req.params.id) }, data: { status } });
  if (status === 'APPROVED') {
    await prisma.user.update({ where: { id: r.userId }, data: { role: 'MODERATOR' } });
  }
  res.json(r);
});

module.exports = router;
