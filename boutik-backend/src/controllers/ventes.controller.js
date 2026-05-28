/**
 * BoutiK - Contrôleur Ventes
 */
import prisma from '../config/database.js'

// GET /api/ventes
export async function getVentes(req, res) {
  try {
    const { from, to, limit = 100, offset = 0 } = req.query

    const where = { boutiqueId: req.boutiqueId }
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = new Date(from)
      if (to) where.date.lte = new Date(to)
    }

    const [ventes, total] = await Promise.all([
      prisma.vente.findMany({
        where,
        orderBy: { date: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.vente.count({ where })
    ])

    return res.json({ ventes, total })
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

// POST /api/ventes
export async function createVente(req, res) {
  try {
    const { id, produitId, vendeurNom = 'Gérant', date } = req.body

    if (!produitId) return res.status(400).json({ error: 'produitId requis' })

    // Vérifier que le produit appartient à cette boutique et est disponible
    const produit = await prisma.produit.findFirst({
      where: { id: produitId, boutiqueId: req.boutiqueId }
    })

    if (!produit) return res.status(404).json({ error: 'Produit introuvable' })
    if (produit.vendu) return res.status(409).json({ error: 'Produit déjà vendu' })

    const dateVente = date ? new Date(date) : new Date()

    // Transaction : marquer vendu + créer vente
    const vente = await prisma.$transaction(async (tx) => {
      await tx.produit.update({
        where: { id: produitId },
        data: { vendu: true, dateVente }
      })

      return tx.vente.create({
        data: {
          id: id || undefined,
          boutiqueId: req.boutiqueId,
          produitId,
          categorieId: produit.categorieId,
          nomProduit: produit.nom,
          prixVente: produit.prixVente,
          prixAchat: produit.prixAchat,
          benefice: produit.prixVente - produit.prixAchat,
          vendeurNom,
          date: dateVente
        }
      })
    })

    return res.status(201).json(vente)
  } catch (err) {
    console.error('Create vente error:', err)
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Vente déjà enregistrée' })
    }
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

// GET /api/ventes/stats/boss
export async function getBossStats(req, res) {
  try {
    const boutiqueId = req.boutiqueId
    const { periode = 'month' } = req.query

    const now = new Date()
    const from = new Date()
    if (periode === 'week') from.setDate(now.getDate() - 7)
    else if (periode === 'month') from.setDate(now.getDate() - 30)
    else from.setFullYear(2000) // all

    const where = { boutiqueId, date: { gte: from } }

    // Stats générales
    const [aggregate, topCategories, ventesByDay] = await Promise.all([
      prisma.vente.aggregate({
        where,
        _sum: { prixVente: true, benefice: true },
        _count: true
      }),

      // Top catégories
      prisma.vente.groupBy({
        by: ['categorieId'],
        where,
        _sum: { prixVente: true, benefice: true },
        _count: true,
        orderBy: { _sum: { benefice: 'desc' } },
        take: 5
      }),

      // Ventes par jour (7 derniers jours)
      prisma.$queryRaw`
        SELECT
          DATE(date) as jour,
          COUNT(*) as count,
          SUM("prixVente") as ca,
          SUM(benefice) as benefice
        FROM ventes
        WHERE "boutiqueId" = ${boutiqueId}
          AND date >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(date)
        ORDER BY jour ASC
      `
    ])

    // Enrichir top catégories avec les noms
    const topCatsEnriched = await Promise.all(
      topCategories.map(async (tc) => {
        const cat = await prisma.categorie.findUnique({
          where: { id: tc.categorieId },
          select: { nom: true }
        })
        return { ...tc, nomCategorie: cat?.nom || 'Inconnu' }
      })
    )

    return res.json({
      totalCA: aggregate._sum.prixVente || 0,
      totalBenefice: aggregate._sum.benefice || 0,
      totalVentes: aggregate._count,
      topCategories: topCatsEnriched,
      ventesByDay
    })
  } catch (err) {
    console.error('Boss stats error:', err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
