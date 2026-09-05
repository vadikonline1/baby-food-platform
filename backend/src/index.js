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

// Frontend SPA servit din acelasi container/DNS (./public copiat la build).
// Rutele /api si /uploads sunt exceptate.
const publicDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get(/^\/(?!api|uploads).*/, (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
}

app.listen(PORT, () => console.log(`[gustbebe] backend on :${PORT}`));
