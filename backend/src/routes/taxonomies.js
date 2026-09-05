const express = require('express');
const { prisma } = require('../lib/db');
const { authRequired, roleRequired } = require('../middleware/auth');
const router = express.Router();

// Public list for filters (?withCounts=1 adauga nr retete publicate la categorii)
router.get('/categories', async (req, res) => {
  if (req.query.withCounts === '1') {
    return res.json(await prisma.menuCategory.findMany({
      orderBy: { nameRo: 'asc' },
      include: { _count: { select: { recipes: { where: { recipe: { status: 'PUBLISHED' } } } } } }
    }));
  }
  res.json(await prisma.menuCategory.findMany({ orderBy: { nameRo: 'asc' } }));
});
router.get('/restrictions', async (req, res) => res.json(await prisma.dietaryRestriction.findMany({ orderBy: { nameRo: 'asc' } })));
router.get('/characteristics', async (req, res) => res.json(await prisma.characteristic.findMany({ orderBy: { nameRo: 'asc' } })));
router.get('/ages', async (req, res) => res.json(await prisma.ageGroup.findMany({ orderBy: { minMonths: 'asc' } })));
router.get('/feeding-types', async (req, res) => res.json(await prisma.feedingType.findMany({ orderBy: { nameRo: 'asc' } })));
router.get('/units', async (req, res) => res.json(await prisma.unit.findMany({ orderBy: { nameRo: 'asc' } })));

// CRUD taxonomii — DOAR ADMIN (moderatorii gestioneaza doar retetele proprii)
const resources = {
  categories: () => prisma.menuCategory,
  restrictions: () => prisma.dietaryRestriction,
  characteristics: () => prisma.characteristic,
  ages: () => prisma.ageGroup,
  'feeding-types': () => prisma.feedingType,
  units: () => prisma.unit
};

router.post('/:resource', authRequired, roleRequired('MODERATOR', 'ADMIN'), async (req, res) => {
  const m = resources[req.params.resource]?.();
  if (!m) return res.status(404).json({ error: 'unknown_resource' });
  try {
    res.status(201).json(await m.create({ data: req.body }));
  } catch (e) { res.status(400).json({ error: 'create_failed', message: e.message }); }
});

router.put('/:resource/:id', authRequired, roleRequired('ADMIN'), async (req, res) => {
  const m = resources[req.params.resource]?.();
  if (!m) return res.status(404).json({ error: 'unknown_resource' });
  try {
    res.json(await m.update({ where: { id: Number(req.params.id) }, data: req.body }));
  } catch (e) { res.status(400).json({ error: 'update_failed', message: e.message }); }
});

router.delete('/:resource/:id', authRequired, roleRequired('ADMIN'), async (req, res) => {
  const m = resources[req.params.resource]?.();
  if (!m) return res.status(404).json({ error: 'unknown_resource' });
  await m.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

module.exports = router;
