const express = require('express');
const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/db');
const { authRequired, roleRequired } = require('../middleware/auth');
const { postRecipe, postRecipeAsync, configured: tgConfigured } = require('../lib/telegram');

const router = express.Router();

function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').slice(0, 80) || ('reteta-' + Date.now());
}

// auth optional din header (pentru DRAFT / votul si favoritul meu)
function optionalAuth(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET || 'gustbebe-dev-secret-change-me');
    return { id: p.id, role: p.role };
  } catch { return null; }
}
function optionalRole(req) {
  return optionalAuth(req)?.role || null;
}

const recipeInclude = {
  feedingType: true,
  ageGroups: { include: { ageGroup: true } },
  categories: { include: { category: true } },
  restrictions: { include: { restriction: true } },
  characteristics: { include: { characteristic: true } },
  ingredientsDetailed: { include: { ingredient: true }, orderBy: { position: 'asc' } },
  author: { select: { id: true, name: true } }
};

function asText(v) {
  if (Array.isArray(v)) return v.map(s => String(s || '').trim()).filter(Boolean).join('\n');
  return v;
}

function numList(v) {
  if (!v) return [];
  return [...new Set(String(v).split(',').map(Number).filter(n => Number.isFinite(n)))];
}

// GET /api/recipes?q=&category=&age=&feeding=&restriction=&status=&sort=&page=&limit=
// category/restriction accepta slug sau lista slug-uri separate prin virgula; age/feeding id-uri
router.get('/', async (req, res) => {
  const { q, category, age, feeding, restriction, status, sort, page = '1', limit = '12' } = req.query;
  const take = Math.min(parseInt(limit) || 12, 50);
  const skip = (Math.max(parseInt(page) || 1, 1) - 1) * take;

  const where = {};
  const role = optionalRole(req);
  const privileged = role === 'MODERATOR' || role === 'ADMIN';
  if (privileged && status === 'all') {
    // fara filtru de status
  } else if (privileged && (status === 'DRAFT' || status === 'PUBLISHED')) {
    where.status = status;
  } else {
    where.status = 'PUBLISHED'; // public + default
  }
  if (q) {
    where.OR = [
      { titleRo: { contains: q } }, { titleRu: { contains: q } }, { titleEn: { contains: q } },
      { ingredientsRo: { contains: q } }
    ];
  }
  const ageIds = numList(age);
  if (ageIds.length) where.ageGroups = { some: { ageGroupId: ageIds.length === 1 ? ageIds[0] : { in: ageIds } } };
  const feedIds = numList(feeding);
  if (feedIds.length) where.feedingTypeId = feedIds.length === 1 ? feedIds[0] : { in: feedIds };
  if (category) {
    const slugs = String(category).split(',').map(s => s.trim()).filter(Boolean);
    if (slugs.length) where.categories = { some: { category: { slug: slugs.length === 1 ? slugs[0] : { in: slugs } } } };
  }
  if (restriction) {
    const slugs = String(restriction).split(',').map(s => s.trim()).filter(Boolean);
    if (slugs.length) where.restrictions = { some: { restriction: { slug: slugs.length === 1 ? slugs[0] : { in: slugs } } } };
  }

  const orderBy = sort === 'popular'
    ? [{ ratingsCount: 'desc' }, { avgRating: 'desc' }, { createdAt: 'desc' }]
    : [{ createdAt: 'desc' }];
  const [total, items] = await Promise.all([
    prisma.recipe.count({ where }),
    prisma.recipe.findMany({ where, include: recipeInclude, orderBy, take, skip })
  ]);
  res.json({ total, page: Number(page) || 1, limit: take, items });
});

// GET by id pentru editare — MOD+ (inainte de /:slug ca sa nu fie capturat)
router.get('/by-id/:id', authRequired, roleRequired('MODERATOR', 'ADMIN'), async (req, res) => {
  const recipe = await prisma.recipe.findUnique({ where: { id: Number(req.params.id) }, include: recipeInclude });
  if (!recipe) return res.status(404).json({ error: 'not_found' });
  res.json(recipe);
});

// GET public dupa slug de forma "id-titlu" (ex: /retete/12-piure-de-morcov) sau slug clasic
router.get('/:slug', async (req, res) => {
  let recipe = null;
  const m = /^(\d+)-/.exec(req.params.slug);
  if (m) recipe = await prisma.recipe.findUnique({ where: { id: Number(m[1]) }, include: recipeInclude });
  if (!recipe) recipe = await prisma.recipe.findUnique({ where: { slug: req.params.slug }, include: recipeInclude });
  if (!recipe) return res.status(404).json({ error: 'not_found' });
  if (recipe.status !== 'PUBLISHED') {
    const role = optionalRole(req);
    if (role !== 'MODERATOR' && role !== 'ADMIN') return res.status(404).json({ error: 'not_found' });
  }
  // context personal (votul si favoritul meu) cand sunt logat
  const me = optionalAuth(req);
  if (me) {
    const [mine, fav] = await Promise.all([
      prisma.rating.findUnique({ where: { userId_recipeId: { userId: me.id, recipeId: recipe.id } } }),
      prisma.favorite.findUnique({ where: { userId_recipeId: { userId: me.id, recipeId: recipe.id } } })
    ]);
    recipe.myRating = mine?.value || 0;
    recipe.isFavorite = Boolean(fav);
  } else {
    recipe.myRating = 0;
    recipe.isFavorite = false;
  }
  res.json(recipe);
});

// rezolva items structurate -> { links, textRo, textRu, textEn }
async function resolveIngredientItems(items) {
  const links = [];
  const linesRo = [], linesRu = [], linesEn = [];
  let pos = 0;
  for (const it of items || []) {
    let ing = null;
    if (it.ingredientId) {
      ing = await prisma.ingredient.findUnique({ where: { id: Number(it.ingredientId) } });
      if (!ing) continue;
    } else if (it.nameRo) {
      const slug = slugify(it.nameRo) + '-' + Date.now().toString(36) + pos;
      ing = await prisma.ingredient.create({
        data: { slug, nameRo: it.nameRo, nameRu: it.nameRu || it.nameRo, nameEn: it.nameEn || it.nameRo }
      });
    } else continue;
    const qty = it.quantity !== undefined && it.quantity !== '' && it.quantity !== null ? Number(it.quantity) : null;
    links.push({
      ingredientId: ing.id,
      quantity: Number.isFinite(qty) ? qty : null,
      unit: it.unit || null,
      noteRo: it.noteRo || null, noteRu: it.noteRu || it.noteRo || null, noteEn: it.noteEn || it.noteRo || null,
      position: pos++
    });
    const q = (Number.isFinite(qty) ? qty + ' ' : '') + (it.unit || '');
    linesRo.push(`${ing.nameRo}${q ? ' — ' + q.trim() : ''}${it.noteRo ? ' (' + it.noteRo + ')' : ''}`);
    linesRu.push(`${ing.nameRu}${q ? ' — ' + q.trim() : ''}${it.noteRu || it.noteRo ? ' (' + (it.noteRu || it.noteRo) + ')' : ''}`);
    linesEn.push(`${ing.nameEn}${q ? ' — ' + q.trim() : ''}${it.noteEn || it.noteRo ? ' (' + (it.noteEn || it.noteRo) + ')' : ''}`);
  }
  return { links, textRo: linesRo.join('\n'), textRu: linesRu.join('\n'), textEn: linesEn.join('\n') };
}

// create — MODERATOR + ADMIN
// regula de validare: ADMIN publica direct; MODERATOR cu >=10 retete PUBLISHED publica direct,
// altfel reteta intra ca DRAFT (asteapta validarea adminului)
router.post('/', authRequired, roleRequired('MODERATOR', 'ADMIN'), async (req, res) => {
  const b = req.body || {};
  const stepsRo = asText(b.stepsRo);
  if (!b.titleRo || !stepsRo) return res.status(400).json({ error: 'titleRo_stepsRo_required' });
  const structured = Array.isArray(b.items) && b.items.length > 0;
  if (!structured && !b.ingredientsRo) return res.status(400).json({ error: 'ingredients_required' });

  let status = 'PUBLISHED';
  if (req.user.role === 'MODERATOR') {
    const approved = await prisma.recipe.count({ where: { authorId: req.user.id, status: 'PUBLISHED' } });
    status = approved >= 10 ? 'PUBLISHED' : 'DRAFT';
  } else if (b.status === 'DRAFT') {
    status = 'DRAFT';
  }

  const slug = b.slug ? slugify(b.slug) : slugify(b.titleRo) + '-' + Date.now().toString(36);
  try {
    let ingLinks = [];
    let ingredientsRo = asText(b.ingredientsRo) || '', ingredientsRu = asText(b.ingredientsRu) || '', ingredientsEn = asText(b.ingredientsEn) || '';
    if (structured) {
      const r = await resolveIngredientItems(b.items);
      ingLinks = r.links;
      ingredientsRo = r.textRo; ingredientsRu = r.textRu; ingredientsEn = r.textEn;
    }
    const uniqCats = [...new Set((b.categoryIds || []).map(Number))];
    const uniqRestr = [...new Set((b.restrictionIds || []).map(Number))];
    const uniqChars = [...new Set((b.characteristicIds || []).map(Number))];
    const uniqAges = [...new Set((b.ageGroupIds || (b.ageGroupId ? [b.ageGroupId] : [])).map(Number))];
    const recipe = await prisma.recipe.create({
      data: {
        slug,
        titleRo: b.titleRo, titleRu: b.titleRu || b.titleRo, titleEn: b.titleEn || b.titleRo,
        summaryRo: b.summaryRo || null, summaryRu: b.summaryRu || null, summaryEn: b.summaryEn || null,
        ingredientsRo, ingredientsRu: ingredientsRu || ingredientsRo, ingredientsEn: ingredientsEn || ingredientsRo,
        stepsRo, stepsRu: asText(b.stepsRu) || stepsRo, stepsEn: asText(b.stepsEn) || stepsRo,
        prepMinutes: Number(b.prepMinutes) || 15, cookMinutes: Number(b.cookMinutes) || 15,
        servings: Number(b.servings) || 2, difficulty: b.difficulty || 'usor',
        imageUrl: b.imageUrl || null, status,
        authorId: req.user.id,
        feedingTypeId: b.feedingTypeId ? Number(b.feedingTypeId) : null,
        categories: uniqCats.length ? { create: uniqCats.map(categoryId => ({ categoryId })) } : undefined,
        restrictions: uniqRestr.length ? { create: uniqRestr.map(restrictionId => ({ restrictionId })) } : undefined,
        characteristics: uniqChars.length ? { create: uniqChars.map(characteristicId => ({ characteristicId })) } : undefined,
        ageGroups: uniqAges.length ? { create: uniqAges.map(ageGroupId => ({ ageGroupId })) } : undefined,
        ingredientsDetailed: ingLinks.length ? { create: ingLinks } : undefined
      },
      include: recipeInclude
    });
    if (recipe.status === 'PUBLISHED') postRecipeAsync(recipe);
    res.status(201).json(recipe);
  } catch (e) {
    res.status(400).json({ error: 'create_failed', message: e.message });
  }
});

// update — MODERATOR + ADMIN
router.put('/:id', authRequired, roleRequired('MODERATOR', 'ADMIN'), async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  try {
    // reset relatii daca vin ids (deduplicare in JS — SQLite nu suporta skipDuplicates)
    if (b.categoryIds) {
      await prisma.recipeCategory.deleteMany({ where: { recipeId: id } });
      const uniq = [...new Set(b.categoryIds.map(Number))];
      if (uniq.length) await prisma.recipeCategory.createMany({ data: uniq.map(categoryId => ({ recipeId: id, categoryId })) });
    }
    if (b.restrictionIds) {
      await prisma.recipeRestriction.deleteMany({ where: { recipeId: id } });
      const uniq = [...new Set(b.restrictionIds.map(Number))];
      if (uniq.length) await prisma.recipeRestriction.createMany({ data: uniq.map(restrictionId => ({ recipeId: id, restrictionId })) });
    }
    if (b.characteristicIds) {
      await prisma.recipeCharacteristic.deleteMany({ where: { recipeId: id } });
      const uniq = [...new Set(b.characteristicIds.map(Number))];
      if (uniq.length) await prisma.recipeCharacteristic.createMany({ data: uniq.map(characteristicId => ({ recipeId: id, characteristicId })) });
    }
    if (b.ageGroupIds || b.ageGroupId) {
      await prisma.recipeAge.deleteMany({ where: { recipeId: id } });
      const uniq = [...new Set((b.ageGroupIds || [b.ageGroupId]).map(Number))];
      if (uniq.length) await prisma.recipeAge.createMany({ data: uniq.map(ageGroupId => ({ recipeId: id, ageGroupId })) });
    }
    if (Array.isArray(b.items)) {
      await prisma.recipeIngredient.deleteMany({ where: { recipeId: id } });
      const r = await resolveIngredientItems(b.items);
      if (r.links.length) await prisma.recipeIngredient.createMany({ data: r.links.map(l => ({ ...l, recipeId: id })) });
      b.ingredientsRo = r.textRo; b.ingredientsRu = r.textRu; b.ingredientsEn = r.textEn;
    }
    const { categoryIds, restrictionIds, characteristicIds, ageGroupIds, ageGroupId, items, slug, ...scalar } = b;
    if (scalar.stepsRo !== undefined) scalar.stepsRo = asText(scalar.stepsRo);
    if (scalar.stepsRu !== undefined) scalar.stepsRu = asText(scalar.stepsRu);
    if (scalar.stepsEn !== undefined) scalar.stepsEn = asText(scalar.stepsEn);
    if (scalar.feedingTypeId !== undefined) scalar.feedingTypeId = scalar.feedingTypeId ? Number(scalar.feedingTypeId) : null;
    // statusul se schimba doar via /status (ADMIN) — ignoram aici daca vine de la moderator
    if (req.user.role !== 'ADMIN') delete scalar.status;
    const recipe = await prisma.recipe.update({ where: { id }, data: scalar, include: recipeInclude });
    res.json(recipe);
  } catch (e) {
    res.status(400).json({ error: 'update_failed', message: e.message });
  }
});

// aprobare / respingere in draft — ADMIN only
router.patch('/:id/status', authRequired, roleRequired('ADMIN'), async (req, res) => {
  const { status } = req.body || {};
  if (!['DRAFT', 'PUBLISHED'].includes(status)) return res.status(400).json({ error: 'invalid_status' });
  const recipe = await prisma.recipe.update({ where: { id: Number(req.params.id) }, data: { status }, include: recipeInclude });
  if (status === 'PUBLISHED') postRecipeAsync(recipe);
  res.json(recipe);
});

// publicare manuala pe Telegram (MOD+) — doar retete PUBLISHED
router.post('/:id/telegram', authRequired, roleRequired('MODERATOR', 'ADMIN'), async (req, res) => {
  if (!tgConfigured()) return res.status(400).json({ error: 'telegram_not_configured' });
  const recipe = await prisma.recipe.findUnique({ where: { id: Number(req.params.id) }, include: recipeInclude });
  if (!recipe) return res.status(404).json({ error: 'not_found' });
  if (recipe.status !== 'PUBLISHED') return res.status(400).json({ error: 'not_published' });
  try {
    await postRecipe(recipe);
    res.json({ ok: true });
  } catch (e) {
    res.status(502).json({ error: 'telegram_failed', message: e.message });
  }
});

// delete — ADMIN only
router.delete('/:id', authRequired, roleRequired('ADMIN'), async (req, res) => {
  await prisma.recipe.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

// vote 1-5 — orice utilizator logat
router.post('/:id/rate', authRequired, async (req, res) => {
  const recipeId = Number(req.params.id);
  const value = Number(req.body?.value);
  if (!value || value < 1 || value > 5) return res.status(400).json({ error: 'value_1_5_required' });
  await prisma.rating.upsert({
    where: { userId_recipeId: { userId: req.user.id, recipeId } },
    create: { userId: req.user.id, recipeId, value },
    update: { value }
  });
  const agg = await prisma.rating.aggregate({ where: { recipeId }, _avg: { value: true }, _count: true });
  const recipe = await prisma.recipe.update({
    where: { id: recipeId },
    data: { avgRating: agg._avg.value || 0, ratingsCount: agg._count || 0 }
  });
  res.json({ avgRating: recipe.avgRating, ratingsCount: recipe.ratingsCount });
});

// favorites
router.post('/:id/favorite', authRequired, async (req, res) => {
  const recipeId = Number(req.params.id);
  await prisma.favorite.upsert({ where: { userId_recipeId: { userId: req.user.id, recipeId } }, create: { userId: req.user.id, recipeId }, update: {} });
  res.json({ ok: true });
});
router.delete('/:id/favorite', authRequired, async (req, res) => {
  await prisma.favorite.deleteMany({ where: { userId: req.user.id, recipeId: Number(req.params.id) } });
  res.json({ ok: true });
});

module.exports = router;
