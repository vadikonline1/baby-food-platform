const express = require('express');
const { prisma } = require('../lib/db');
const { authRequired, roleRequired } = require('../middleware/auth');

const router = express.Router();

// Continut editabil: guide (Ghid diversificare) | faq (Intrebari frecvente) | cookies (Politica cookies)
const MODELS = {
  guide: () => prisma.guideItem,
  faq: () => prisma.faqItem,
  cookies: () => prisma.cookieSection
};
function modelOf(type, res) {
  const m = MODELS[type]?.();
  if (!m) { res.status(404).json({ error: 'unknown_type' }); return null; }
  return m;
}

// PUBLIC: elemente active, ordonate (pentru site + apps mobile)
router.get('/:type', async (req, res) => {
  const m = modelOf(req.params.type, res);
  if (!m) return;
  res.json(await m.findMany({ where: { active: true }, orderBy: [{ position: 'asc' }, { id: 'asc' }] }));
});

// ADMIN: toate (inclusiv inactive)
router.get('/:type/all', authRequired, roleRequired('ADMIN'), async (req, res) => {
  const m = modelOf(req.params.type, res);
  if (!m) return;
  res.json(await m.findMany({ orderBy: [{ position: 'asc' }, { id: 'asc' }] }));
});

router.post('/:type', authRequired, roleRequired('ADMIN'), async (req, res) => {
  const m = modelOf(req.params.type, res);
  if (!m) return;
  try {
    const d = { ...req.body };
    if (d.position !== undefined) d.position = Number(d.position) || 0;
    res.status(201).json(await m.create({ data: d }));
  } catch (e) { res.status(400).json({ error: 'create_failed', message: e.message }); }
});

router.put('/:type/:id', authRequired, roleRequired('ADMIN'), async (req, res) => {
  const m = modelOf(req.params.type, res);
  if (!m) return;
  try {
    const d = { ...req.body };
    delete d.id;
    if (d.position !== undefined) d.position = Number(d.position) || 0;
    res.json(await m.update({ where: { id: Number(req.params.id) }, data: d }));
  } catch (e) { res.status(400).json({ error: 'update_failed', message: e.message }); }
});

router.delete('/:type/:id', authRequired, roleRequired('ADMIN'), async (req, res) => {
  const m = modelOf(req.params.type, res);
  if (!m) return;
  await m.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

module.exports = router;
