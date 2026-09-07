const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'gustbebe-dev-secret-change-me';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

function roleRequired(...roles) {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    if (roles.includes(req.user.role)) return next();
    // rolul din token poate fi vechi (ex: promovare USER->Autor dupa login):
    // mai verifica o data rolul proaspat din DB inainte sa refuzi
    try {
      const { prisma } = require('../lib/db');
      const u = await prisma.user.findUnique({ where: { id: req.user.id }, select: { role: true } });
      if (u && roles.includes(u.role)) {
        req.user.role = u.role;
        return next();
      }
    } catch {}
    return res.status(403).json({ error: 'forbidden' });
  };
}

module.exports = { signToken, authRequired, roleRequired };
