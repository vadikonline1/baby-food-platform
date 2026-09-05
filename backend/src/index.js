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

// Frontend SPA servit din acelasi container/DNS (./public copiat la build).
// Rutele /api si /uploads sunt exceptate.
// Scripturile SEO din Admin (seo_head_end / seo_body_start / seo_body_end)
// se injecteaza in index.html la fiecare request (cache 30s).
const publicDir = path.join(__dirname, '..', 'public');
const SEO_KEYS = ['seo_head_end', 'seo_body_start', 'seo_body_end'];
let seoCache = { at: 0, html: '' };
async function indexedHtml() {
  if (Date.now() - seoCache.at < 30000 && seoCache.html) return seoCache.html;
  let html = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
  try {
    const { prisma: db } = require('./lib/db');
    const rows = await db.appSetting.findMany({ where: { key: { in: SEO_KEYS } } });
    const m = Object.fromEntries(rows.map(r => [r.key, r.value]));
    if (m.seo_head_end) html = html.replace('</head>', `${m.seo_head_end}\n</head>`);
    if (m.seo_body_start) html = html.replace(/<body([^>]*)>/, `<body$1>\n${m.seo_body_start}`);
    if (m.seo_body_end) html = html.replace('</body>', `${m.seo_body_end}\n</body>`);
  } catch (e) { console.error('[seo] inject failed:', e.message); }
  seoCache = { at: Date.now(), html };
  return html;
}
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir, { index: false }));
  app.get(/^\/(?!api|uploads).*/, async (req, res) => {
    res.type('html').send(await indexedHtml());
  });
}

app.listen(PORT, () => console.log(`[gustbebe] backend on :${PORT}`));
