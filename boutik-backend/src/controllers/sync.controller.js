/**
 * BoutiK - Contrôleur Synchronisation
 * Reçoit la file d'attente IndexedDB et synchronise avec PostgreSQL
 */
import prisma from '../config/database.js'
import { createCategorie } from './categories.controller.js'
import { createVente } from './ventes.controller.js'

// POST /api/sync
// Reçoit un tableau d'actions depuis le client offline
export async function sync(req, res) {
  try {
    const { queue } = req.body // Array de { action, entity, data, timestamp }

    if (!Array.isArray(queue) || queue.length === 0) {
      return res.json({ success: true, processed: 0, errors: [] })
    }

    const results = []
    const errors = []

    for (const item of queue) {
      try {
        const result = await processItem(req.boutiqueId, item)
        results.push({ id: item.id, success: true, result })
      } catch (err) {
        errors.push({ id: item.id, error: err.message })
      }
    }

    return res.json({
      success: true,
      processed: results.length,
      errors,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('Sync error:', err)
    return res.status(500).json({ error: 'Erreur de synchronisation' })
  }
}

async function processItem(boutiqueId, item) {
  const { action, entity, data } = item

  switch (entity) {
    case 'boutique':
      return syncBoutique(boutiqueId, action, data)

    case 'categorie':
      return syncCategorie(boutiqueId, action, data)

    case 'vente':
      return syncVente(boutiqueId, action, data)

    default:
      throw new Error(`Entité inconnue : ${entity}`)
  }
}

async function syncBoutique(boutiqueId, action, data) {
  if (action === 'update') {
    return prisma.boutique.update({
      where: { id: boutiqueId },
      data: { nom: data.nom, adresse: data.adresse, logo: data.logo }
    })
  }
}

async function syncCategorie(boutiqueId, action, data) {
  if (action === 'create') {
    const { categorie, produits } = data

    // Upsert catégorie
    await prisma.categorie.upsert({
      where: { id: categorie.id },
      update: {},
      create: {
        id: categorie.id,
        boutiqueId,
        nom: categorie.nom,
        prefix: categorie.prefix,
        prixAchat: categorie.prixAchat,
        prixVente: categorie.prixVente,
        quantite: categorie.quantite,
        createdAt: new Date(categorie.createdAt)
      }
    })

    // Upsert produits
    for (const p of produits) {
      await prisma.produit.upsert({
        where: { id: p.id },
        update: {},
        create: {
          id: p.id,
          boutiqueId,
          categorieId: categorie.id,
          nom: p.nom,
          prixAchat: p.prixAchat,
          prixVente: p.prixVente,
          vendu: false,
          createdAt: new Date(p.createdAt)
        }
      })
    }

    return { synced: true }
  }

  if (action === 'delete') {
    await prisma.categorie.deleteMany({
      where: { id: data.id, boutiqueId }
    })
    return { deleted: true }
  }
}

async function syncVente(boutiqueId, action, data) {
  if (action === 'create') {
    // Vérifier que le produit existe
    const produit = await prisma.produit.findFirst({
      where: { id: data.produitId, boutiqueId }
    })

    if (!produit) throw new Error(`Produit ${data.produitId} introuvable`)

    // Upsert vente (idempotent)
    await prisma.$transaction(async (tx) => {
      await tx.produit.update({
        where: { id: data.produitId },
        data: { vendu: true, dateVente: new Date(data.date) }
      })

      await tx.vente.upsert({
        where: { id: data.id },
        update: {},
        create: {
          id: data.id,
          boutiqueId,
          produitId: data.produitId,
          categorieId: data.categorieId,
          nomProduit: data.nomProduit,
          prixVente: data.prixVente,
          prixAchat: data.prixAchat,
          benefice: data.benefice,
          vendeurNom: data.vendeur || 'Gérant',
          date: new Date(data.date)
        }
      })
    })

    return { synced: true }
  }
}

// GET /api/sync/status
export async function getSyncStatus(req, res) {
  try {
    const boutiqueId = req.boutiqueId
    const [categories, produits, ventes] = await Promise.all([
      prisma.categorie.count({ where: { boutiqueId } }),
      prisma.produit.count({ where: { boutiqueId } }),
      prisma.vente.count({ where: { boutiqueId } })
    ])

    return res.json({
      serverTimestamp: new Date().toISOString(),
      counts: { categories, produits, ventes }
    })
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
