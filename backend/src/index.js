require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const recipeRoutes = require('./routes/recipes');
const taxonomyRoutes = require('./routes/taxonomies');
const userRoutes = require('./routes/users');
const ingredientRoutes = require('./routes/ingredients');
const statsRoutes = require('./routes/stats');
const settingsRoutes = require('./routes/settings');
const notificationsRoutes = require('./routes/notifications');
const authorRequestRoutes = require('./routes/author-requests');
const contactRoutes = require('./routes/contact');
const contentRoutes = require('./routes/content');

const app = express();
const PORT = process.env.PORT || 4000;

const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors(corsOrigin === '*' || !corsOrigin ? {} : { origin: corsOrigin.split(','), credentials: true }));
app.use(express.json({ limit: '2mb' }));

// uploads (poze retete) — servite static, volum docker
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_'))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
const { authRequired, roleRequired } = require('./middleware/auth');
app.post('/api/upload', authRequired, roleRequired('MODERATOR', 'ADMIN'), upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no_file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'gustbebe-backend' }));

// REST API — stabil, refolosit de aplicatiile mobile (Android/iOS) ulterior
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/taxonomies', taxonomyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/author-requests', authorRequestRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/content', contentRoutes);
const pushRoutes = require('./routes/push');
app.use('/api/push', pushRoutes);

// Frontend SPA servit din acelasi container/DNS (./public copiat la build).
// Rutele /api si /uploads sunt exceptate.
// SEO: scripturi custom din Admin + meta default (descriere/cuvinte cheie/OG)
// + meta per-reteta (titlu/descriere/imagine) pentru /retete/:slug.
const publicDir = path.join(__dirname, '..', 'public');
const SEO_KEYS = ['seo_head_end', 'seo_body_start', 'seo_body_end', 'seo_meta_description', 'seo_meta_keywords'];
let seoCache = { at: 0, settings: null, pages: new Map() };

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function seoSettings() {
  if (Date.now() - seoCache.at < 30000 && seoCache.settings) return seoCache.settings;
  try {
    const { prisma: db } = require('./lib/db');
    const rows = await db.appSetting.findMany({ where: { key: { in: SEO_KEYS } } });
    seoCache.settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
  } catch (e) { seoCache.settings = {}; }
  seoCache.at = Date.now();
  return seoCache.settings;
}

async function indexedHtml(reqPath) {
  const cached = seoCache.pages.get(reqPath);
  if (cached && Date.now() - cached.at < 60000) return cached.html;
  let html = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
  const m = await seoSettings();
  const { getValue } = require('./lib/settings');
  const appUrl = (await getValue('APP_URL', null, 'http://localhost:4000')).replace(/\/$/, '');

  // meta default site
  const siteDesc = m.seo_meta_description || 'GustBebe — rețete sănătoase pentru bebeluși și copii mici, ghid de diversificare.';
  const siteKeys = m.seo_meta_keywords || 'retete bebelusi, diversificare, mancare copii, retete copii mici';
  let head = `<meta name="description" content="${esc(siteDesc)}">\n`
    + `<meta name="keywords" content="${esc(siteKeys)}">\n`
    + `<meta property="og:type" content="website">\n`
    + `<meta property="og:site_name" content="GustBebe">\n`
    + `<link rel="canonical" href="${esc(appUrl + reqPath)}">\n`;

  // meta per-reteta pentru /retete/id-sau-slug (titlu/descriere/poza pt. share)
  const rm = /^\/retete\/([^/]+)/.exec(reqPath);
  if (rm) {
    try {
      const { prisma: db } = require('./lib/db');
      let recipe = null;
      const im = /^(\d+)-/.exec(rm[1]);
      if (im) recipe = await db.recipe.findUnique({ where: { id: Number(im[1]) } });
      if (!recipe) recipe = await db.recipe.findUnique({ where: { slug: rm[1] } });
      if (recipe && recipe.status === 'PUBLISHED') {
        const desc = recipe.summaryRo || siteDesc;
        const img = recipe.imageUrl
          ? (recipe.imageUrl.startsWith('http') ? recipe.imageUrl : appUrl + recipe.imageUrl)
          : null;
        head = `<title>${esc(recipe.titleRo)} — GustBebe</title>\n`
          + `<meta name="description" content="${esc(desc)}">\n`
          + `<meta property="og:title" content="${esc(recipe.titleRo)}">\n`
          + `<meta property="og:description" content="${esc(desc)}">\n`
          + (img ? `<meta property="og:image" content="${esc(img)}">\n` : '')
          + `<link rel="canonical" href="${esc(appUrl + reqPath)}">\n`;
        html = html.replace(/<title>.*?<\/title>/, '');
      }
    } catch (e) { console.error('[seo] recipe meta failed:', e.message); }
  }
  html = html.replace('</head>', `${head}${m.seo_head_end || ''}\n</head>`);
  if (m.seo_body_start) html = html.replace(/<body([^>]*)>/, `<body$1>\n${m.seo_body_start}`);
  if (m.seo_body_end) html = html.replace('</body>', `${m.seo_body_end}\n</body>`);
  if (seoCache.pages.size > 200) seoCache.pages.clear();
  seoCache.pages.set(reqPath, { at: Date.now(), html });
  return html;
}
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir, { index: false }));
  app.get(/^\/(?!api|uploads).*/, async (req, res) => {
    res.type('html').send(await indexedHtml(req.path));
  });
}

app.listen(PORT, () => console.log(`[gustbebe] backend on :${PORT}`));
