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

// GET /api/author-requests/quiz?lang=ro — 5 intrebari random din banca (fara raspunsuri corecte)
router.get('/quiz', authRequired, async (req, res) => {
  const lang = ['ro', 'ru', 'en'].includes(req.query.lang) ? req.query.lang : 'ro';
  const L = lang === 'ru' ? 1 : lang === 'en' ? 2 : 0;
  const id = crypto.randomBytes(16).toString('hex');
  const dbRows = await prisma.quizQuestion.findMany({ where: { active: true }, orderBy: { position: 'asc' } });
  let questions, answerMap;
  if (dbRows.length >= 5) {
    const picked = [...dbRows].sort(() => Math.random() - 0.5).slice(0, 5);
    questions = picked.map((r) => {
      let opts = [];
      try { opts = JSON.parse(r.options || '[]'); } catch {}
      return { qid: r.id, q: [r.qRo, r.qRu, r.qEn][L], options: (opts.length ? opts : [['—'], ['—'], ['—']]).map((o) => o[L] || o[0]) };
    });
    answerMap = Object.fromEntries(picked.map((r) => [r.id, r.correct]));
  } else {
    // fallback: banca statica (5 intrebari)
    const { questions: qs, correct } = pickQuiz(lang);
    questions = qs;
    answerMap = Object.fromEntries(qs.map((q, i) => [q.qid, correct[i]]));
  }
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
  let quizTotal = 0, quizCorrect = 0;
  const quizLog = [];
  const ch = challenges.get(String(quizId || ''));
  if (ch) {
    challenges.delete(String(quizId));
    const entries = Object.entries(ch.map || {});
    if (ch.exp >= Date.now() && entries.length > 0) {
      quizTotal = entries.length;
      for (const [qid, c] of entries) {
        const picked = Number(answers?.[qid]);
        const ok = picked === c;
        if (ok) quizCorrect++;
        quizLog.push({ qid: Number(qid), picked: Number.isFinite(picked) ? picked : null, correct: c });
      }
      autoApproved = quizCorrect === quizTotal;
    }
  }
  const r = await prisma.authorRequest.create({
    data: {
      userId: req.user.id,
      motivation: String(motivation).slice(0, 2000),
      experience: String(experience).slice(0, 2000),
      status: autoApproved ? 'APPROVED' : 'PENDING',
      quizTotal, quizCorrect,
      quizAnswers: JSON.stringify(quizLog).slice(0, 2000)
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

// GET /api/author-requests/quiz-bank — ADMIN (banca completa, cu raspunsuri corecte)
router.get('/quiz-bank', authRequired, roleRequired('ADMIN'), async (req, res) => {
  const rows = await prisma.quizQuestion.findMany({ orderBy: [{ position: 'asc' }, { id: 'asc' }] });
  if (rows.length) {
    return res.json(rows.map((r) => {
      let opts = [];
      try { opts = JSON.parse(r.options || '[]'); } catch {}
      return { qid: r.id, q: [r.qRo, r.qRu, r.qEn], o: opts, c: r.correct };
    }));
  }
  const { QUIZ } = require('../lib/quiz');
  res.json(QUIZ.map((q, i) => ({ qid: i, q: q.q, o: q.o, c: q.c })));
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
