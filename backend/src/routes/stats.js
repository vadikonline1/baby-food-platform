const express = require('express');
const { prisma } = require('../lib/db');
const router = express.Router();

// statistici publice pentru homepage (fara auth)
router.get('/', async (req, res) => {
  const [recipes, categories, ratings] = await Promise.all([
    prisma.recipe.count({ where: { status: 'PUBLISHED' } }),
    prisma.menuCategory.count(),
    prisma.rating.count()
  ]);
  res.json({ recipes, categories, ratings });
});

module.exports = router;
