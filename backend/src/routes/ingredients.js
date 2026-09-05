const express = require('express');
const { prisma } = require('../lib/db');
const { authRequired, roleRequired } = require('../middleware/auth');

const router = express.Router();

function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').slice(0, 60) || ('produs-' + Date.now());
}

// catalog produse — public la citire (folosit in formularul de reteta)
router.get('/', async (req, res) => {
  const { q, limit = '100' } = req.query;
  const where = q ? { OR: [{ nameRo: { contains: q } }, { nameRu: { contains: q } }, { nameEn: { contains: q } }] } : {};
  res.json(await prisma.ingredient.findMany({ where, orderBy: { nameRo: 'asc' }, take: Math.min(Number(limit) || 100, 300) }));
});

router.post('/', authRequired, roleRequired('MODERATOR', 'ADMIN'), async (req, res) => {
  const { nameRo, nameRu, nameEn } = req.body || {};
  if (!nameRo) return res.status(400).json({ error: 'nameRo_required' });
  try {
    res.status(201).json(await prisma.ingredient.create({
      data: { slug: slugify(nameRo) + '-' + Date.now().toString(36), nameRo, nameRu: nameRu || nameRo, nameEn: nameEn || nameRo }
    }));
  } catch (e) { res.status(400).json({ error: 'create_failed', message: e.message }); }
});

router.put('/:id', authRequired, roleRequired('ADMIN'), async (req, res) => {
  try {
    res.json(await prisma.ingredient.update({ where: { id: Number(req.params.id) }, data: req.body }));
  } catch (e) { res.status(400).json({ error: 'update_failed', message: e.message }); }
});

router.delete('/:id', authRequired, roleRequired('ADMIN'), async (req, res) => {
  try {
    await prisma.ingredient.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: 'delete_failed', message: e.message }); }
});

module.exports = router;
