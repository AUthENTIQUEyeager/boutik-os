const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// Vérifie le JWT. Si role === 'admin', bypass la vérification boutique.
async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Token manquant' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.role === 'admin') {
      req.isAdmin = true;
      req.boutiqueId = null;
      return next();
    }

    const boutique = await prisma.boutique.findUnique({ where: { id: payload.boutiqueId } });
    if (!boutique) return res.status(401).json({ error: 'Boutique introuvable' });
    if (boutique.bloquee) return res.status(403).json({ error: 'Boutique bloquée', bloquee: true });

    req.boutiqueId = boutique.id;
    req.boutique = boutique;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

// Réservé aux routes admin uniquement
function adminOnly(req, res, next) {
  if (!req.isAdmin) return res.status(403).json({ error: 'Accès admin requis' });
  next();
}

module.exports = { authMiddleware, adminOnly };
