const express = require('express');
const crypto = require('crypto');
const { prisma } = require('../lib/db');
const { authRequired, roleRequired } = require('../middleware/auth');

const router = express.Router();

async function notify(type, title, body, link) {
  try {
    await prisma.adminNotification.create({ data: { type, title, body: body || null, link: link || null } });
  } catch (e) { console.error('[notify]', e.message); }
}

// GET /api/notifications?unread=1 — ADMIN
router.get('/', authRequired, roleRequired('ADMIN'), async (req, res) => {
  const { unread, limit = '20' } = req.query;
  const where = unread === '1' ? { read: false } : {};
  const [count, items] = await Promise.all([
    prisma.adminNotification.count({ where: { read: false } }),
    prisma.adminNotification.findMany({ where, orderBy: { createdAt: 'desc' }, take: Math.min(Number(limit) || 20, 50) })
  ]);
  res.json({ count, items });
});

// PATCH /api/notifications/read-all — ADMIN
router.patch('/read-all', authRequired, roleRequired('ADMIN'), async (req, res) => {
  await prisma.adminNotification.updateMany({ where: { read: false }, data: { read: true } });
  res.json({ ok: true });
});

// PATCH /api/notifications/:id/read — ADMIN
router.patch('/:id/read', authRequired, roleRequired('ADMIN'), async (req, res) => {
  await prisma.adminNotification.update({ where: { id: Number(req.params.id) }, data: { read: true } });
  res.json({ ok: true });
});

module.exports = router;
module.exports.notify = notify;
