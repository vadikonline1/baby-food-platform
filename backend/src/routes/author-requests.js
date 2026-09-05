const express = require('express');
const { prisma } = require('../lib/db');
const { authRequired, roleRequired } = require('../middleware/auth');
const { notify } = require('./notifications');

const router = express.Router();

// POST /api/author-requests — orice user logat (o singura cerere PENDING)
router.post('/', authRequired, async (req, res) => {
  const { motivation, experience } = req.body || {};
  if (!motivation || String(motivation).trim().length < 20) {
    return res.status(400).json({ error: 'motivation_min_20' });
  }
  if (!experience || String(experience).trim().length < 10) {
    return res.status(400).json({ error: 'experience_min_10' });
  }
  if (req.user.role !== 'USER') return res.status(400).json({ error: 'already_privileged' });
  const pending = await prisma.authorRequest.findFirst({ where: { userId: req.user.id, status: 'PENDING' } });
  if (pending) return res.status(409).json({ error: 'already_pending', request: pending });
  const r = await prisma.authorRequest.create({
    data: { userId: req.user.id, motivation: String(motivation).slice(0, 2000), experience: String(experience).slice(0, 2000) },
    include: { user: { select: { name: true, email: true } } }
  });
  await notify('author_request', `Cerere autor: ${r.user.name}`, `${r.user.email} dorește să publice rețete.`, '/admin?tab=authors');
  res.status(201).json(r);
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
