/**
 * BoutiK - Contrôleur Catégories
 */
import prisma from '../config/database.js'

function generatePrefix(nom) {
  const clean = nom.replace(/[^a-zA-Z]/g, '').toUpperCase()
  return clean.length >= 3 ? clean.substr(0, 3) : clean.padEnd(3, 'X')
}

// GET /api/categories
export async function getCategories(req, res) {
  try {
    const categories = await prisma.categorie.findMany({
      where: { boutiqueId: req.boutiqueId },
      include: {
        _count: {
          select: {
            produits: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Enrichir avec le stock disponible
    const enriched = await Promise.all(categories.map(async (cat) => {
      const dispo = await prisma.produit.count({
        where: { categorieId: cat.id, vendu: false }
      })
      const vendu = await prisma.produit.count({
        where: { categorieId: cat.id, vendu: true }
      })
      return { ...cat, stockDisponible: dispo, stockVendu: vendu }
    }))

    return res.json(enriched)
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

// POST /api/categories
export async function createCategorie(req, res) {
  try {
    const { id, nom, prixAchat, prixVente, quantite, createdAt } = req.body

    if (!nom || !prixAchat || !prixVente || !quantite) {
      return res.status(400).json({ error: 'Tous les champs sont requis' })
    }

    if (prixVente <= prixAchat) {
      return res.status(400).json({ error: 'Le prix de vente doit être supérieur au prix d\'achat' })
    }

    const prefix = generatePrefix(nom)

    // Créer catégorie et produits dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      const categorie = await tx.categorie.create({
        data: {
          id: id || undefined,
          boutiqueId: req.boutiqueId,
          nom,
          prefix,
          prixAchat,
          prixVente,
          quantite,
          createdAt: createdAt ? new Date(createdAt) : undefined
        }
      })

      // Créer les produits individuels
      const produitsData = []
      for (let i = 1; i <= quantite; i++) {
        produitsData.push({
          id: `${prefix}-${String(i).padStart(4, '0')}`,
          boutiqueId: req.boutiqueId,
          categorieId: categorie.id,
          nom,
          prixAchat,
          prixVente,
          createdAt: createdAt ? new Date(createdAt) : undefined
        })
      }

      await tx.produit.createMany({ data: produitsData, skipDuplicates: true })

      return { categorie, produitsCount: produitsData.length }
    })

    return res.status(201).json(result)
  } catch (err) {
    console.error('Create categorie error:', err)
    return res.status(500).json({ error: 'Erreur lors de la création' })
  }
}

// PUT /api/categories/:id
export async function updateCategorie(req, res) {
  try {
    const { id } = req.params
    const { nom, prixAchat, prixVente } = req.body

    const categorie = await prisma.categorie.findFirst({
      where: { id, boutiqueId: req.boutiqueId }
    })
    if (!categorie) return res.status(404).json({ error: 'Catégorie introuvable' })

    const updated = await prisma.categorie.update({
      where: { id },
      data: { nom, prixAchat, prixVente }
    })

    return res.json(updated)
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

// DELETE /api/categories/:id
export async function deleteCategorie(req, res) {
  try {
    const { id } = req.params

    const categorie = await prisma.categorie.findFirst({
      where: { id, boutiqueId: req.boutiqueId }
    })
    if (!categorie) return res.status(404).json({ error: 'Catégorie introuvable' })

    // Vérifier qu'il n'y a pas de ventes liées
    const ventesCount = await prisma.vente.count({ where: { categorieId: id } })
    if (ventesCount > 0) {
      return res.status(400).json({
        error: `Impossible de supprimer : ${ventesCount} vente(s) liée(s) à cette catégorie`
      })
    }

    await prisma.$transaction([
      prisma.produit.deleteMany({ where: { categorieId: id, vendu: false } }),
      prisma.categorie.delete({ where: { id } })
    ])

    return res.json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
