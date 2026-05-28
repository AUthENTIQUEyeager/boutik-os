/**
 * BoutiK - Middleware d'authentification JWT
 */
import jwt from 'jsonwebtoken'
import prisma from '../config/database.js'

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Vérifier que la boutique existe et n'est pas bloquée
    const boutique = await prisma.boutique.findUnique({
      where: { id: decoded.boutiqueId }
    })

    if (!boutique) {
      return res.status(401).json({ error: 'Boutique introuvable' })
    }

    if (boutique.bloquee) {
      return res.status(403).json({ error: 'Boutique bloquée. Contactez l\'administrateur.' })
    }

    req.boutiqueId = boutique.id
    req.boutique = boutique
    req.role = decoded.role || 'gerant'
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expirée. Reconnectez-vous.' })
    }
    return res.status(401).json({ error: 'Token invalide' })
  }
}

export function adminMiddleware(req, res, next) {
  if (req.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' })
  }
  next()
}

export function generateToken(boutiqueId, role = 'gerant') {
  return jwt.sign(
    { boutiqueId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  )
}
