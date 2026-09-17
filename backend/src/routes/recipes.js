const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/db');
const { authRequired, roleRequired } = require('../middleware/auth');
const { postRecipe, postRecipeAsync, notifyAdminAsync } = require('../lib/telegram');
const coverLib = require('../lib/cover');
const csvLib = require('../lib/csv');
const { notify } = require('./notifications');
const { notifyUser, notifyAdmins } = require('./notifications');
const { resolveTokens, sendExpoPush, sendFcmPush } = require('./push');

const router = express.Router();

// notificare push la utilizatori cand apare o reteta noua publicata
async function pushNewRecipe(r) {
  try {
    const tokens = await resolveTokens('all');
    if (!tokens.length) return;
    const title = (r.titleRo || r.titleRu || 'Rețetă nouă') + ' 🍼';
    const body = String(r.summaryRo || r.summaryRu || r.summaryEn || 'Vezi rețeta nouă!').slice(0, 140);
    const data = { url: `retete/${r.id}-${r.slug}` };
    const expo = tokens.filter(t => String(t.token).startsWith('ExponentPushToken['));
    const fcm = tokens.filter(t => !String(t.token).startsWith('ExponentPushToken[') && /^fcm/i.test(t.platform || ''));
    if (expo.length) {
      await sendExpoPush(expo.map(t => ({
        to: t.token, sound: 'default', title, body, data
      })));
    }
    if (fcm.length) {
      await sendFcmPush(fcm.map(t => ({ token: t.token, title, body, data })));
    }
    console.log(`[push] new recipe ${r.id} → ${tokens.length} devices (expo:${expo.length} fcm:${fcm.length})`);
  } catch (e) {
    console.error('[push] new recipe failed:', e.message);
  }
}
function pushNewRecipeAsync(r) {
  pushNewRecipe(r).catch(() => {});
}

function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').slice(0, 80) || ('reteta-' + Date.now());
}

// coperta /uploads/* se redenumeste in {id}-{titlu-slug}.ext (dupa create/update/publicare)
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
function adoptCover(recipe) {
  try {
    const m = /^\/uploads\/(.+)$/.exec(recipe.imageUrl || '');
    if (!m) return null;
    const cur = m[1];
    const ext = (path.extname(cur) || '.jpg').toLowerCase();
    const want = `${recipe.id}-${slugify(recipe.titleRo)}${ext}`;
    if (cur === want) return null;
    const from = path.join(UPLOAD_DIR, path.basename(cur));
    const to = path.join(UPLOAD_DIR, want);
    if (!fs.existsSync(from)) return null;
    if (fs.existsSync(to)) fs.unlinkSync(to);
    fs.renameSync(from, to);
    // curata orfani mai vechi ai aceleiasi retete ({id}-*.ext)
    try {
      for (const f of fs.readdirSync(UPLOAD_DIR)) {
        if (f !== want && f.startsWith(`${recipe.id}-`) && /\.(jpe?g|png|webp|gif)$/i.test(f)) {
          try { fs.unlinkSync(path.join(UPLOAD_DIR, f)); } catch {}
        }
      }
    } catch {}
    return `/uploads/${want}`;
  } catch { return null; }
}
async function refreshCover(id) {
  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) return null;
  const url = adoptCover(recipe);
  if (url) await prisma.recipe.update({ where: { id }, data: { imageUrl: url } });
  return url;
}

// coperta default generata (daca reteta a ramas fara poza)
async function ensureCover(id) {
  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe || recipe.imageUrl) return recipe?.imageUrl || null;
  const url = cover.ensureDefaultCover(UPLOAD_DIR, id);
  if (url) await prisma.recipe.update({ where: { id }, data: { imageUrl: url } });
  return url;
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

// varsta "Potrivit de la X": cand se alege un prag (ex: 8+), se leaga automat
// toate pragurile >= minimul selectat — reteta apare si la filtrele lunilor mai mari
async function expandAges(ids) {
  const uniq = [...new Set((ids || []).map(Number).filter(n => Number.isFinite(n)))];
  if (!uniq.length) return [];
  const rows = await prisma.ageGroup.findMany({ where: { id: { in: uniq } }, select: { minMonths: true } });
  if (!rows.length) return [];
  const min = Math.min(...rows.map(r => r.minMonths));
  const all = await prisma.ageGroup.findMany({ where: { minMonths: { gte: min } }, select: { id: true } });
  return [...new Set(all.map(r => r.id))];
}

// GET /api/recipes?q=&category=&age=&feeding=&restriction=&status=&sort=&page=&limit=
// category/restriction accepta slug sau lista slug-uri separate prin virgula; age/feeding id-uri
router.get('/', async (req, res) => {
  const { q, category, age, feeding, restriction, status, sort, mine, page = '1', limit = '12' } = req.query;
  const take = Math.min(parseInt(limit) || 12, 50);
  const skip = (Math.max(parseInt(page) || 1, 1) - 1) * take;

  const where = {};
  const me = optionalAuth(req);
  const role = me?.role || null;
  const privileged = role === 'MODERATOR' || role === 'ADMIN';
  if (privileged && status === 'all') {
    // fara filtru de status
  } else if (privileged && (status === 'DRAFT' || status === 'PUBLISHED')) {
    where.status = status;
  } else {
    where.status = 'PUBLISHED'; // public + default
  }
  // moderator: in listele de administrare (mine=1 sau status all/DRAFT) vede DOAR propriile retete
  if (role === 'MODERATOR' && me && (mine === '1' || status === 'all' || status === 'DRAFT')) {
    where.authorId = me.id;
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

// GET reteta random (pentru ecranul Random din aplicatie) — respecta filtrele category/age
router.get('/random', async (req, res) => {
  const { category, age } = req.query;
  const where = { status: 'PUBLISHED' };
  if (age) {
    const ids = numList(age);
    if (ids.length) where.ageGroups = { some: { ageGroupId: ids.length === 1 ? ids[0] : { in: ids } } };
  }
  if (category) {
    const slugs = String(category).split(',').map(s => s.trim()).filter(Boolean);
    if (slugs.length) where.categories = { some: { category: { slug: slugs.length === 1 ? slugs[0] : { in: slugs } } } };
  }
  const ids = await prisma.recipe.findMany({ where, select: { id: true }, take: 500 });
  if (!ids.length) return res.status(404).json({ error: 'not_found' });
  const pick = ids[Math.floor(Math.random() * ids.length)];
  const recipe = await prisma.recipe.findUnique({ where: { id: pick.id }, include: recipeInclude });
  res.json(recipe);
});

// GET by id pentru editare — MOD doar propriile retete (inainte de /:slug)
// include si istoria respingerilor (vizibila autorului + adminului)
router.get('/by-id/:id', authRequired, roleRequired('MODERATOR', 'ADMIN'), async (req, res) => {
  const recipe = await prisma.recipe.findUnique({
    where: { id: Number(req.params.id) },
    include: { ...recipeInclude, rejections: { orderBy: { createdAt: 'desc' } } }
  });
  if (!recipe) return res.status(404).json({ error: 'not_found' });
  if (req.user.role === 'MODERATOR' && recipe.authorId !== req.user.id) return res.status(403).json({ error: 'forbidden' });
  res.json(recipe);
});

// GET export meniu complet (doar RO) — ADMIN (inainte de /:slug!)
router.get('/export', authRequired, roleRequired('ADMIN'), async (req, res) => {
  const items = await prisma.recipe.findMany({ include: recipeInclude, orderBy: { id: 'asc' } });
  res.json(items.map((r) => ({
    slug: r.slug,
    titleRo: r.titleRo, summaryRo: r.summaryRo, ingredientsRo: r.ingredientsRo,
    items: (r.ingredientsDetailed || []).map((d) => ({
      product: d.ingredient?.nameRo || '', quantity: d.quantity ?? null, unit: d.unit || '', note: d.noteRo || ''
    })),
    stepsRo: r.stepsRo,
    prepMinutes: r.prepMinutes, cookMinutes: r.cookMinutes, servings: r.servings, difficulty: r.difficulty,
    imageUrl: r.imageUrl, status: r.status,
    ageMinMonths: (r.ageGroups || []).map((a) => a.ageGroup?.minMonths).filter((n) => Number.isFinite(n)),
    feedingType: r.feedingType?.slug || null,
    categories: (r.categories || []).map((c) => c.category?.slug).filter(Boolean),
    restrictions: (r.restrictions || []).map((c) => c.restriction?.slug).filter(Boolean),
    characteristics: (r.characteristics || []).map((c) => c.characteristic?.slug).filter(Boolean)
  })));
});

// GET export meniu CSV (doar RO, Excel-friendly) — ADMIN (inainte de /:slug!)
// Coloana ID (obligatorie la import pentru potrivire); fara slug, fara ingredientsRo (doar items).
router.get('/export.csv', authRequired, roleRequired('ADMIN'), async (req, res) => {
  const items = await prisma.recipe.findMany({ include: recipeInclude, orderBy: { id: 'asc' } });
  const headers = ['id', 'titleRo', 'summaryRo', 'items', 'stepsRo',
    'prepMinutes', 'cookMinutes', 'servings', 'difficulty', 'imageUrl', 'status',
    'ageMin', 'feedingType', 'categories', 'restrictions', 'characteristics'];
  const rows = items.map((r) => {
    const mins = (r.ageGroups || []).map((a) => a.ageGroup?.minMonths).filter((n) => Number.isFinite(n));
    return {
      id: r.id,
      titleRo: r.titleRo, summaryRo: r.summaryRo || '',
      items: csvLib.itemsCell((r.ingredientsDetailed || []).map((d) => ({
        product: d.ingredient?.nameRo || '', quantity: d.quantity ?? '', unit: d.unit || '', note: d.noteRo || ''
      }))),
      stepsRo: r.stepsRo || '',
      prepMinutes: r.prepMinutes, cookMinutes: r.cookMinutes, servings: r.servings,
      difficulty: r.difficulty || '', imageUrl: r.imageUrl || '', status: r.status,
      ageMin: mins.length ? Math.min(...mins) : '',
      feedingType: r.feedingType?.slug || '',
      categories: (r.categories || []).map((c) => c.category?.slug).filter(Boolean).join('|'),
      restrictions: (r.restrictions || []).map((c) => c.restriction?.slug).filter(Boolean).join('|'),
      characteristics: (r.characteristics || []).map((c) => c.characteristic?.slug).filter(Boolean).join('|')
    };
  });
  res.type('text/csv; charset=utf-8').send(csvLib.stringify(rows, headers));
});

// POST import meniu (doar RO) — ADMIN; accepta { items: [...] } sau { csv: "..." }.
// Ingredientele lipsa se creeaza dupa nume; varstele se extind automat in sus.
router.post('/import', authRequired, roleRequired('ADMIN'), async (req, res) => {
  let raw = Array.isArray(req.body) ? req.body : req.body?.items;
  if (typeof req.body?.csv === 'string' && req.body.csv.trim()) {
    try {
      const parsed = csvLib.parse(req.body.csv);
      const rows = csvLib.normalizeRows(parsed);
      const hasTitle = rows.some((r) => String(r.titleRo || '').trim());
      if (!rows.length || !hasTitle) {
        return res.status(400).json({ error: 'csv_no_title_column' });
      }
      raw = rows.map((row) => ({
        id: row.id !== '' && row.id !== undefined ? Number(row.id) : null,
        titleRo: (row.titleRo || '').trim(), summaryRo: (row.summaryRo || '').trim(),
        ingredientsRo: (row.ingredientsRo || '').trim(),
        items: csvLib.parseItems(row.items),
        stepsRo: (row.stepsRo || '').trim(),
        prepMinutes: row.prepMinutes, cookMinutes: row.cookMinutes, servings: row.servings,
        difficulty: (row.difficulty || '').trim(), imageUrl: (row.imageUrl || '').trim(),
        status: (row.status || '').trim(),
        ageMinMonths: row.ageMin !== '' && row.ageMin !== undefined ? [Number(row.ageMin)] : [],
        feedingType: (row.feedingType || '').trim(),
        categories: csvLib.splitList(row.categories),
        restrictions: csvLib.splitList(row.restrictions),
        characteristics: csvLib.splitList(row.characteristics)
      }));
    } catch (e) { return res.status(400).json({ error: 'csv_invalid', message: e.message }); }
  }
  if (!Array.isArray(raw)) return res.status(400).json({ error: 'items_required' });
  if (raw.length > 500) return res.status(400).json({ error: 'too_many' });
  const catMap = Object.fromEntries((await prisma.menuCategory.findMany()).map((c) => [c.slug, c.id]));
  const restrMap = Object.fromEntries((await prisma.dietaryRestriction.findMany()).map((c) => [c.slug, c.id]));
  const charMap = Object.fromEntries((await prisma.characteristic.findMany()).map((c) => [c.slug, c.id]));
  const feedMap = Object.fromEntries((await prisma.feedingType.findMany()).map((c) => [c.slug, c.id]));
  const ageMap = Object.fromEntries((await prisma.ageGroup.findMany()).map((c) => [c.minMonths, c.id]));
  const ingCache = new Map();
  async function ingIdByName(nameRo) {
    const n = String(nameRo || '').trim();
    if (!n) return null;
    if (ingCache.has(n)) return ingCache.get(n);
    let ing = await prisma.ingredient.findFirst({ where: { nameRo: n } });
    if (!ing) {
      ing = await prisma.ingredient.create({
        data: { slug: slugify(n) + '-' + Date.now().toString(36), nameRo: n, nameRu: n, nameEn: n }
      });
    }
    ingCache.set(n, ing.id);
    return ing.id;
  }
  const out = { created: 0, updated: 0, copied: 0, skipped: [], failed: [] };
  for (let i = 0; i < raw.length; i++) {
    const b = raw[i] || {};
    try {
      const title = String(b.titleRo || '').trim();
      const steps = String(b.stepsRo || '').trim();
      if (!title || !steps) {
        throw new Error(`randul ${i + 1}: completeaza titlul (titleRo/titlu) si pasii (stepsRo/pasi)`);
      }
      // potrivire dupa ID; titlul decide actualizare vs copie
      const rid = Number(b.id);
      const byId = Number.isFinite(rid) && rid > 0
        ? await prisma.recipe.findUnique({ where: { id: rid } })
        : null;
      const byTitle = await prisma.recipe.findFirst({ where: { titleRo: title } });
      const target = byId && (byId.titleRo || '').trim() === title ? { recipe: byId, mode: 'update' }
        : byId ? { recipe: byId, mode: 'copy', copyOf: byId.id }
        : byTitle ? { recipe: byTitle, mode: 'copy', copyOf: byTitle.id }
        : { recipe: null, mode: 'create' };
      const links = [];
      for (const it of (b.items || [])) {
        const iid = await ingIdByName(it.product || it.nameRo);
        if (!iid) continue;
        const qty = it.quantity !== undefined && it.quantity !== '' && it.quantity !== null ? Number(it.quantity) : null;
        links.push({
          ingredientId: iid, quantity: Number.isFinite(qty) ? qty : null, unit: it.unit || null,
          noteRo: it.note || it.noteRo || null, noteRu: it.note || it.noteRo || null, noteEn: it.note || it.noteRo || null,
          position: links.length
        });
      }
      const ingredientsRo = b.ingredientsRo || (b.items || [])
        .map((it) => String(it.product || it.nameRo || '').trim())
        .filter(Boolean)
        .map((p, k) => {
          const it = (b.items || [])[k] || {};
          const q = it.quantity !== undefined && it.quantity !== '' && it.quantity !== null ? ` — ${it.quantity} ${(it.unit || '').trim()}`.trim() : '';
          return `${p}${q}`;
        }).join('\n');
      const ageIds = await expandAges((b.ageMinMonths || []).map((m) => ageMap[Number(m)]).filter(Boolean));
      const validStatus = ['DRAFT', 'PUBLISHED'].includes(b.status) ? b.status : null;
      const data = {
        titleRo: title, titleRu: b.titleRu || title, titleEn: b.titleEn || title,
        summaryRo: b.summaryRo || null, summaryRu: b.summaryRo || null, summaryEn: b.summaryRo || null,
        ingredientsRo, ingredientsRu: ingredientsRo, ingredientsEn: ingredientsRo,
        stepsRo: asText(steps), stepsRu: asText(steps), stepsEn: asText(steps),
        prepMinutes: Number(b.prepMinutes) || 15, cookMinutes: Number(b.cookMinutes) || 15,
        servings: Number(b.servings) || 2, difficulty: b.difficulty || 'usor',
        imageUrl: b.imageUrl || null,
        feedingTypeId: (b.feedingType && feedMap[b.feedingType]) || null
      };
      async function relLinks(recipeId) {
        await prisma.recipeCategory.deleteMany({ where: { recipeId } });
        await prisma.recipeRestriction.deleteMany({ where: { recipeId } });
        await prisma.recipeCharacteristic.deleteMany({ where: { recipeId } });
        await prisma.recipeAge.deleteMany({ where: { recipeId } });
        await prisma.recipeIngredient.deleteMany({ where: { recipeId } });
        const cats = [...new Set((b.categories || []).map((s) => catMap[s]).filter(Boolean))];
        if (cats.length) await prisma.recipeCategory.createMany({ data: cats.map((categoryId) => ({ recipeId, categoryId })) });
        const restrs = [...new Set((b.restrictions || []).map((s) => restrMap[s]).filter(Boolean))];
        if (restrs.length) await prisma.recipeRestriction.createMany({ data: restrs.map((restrictionId) => ({ recipeId, restrictionId })) });
        const chars = [...new Set((b.characteristics || []).map((s) => charMap[s]).filter(Boolean))];
        if (chars.length) await prisma.recipeCharacteristic.createMany({ data: chars.map((characteristicId) => ({ recipeId, characteristicId })) });
        if (ageIds.length) await prisma.recipeAge.createMany({ data: ageIds.map((ageGroupId) => ({ recipeId, ageGroupId })) });
        if (links.length) await prisma.recipeIngredient.createMany({ data: links.map((l) => ({ ...l, recipeId })) });
      }
      if (target.mode === 'update') {
        // ID + titlu coincid -> ACTUALIZARE (statusul se schimba doar daca vine valid in CSV)
        await prisma.recipe.update({
          where: { id: target.recipe.id },
          data: { ...data, ...(validStatus ? { status: validStatus } : {}) }
        });
        await relLinks(target.recipe.id);
        await refreshCover(target.recipe.id);
        await ensureCover(target.recipe.id);
        out.updated++;
      } else {
        // ID inexistent/gol sau titlu diferit -> ADAUGARE; copiile dupa titlu duplicat merg DRAFT cu (copy ID n)
        const isCopy = target.mode === 'copy';
        const copyTitle = isCopy ? `${title} (copy ID ${target.copyOf})` : title;
        const created = await prisma.recipe.create({
          data: {
            ...data,
            titleRo: copyTitle, titleRu: isCopy ? copyTitle : (b.titleRu || title), titleEn: isCopy ? copyTitle : (b.titleEn || title),
            slug: slugify(copyTitle) + '-' + Date.now().toString(36),
            status: isCopy ? 'DRAFT' : (validStatus || 'DRAFT'),
            authorId: req.user.id
          }
        });
        await relLinks(created.id);
        await refreshCover(created.id);
        await ensureCover(created.id);
        if (isCopy) out.copied++;
        else out.created++;
      }
    } catch (e) { out.failed.push({ index: i, title: b.titleRo || '', error: e.message }); }
  }
  res.json(out);
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
    const uniqAges = await expandAges(b.ageGroupIds || (b.ageGroupId ? [b.ageGroupId] : []));
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
    if (recipe.status === 'PUBLISHED') {
      const cover = await refreshCover(recipe.id);
      if (cover) recipe.imageUrl = cover;
      const defCover = await ensureCover(recipe.id);
      if (defCover) recipe.imageUrl = defCover;
      // notificare Telegram + Push doar daca e ceruta explicit (checkbox Publica + Notificare)
      if (b.notify !== false && b.notify !== 'false' && b.notify !== 0) {
        postRecipeAsync(recipe);
        pushNewRecipeAsync(recipe);
      }
    } else {
      const author = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true } });
      await notify('recipe_pending', `Rețetă de validat: ${recipe.titleRo}`, `Autor: ${author?.name || ''}`, `/admin/retete/${recipe.id}/editeaza`);
      notifyAdminAsync(`📝 <b>Rețetă nouă de validat</b>\n${recipe.titleRo}\nAutor: ${author?.name || ''}`);
      // email catre admini (profil) + Telegram DM (chat_id din profil)
      notifyAdmins(
        `Rețetă nouă de validat: ${recipe.titleRo}`,
        `<p>O rețetă nouă așteaptă validarea: <b>${recipe.titleRo}</b></p><p>Autor: ${author?.name || ''}</p>`,
        `📝 Rețetă nouă de validat: ${recipe.titleRo} (autor: ${author?.name || ''})`
      );
    }
    res.status(201).json(recipe);
  } catch (e) {
    res.status(400).json({ error: 'create_failed', message: e.message });
  }
});

// update — ADMIN tot, MODERATOR doar propriile retete
router.put('/:id', authRequired, roleRequired('MODERATOR', 'ADMIN'), async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  if (req.user.role === 'MODERATOR') {
    const own = await prisma.recipe.findUnique({ where: { id }, select: { authorId: true } });
    if (!own) return res.status(404).json({ error: 'not_found' });
    if (own.authorId !== req.user.id) return res.status(403).json({ error: 'forbidden' });
  }
  try {
    const before = await prisma.recipe.findUnique({ where: { id }, select: { imageUrl: true } });
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
      const uniq = await expandAges(b.ageGroupIds || [b.ageGroupId]);
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
    if (b.imageUrl || b.titleRo) {
      const cover = await refreshCover(id);
      if (cover) recipe.imageUrl = cover;
    }
    // coperta default veche se sterge cand vine poza reala
    if (before?.imageUrl && before.imageUrl.endsWith('-coperta.png') && recipe.imageUrl && before.imageUrl !== recipe.imageUrl) {
      coverLib.removeFile(UPLOAD_DIR, before.imageUrl);
    }
    const defCover = await ensureCover(id);
    if (defCover) recipe.imageUrl = defCover;
    res.json(recipe);
  } catch (e) {
    res.status(400).json({ error: 'update_failed', message: e.message });
  }
});

// aprobare / respingere in draft — ADMIN only (respingerea cere motiv + ramane in istorie)
router.patch('/:id/status', authRequired, roleRequired('ADMIN'), async (req, res) => {
  const { status, reason } = req.body || {};
  if (!['DRAFT', 'PUBLISHED'].includes(status)) return res.status(400).json({ error: 'invalid_status' });
  const id = Number(req.params.id);
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const recipe = await prisma.recipe.update({ where: { id }, data: { status }, include: recipeInclude });
  if (status === 'PUBLISHED') {
    // aprobare: se sterge istoria respingerilor (nu ocupa memorie)
    await prisma.recipeRejection.deleteMany({ where: { recipeId: id } }).catch(() => {});
    const cover = await refreshCover(id);
    if (cover) recipe.imageUrl = cover;
    const defCover = await ensureCover(id);
    if (defCover) recipe.imageUrl = defCover;
    // notificare Telegram + Push doar daca e ceruta (checkbox Publica + Notificare)
    if (req.body?.notify !== false && req.body?.notify !== 'false' && req.body?.notify !== 0) {
      postRecipeAsync(recipe);
      pushNewRecipeAsync(recipe);
    }
    if (recipe.authorId) {
      notifyUser(
        recipe.authorId,
        `Rețeta aprobată: ${recipe.titleRo}`,
        `<p>Rețeta <b>${esc(recipe.titleRo)}</b> a fost publicată. Felicitări!</p>`,
        `✅ Rețeta a fost publicată: ${recipe.titleRo}`
      );
    }
  } else if (status === 'DRAFT' && reason && String(reason).trim()) {
    await prisma.recipeRejection.create({
      data: { recipeId: id, reason: String(reason).slice(0, 500), createdById: req.user.id }
    });
    if (recipe.authorId) {
      notifyUser(
        recipe.authorId,
        `Rețeta respinsă: ${recipe.titleRo}`,
        `<p>Rețeta <b>${esc(recipe.titleRo)}</b> a fost respinsă.</p><p>Motiv: ${esc(reason)}</p><p>Corecteaz-o și va fi reanalizată.</p>`,
        `❌ Rețetă respinsă: ${recipe.titleRo}\nMotiv: ${String(reason).slice(0, 300)}`
      );
    }
  }
  res.json(recipe);
});

// publicare manuala pe Telegram — DOAR ADMIN (nu si utilizatorii/moderatorii)
router.post('/:id/telegram', authRequired, roleRequired('ADMIN'), async (req, res) => {
  const recipe = await prisma.recipe.findUnique({ where: { id: Number(req.params.id) }, include: recipeInclude });
  if (!recipe) return res.status(404).json({ error: 'not_found' });
  if (recipe.status !== 'PUBLISHED') return res.status(400).json({ error: 'not_published' });
  try {
    await postRecipe(recipe);
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'not_configured') return res.status(400).json({ error: 'telegram_not_configured' });
    res.status(502).json({ error: 'telegram_failed', message: e.message });
  }
});

// delete — ADMIN only
router.delete('/:id', authRequired, roleRequired('ADMIN'), async (req, res) => {
  await prisma.recipe.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

// media combinata voturi cont + voturi guest (aplicatie)
async function recomputeRating(recipeId) {
  const [a, g] = await Promise.all([
    prisma.rating.aggregate({ where: { recipeId }, _avg: { value: true }, _count: true }),
    prisma.guestVote.aggregate({ where: { recipeId }, _avg: { value: true }, _count: true })
  ]);
  const c1 = a._count || 0, c2 = g._count || 0, total = c1 + c2;
  const avg = total ? ((a._avg.value || 0) * c1 + (g._avg.value || 0) * c2) / total : 0;
  return prisma.recipe.update({ where: { id: recipeId }, data: { avgRating: avg, ratingsCount: total } });
}

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
  const recipe = await recomputeRating(recipeId);
  res.json({ avgRating: recipe.avgRating, ratingsCount: recipe.ratingsCount });
});

// vote guest 1-5 — FARA cont (aplicatie), dupa deviceId
router.post('/:id/guest-rate', async (req, res) => {
  const recipeId = Number(req.params.id);
  const value = Number(req.body?.value);
  const deviceId = String(req.body?.deviceId || '');
  if (!value || value < 1 || value > 5) return res.status(400).json({ error: 'value_1_5_required' });
  if (deviceId.length < 8 || deviceId.length > 128) return res.status(400).json({ error: 'device_required' });
  const exists = await prisma.recipe.findUnique({ where: { id: recipeId }, select: { id: true, status: true } });
  if (!exists || exists.status !== 'PUBLISHED') return res.status(404).json({ error: 'not_found' });
  await prisma.guestVote.upsert({
    where: { deviceId_recipeId: { deviceId, recipeId } },
    create: { deviceId, recipeId, value },
    update: { value }
  });
  const recipe = await recomputeRating(recipeId);
  res.json({ avgRating: recipe.avgRating, ratingsCount: recipe.ratingsCount });
});

// inregistrare vizualizare unica/zi (public, fara cont obligatoriu)
// identitate: user logat sau hash(IP + user-agent); aceeasi persoana in aceeasi zi = 1
router.post('/:id/view', async (req, res) => {
  const recipeId = Number(req.params.id);
  const crypto = require('crypto');
  const me = optionalAuth(req);
  const day = new Date().toISOString().slice(0, 10);
  const raw = me ? `u${me.id}` : `g${req.ip || ''}|${req.headers['user-agent'] || ''}`;
  const identHash = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
  try {
    await prisma.recipeView.create({ data: { recipeId, day, identHash } });
    const recipe = await prisma.recipe.update({ where: { id: recipeId }, data: { viewsCount: { increment: 1 } } });
    return res.json({ views: recipe.viewsCount, counted: true });
  } catch {
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId }, select: { viewsCount: true } });
    return res.json({ views: recipe?.viewsCount || 0, counted: false });
  }
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
