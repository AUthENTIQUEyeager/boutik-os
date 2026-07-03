/**
 * BoutiK - Contrôleur Produits
 */
import prisma from '../config/database.js'

// GET /api/produits
export async function getProduits(req, res) {
  try {
    const { categorieId, vendu, limit = 100, offset = 0 } = req.query

    const where = { boutiqueId: req.boutiqueId }
    if (categorieId) where.categorieId = categorieId
    if (vendu !== undefined) where.vendu = vendu === 'true'

    const [produits, total] = await Promise.all([
      prisma.produit.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.produit.count({ where })
    ])

    return res.json({ produits, total })
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

// GET /api/produits/:id
export async function getProduit(req, res) {
  try {
    const produit = await prisma.produit.findFirst({
      where: { id: req.params.id, boutiqueId: req.boutiqueId },
      include: { categorie: true }
    })
    if (!produit) return res.status(404).json({ error: 'Produit introuvable' })
    return res.json(produit)
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
