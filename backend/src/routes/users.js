const express = require('express');
const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/db');
const { authRequired, roleRequired } = require('../middleware/auth');
const router = express.Router();

// ADMIN: users list + role change + delete
router.get('/', authRequired, roleRequired('ADMIN'), async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, role: true, lang: true, emailVerified: true, createdAt: true }
  });
  res.json(users);
});

router.patch('/:id/role', authRequired, roleRequired('ADMIN'), async (req, res) => {
  const { role } = req.body || {};
  if (!['USER', 'MODERATOR', 'ADMIN'].includes(role)) return res.status(400).json({ error: 'invalid_role' });
  const user = await prisma.user.update({ where: { id: Number(req.params.id) }, data: { role }, select: { id: true, name: true, email: true, role: true } });
  res.json(user);
});

router.delete('/:id', authRequired, roleRequired('ADMIN'), async (req, res) => {
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'cannot_delete_self' });
  await prisma.user.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

// DASHBOARD: statistici extinse (ADMIN tot; MODERATOR doar propriile retete)
router.get('/stats/overview', authRequired, roleRequired('MODERATOR', 'ADMIN'), async (req, res) => {
  const isMod = req.user.role === 'MODERATOR';
  const scope = isMod ? { authorId: req.user.id } : {};
  const [users, recipes, published, drafts, ratings, byRole, topRecipes, recent, pendingList] = await Promise.all([
    isMod ? 0 : prisma.user.count(),
    prisma.recipe.count({ where: scope }),
    prisma.recipe.count({ where: { ...scope, status: 'PUBLISHED' } }),
    prisma.recipe.count({ where: { ...scope, status: 'DRAFT' } }),
    isMod
      ? prisma.rating.count({ where: { recipe: { authorId: req.user.id } } })
      : prisma.rating.count(),
    isMod ? [] : prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
    prisma.recipe.findMany({
      where: { ...scope, status: 'PUBLISHED' }, orderBy: [{ ratingsCount: 'desc' }, { avgRating: 'desc' }], take: 5,
      select: { id: true, slug: true, titleRo: true, avgRating: true, ratingsCount: true }
    }),
    prisma.recipe.findMany({
      where: scope, orderBy: { createdAt: 'desc' }, take: 5,
      select: { id: true, slug: true, titleRo: true, status: true, createdAt: true, author: { select: { name: true } } }
    }),
    prisma.recipe.findMany({
      where: { ...scope, status: 'DRAFT' }, orderBy: { createdAt: 'asc' }, take: 5,
      select: { id: true, slug: true, titleRo: true, createdAt: true, author: { select: { name: true } } }
    })
  ]);
  res.json({ users, recipes, published, drafts, ratings, byRole, topRecipes, recent, pendingList });
});

// logged user: my favorites
router.get('/me/favorites', authRequired, async (req, res) => {
  const favs = await prisma.favorite.findMany({
    where: { userId: req.user.id },
    include: { recipe: { include: { ageGroups: { include: { ageGroup: true } }, feedingType: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(favs.map(f => f.recipe));
});

module.exports = router;
