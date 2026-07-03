/**
 * BoutiK Backend — Endpoint pull complet
 * Retourne toutes les données d'une boutique pour sync descendante
 * GET /api/sync/pull
 */
import prisma from '../config/database.js'

export async function pullData(req, res) {
  try {
    const boutiqueId = req.boutiqueId

    const [boutique, categories, produits, ventes] = await Promise.all([
      prisma.boutique.findUnique({
        where: { id: boutiqueId },
        select: {
          id: true, nom: true, whatsapp: true,
          adresse: true, logo: true, siteWeb: true,
          bloquee: true, createdAt: true
        }
      }),
      prisma.categorie.findMany({
        where: { boutiqueId },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.produit.findMany({
        where: { boutiqueId },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.vente.findMany({
        where: { boutiqueId },
        orderBy: { date: 'asc' }
      })
    ])

    return res.json({ boutique, categories, produits, ventes })
  } catch (err) {
    console.error('Pull error:', err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
