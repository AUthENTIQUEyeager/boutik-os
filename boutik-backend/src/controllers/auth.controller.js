/**
 * BoutiK - Contrôleur Authentification
 */
import bcrypt from 'bcryptjs'
import prisma from '../config/database.js'
import { generateToken } from '../middleware/auth.js'

// POST /api/auth/login
export async function login(req, res) {
  try {
    const { whatsapp, password } = req.body

    if (!whatsapp || !password) {
      return res.status(400).json({ error: 'WhatsApp et mot de passe requis' })
    }

    const boutique = await prisma.boutique.findUnique({
      where: { whatsapp }
    })

    if (!boutique) {
      return res.status(404).json({ error: 'Aucune boutique trouvée avec ce numéro' })
    }

    if (boutique.bloquee) {
      return res.status(403).json({ error: 'Boutique bloquée. Contactez l\'administrateur.' })
    }

    const passwordOk = await bcrypt.compare(password, boutique.password)
    if (!passwordOk) {
      return res.status(401).json({ error: 'Mot de passe incorrect' })
    }

    const token = generateToken(boutique.id)
    const { password: _, ...boutiqueData } = boutique

    return res.json({
      success: true,
      token,
      boutique: boutiqueData
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

// POST /api/auth/register
export async function register(req, res) {
  try {
    const { nom, whatsapp, password, adresse } = req.body

    if (!nom || !whatsapp || !password) {
      return res.status(400).json({ error: 'Nom, WhatsApp et mot de passe requis' })
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Mot de passe trop court (minimum 4 caractères)' })
    }

    // Vérifier si la boutique existe déjà
    const existing = await prisma.boutique.findUnique({ where: { whatsapp } })
    if (existing) {
      return res.status(409).json({ error: 'Une boutique existe déjà avec ce numéro WhatsApp' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const boutique = await prisma.boutique.create({
      data: { nom, whatsapp, password: hashedPassword, adresse: adresse || '' }
    })

    const token = generateToken(boutique.id)
    const { password: _, ...boutiqueData } = boutique

    return res.status(201).json({
      success: true,
      token,
      boutique: boutiqueData,
      isNew: true
    })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

// GET /api/auth/me
export async function me(req, res) {
  try {
    const { password: _, ...boutiqueData } = req.boutique
    return res.json({ boutique: boutiqueData })
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

// PUT /api/auth/password
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body

    const boutique = await prisma.boutique.findUnique({
      where: { id: req.boutiqueId }
    })

    const ok = await bcrypt.compare(currentPassword, boutique.password)
    if (!ok) return res.status(401).json({ error: 'Mot de passe actuel incorrect' })

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.boutique.update({
      where: { id: req.boutiqueId },
      data: { password: hashed }
    })

    return res.json({ success: true, message: 'Mot de passe mis à jour' })
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
