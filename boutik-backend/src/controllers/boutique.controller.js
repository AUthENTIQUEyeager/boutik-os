/**
 * BoutiK - Contrôleur Boutique
 */
import prisma from '../config/database.js'

// GET /api/boutique
export async function getBoutique(req, res) {
  try {
    const boutique = await prisma.boutique.findUnique({
      where: { id: req.boutiqueId },
      select: {
        id: true, nom: true, whatsapp: true,
        adresse: true, logo: true, siteWeb: true,
        createdAt: true, updatedAt: true
      }
    })
    return res.json(boutique)
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

// PUT /api/boutique
export async function updateBoutique(req, res) {
  try {
    const { nom, adresse, logo, siteWeb } = req.body
    const boutique = await prisma.boutique.update({
      where: { id: req.boutiqueId },
      data: { nom, adresse, logo, siteWeb },
      select: {
        id: true, nom: true, whatsapp: true,
        adresse: true, logo: true, siteWeb: true,
        updatedAt: true
      }
    })
    return res.json(boutique)
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

// GET /api/boutique/stats
export async function getStats(req, res) {
  try {
    const boutiqueId = req.boutiqueId
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      categories,
      totalProduits,
      produitsDisponibles,
      ventesToday,
      ventesTotal,
      alertesStock
    ] = await Promise.all([
      prisma.categorie.count({ where: { boutiqueId } }),

      prisma.produit.count({ where: { boutiqueId } }),

      prisma.produit.count({ where: { boutiqueId, vendu: false } }),

      prisma.vente.findMany({
        where: { boutiqueId, date: { gte: today } },
        select: { prixVente: true, benefice: true }
      }),

      prisma.vente.aggregate({
        where: { boutiqueId },
        _sum: { prixVente: true, benefice: true },
        _count: true
      }),

      // Catégories avec stock faible (≤ 3)
      prisma.$queryRaw`
        SELECT c.id, c.nom, COUNT(p.id) as stock_restant
        FROM categories c
        LEFT JOIN produits p ON p."categorieId" = c.id AND p.vendu = false
        WHERE c."boutiqueId" = ${boutiqueId}
        GROUP BY c.id, c.nom
        HAVING COUNT(p.id) <= 3 AND COUNT(p.id) > 0
      `
    ])

    return res.json({
      beneficeJour: ventesToday.reduce((s, v) => s + v.benefice, 0),
      ventesJour: ventesToday.length,
      caJour: ventesToday.reduce((s, v) => s + v.prixVente, 0),
      stockTotal: produitsDisponibles,
      totalCategories: categories,
      totalProduits,
      beneficeTotal: ventesTotal._sum.benefice || 0,
      caTotal: ventesTotal._sum.prixVente || 0,
      ventesTotalCount: ventesTotal._count,
      alertesStock
    })
  } catch (err) {
    console.error('Stats error:', err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
