/**
 * BoutiK - Contrôleur Admin système
 */
import prisma from '../config/database.js'
import { generateToken } from '../middleware/auth.js'

export async function adminLogin(req, res) {
  try {
    const { password } = req.body
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Accès refusé' })
    }
    const token = generateToken('admin', 'admin')
    return res.json({ success: true, token })
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

export async function getAllBoutiques(req, res) {
  try {
    const boutiques = await prisma.boutique.findMany({
      select: {
        id: true, nom: true, whatsapp: true,
        adresse: true, bloquee: true, createdAt: true,
        _count: { select: { categories: true, ventes: true, produits: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    const enriched = await Promise.all(boutiques.map(async (b) => {
      const stats = await prisma.vente.aggregate({
        where: { boutiqueId: b.id },
        _sum: { prixVente: true, benefice: true }
      })
      const ventesAujourdhui = await prisma.vente.count({
        where: {
          boutiqueId: b.id,
          date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      })
      return {
        ...b,
        ca: stats._sum.prixVente || 0,
        benefice: stats._sum.benefice || 0,
        ventesAujourdhui
      }
    }))

    return res.json(enriched)
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

export async function bloquerBoutique(req, res) {
  try {
    const boutique = await prisma.boutique.update({
      where: { id: req.params.id },
      data: { bloquee: true }
    })
    return res.json({ success: true, boutique })
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

export async function debloquerBoutique(req, res) {
  try {
    const boutique = await prisma.boutique.update({
      where: { id: req.params.id },
      data: { bloquee: false }
    })
    return res.json({ success: true, boutique })
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

export async function getGlobalStats(req, res) {
  try {
    const [boutiques, ventes, produits] = await Promise.all([
      prisma.boutique.count(),
      prisma.vente.aggregate({
        _sum: { prixVente: true, benefice: true },
        _count: true
      }),
      prisma.produit.count()
    ])
    return res.json({
      totalBoutiques: boutiques,
      totalVentes: ventes._count,
      totalCA: ventes._sum.prixVente || 0,
      totalBenefice: ventes._sum.benefice || 0,
      totalProduits: produits
    })
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
