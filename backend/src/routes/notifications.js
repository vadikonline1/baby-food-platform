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

// notificare catre un utilizator: email (din profil, daca SMTP e configurat)
// + Telegram DM (daca botul e configurat si userul are chat_id in profil)
async function notifyUser(userId, subject, html, tgText) {
  try {
    const u = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!u) return;
    const { sendMail } = require('../lib/mail');
    await sendMail(u.email, subject, html).catch((e) => console.error('[notify] mail:', e.message));
    if (u.telegramChatId) {
      const { sendDirect } = require('../lib/telegram');
      await sendDirect(u.telegramChatId, tgText || subject).catch(() => {});
    }
  } catch (e) { console.error('[notify] user:', e.message); }
}

// notificare catre toti ADMINII (email din profil + Telegram DM din profil)
async function notifyAdmins(subject, html, tgText) {
  try {
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const a of admins) {
      // eslint-disable-next-line no-await-in-loop
      await notifyUser(a.id, subject, html, tgText);
    }
  } catch (e) { console.error('[notify] admins:', e.message); }
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
module.exports.notifyUser = notifyUser;
module.exports.notifyAdmins = notifyAdmins;
