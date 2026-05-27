/**
 * BoutiK - Couche IndexedDB
 * Gère tout le stockage local offline-first
 */
import { openDB } from 'idb'

const DB_NAME = 'boutik-db'
const DB_VERSION = 1

let dbInstance = null

export async function getDB() {
  if (dbInstance) return dbInstance

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Boutiques
      if (!db.objectStoreNames.contains('boutiques')) {
        const s = db.createObjectStore('boutiques', { keyPath: 'id' })
        s.createIndex('whatsapp', 'whatsapp', { unique: true })
      }

      // Catégories de produits
      if (!db.objectStoreNames.contains('categories')) {
        const s = db.createObjectStore('categories', { keyPath: 'id' })
        s.createIndex('boutiqueId', 'boutiqueId')
        s.createIndex('synced', 'synced')
      }

      // Produits individuels (chaque unité)
      if (!db.objectStoreNames.contains('produits')) {
        const s = db.createObjectStore('produits', { keyPath: 'id' })
        s.createIndex('categorieId', 'categorieId')
        s.createIndex('boutiqueId', 'boutiqueId')
        s.createIndex('vendu', 'vendu')
        s.createIndex('synced', 'synced')
      }

      // Ventes
      if (!db.objectStoreNames.contains('ventes')) {
        const s = db.createObjectStore('ventes', { keyPath: 'id' })
        s.createIndex('boutiqueId', 'boutiqueId')
        s.createIndex('date', 'date')
        s.createIndex('synced', 'synced')
      }

      // File de synchronisation
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true })
      }

      // Session active
      if (!db.objectStoreNames.contains('session')) {
        db.createObjectStore('session', { keyPath: 'key' })
      }
    }
  })

  return dbInstance
}

// ─── SESSION ────────────────────────────────────────────────────────────────

export async function saveSession(data) {
  const db = await getDB()
  await db.put('session', { key: 'current', ...data })
}

export async function getSession() {
  const db = await getDB()
  return db.get('session', 'current')
}

export async function clearSession() {
  const db = await getDB()
  await db.delete('session', 'current')
}

// ─── BOUTIQUES ───────────────────────────────────────────────────────────────

export async function createBoutique(data) {
  const db = await getDB()
  const boutique = {
    id: generateId('BTK'),
    ...data,
    createdAt: new Date().toISOString(),
    synced: false
  }
  await db.put('boutiques', boutique)
  await addToSyncQueue('create', 'boutique', boutique)
  return boutique
}

export async function getBoutique(id) {
  const db = await getDB()
  return db.get('boutiques', id)
}

export async function updateBoutique(id, updates) {
  const db = await getDB()
  const existing = await db.get('boutiques', id)
  const updated = { ...existing, ...updates, synced: false, updatedAt: new Date().toISOString() }
  await db.put('boutiques', updated)
  await addToSyncQueue('update', 'boutique', updated)
  return updated
}

export async function getAllBoutiques() {
  const db = await getDB()
  return db.getAll('boutiques')
}

export async function findBoutiqueByWhatsapp(whatsapp) {
  const db = await getDB()
  return db.getFromIndex('boutiques', 'whatsapp', whatsapp)
}

// ─── CATÉGORIES ──────────────────────────────────────────────────────────────

export async function createCategorie(boutiqueId, data) {
  const db = await getDB()
  const prefix = generatePrefix(data.nom)
  const categorie = {
    id: generateId(prefix),
    boutiqueId,
    ...data,
    prefix,
    createdAt: new Date().toISOString(),
    synced: false
  }
  await db.put('categories', categorie)

  // Créer les produits individuels
  const produits = []
  for (let i = 1; i <= data.quantite; i++) {
    const produit = {
      id: `${prefix}-${String(i).padStart(4, '0')}`,
      categorieId: categorie.id,
      boutiqueId,
      nom: data.nom,
      prixAchat: data.prixAchat,
      prixVente: data.prixVente,
      vendu: false,
      createdAt: new Date().toISOString(),
      synced: false
    }
    await db.put('produits', produit)
    produits.push(produit)
  }

  await addToSyncQueue('create', 'categorie', { categorie, produits })
  return { categorie, produits }
}

export async function getCategoriesByBoutique(boutiqueId) {
  const db = await getDB()
  return db.getAllFromIndex('categories', 'boutiqueId', boutiqueId)
}

export async function updateCategorie(id, updates) {
  const db = await getDB()
  const existing = await db.get('categories', id)
  const updated = { ...existing, ...updates, synced: false, updatedAt: new Date().toISOString() }
  await db.put('categories', updated)
  await addToSyncQueue('update', 'categorie', updated)
  return updated
}

export async function deleteCategorie(id) {
  const db = await getDB()
  const db2 = await getDB()
  // Supprimer les produits non vendus de cette catégorie
  const produits = await db.getAllFromIndex('produits', 'categorieId', id)
  for (const p of produits) {
    if (!p.vendu) await db2.delete('produits', p.id)
  }
  await db.delete('categories', id)
  await addToSyncQueue('delete', 'categorie', { id })
}

// ─── PRODUITS ─────────────────────────────────────────────────────────────────

export async function getProduitsByBoutique(boutiqueId) {
  const db = await getDB()
  return db.getAllFromIndex('produits', 'boutiqueId', boutiqueId)
}

export async function getProduitsByCategorie(categorieId) {
  const db = await getDB()
  return db.getAllFromIndex('produits', 'categorieId', categorieId)
}

export async function getProduit(id) {
  const db = await getDB()
  return db.get('produits', id)
}

// ─── VENTES ───────────────────────────────────────────────────────────────────

export async function enregistrerVente(boutiqueId, produitId, vendeur = 'Gérant') {
  const db = await getDB()
  const produit = await db.get('produits', produitId)
  if (!produit || produit.vendu) throw new Error('Produit non disponible')

  const vente = {
    id: generateId('VNT'),
    boutiqueId,
    produitId,
    categorieId: produit.categorieId,
    nomProduit: produit.nom,
    prixVente: produit.prixVente,
    prixAchat: produit.prixAchat,
    benefice: produit.prixVente - produit.prixAchat,
    vendeur,
    date: new Date().toISOString(),
    synced: false
  }

  // Marquer produit vendu
  const produitMaj = { ...produit, vendu: true, dateVente: vente.date, synced: false }
  await db.put('produits', produitMaj)
  await db.put('ventes', vente)
  await addToSyncQueue('create', 'vente', vente)

  return vente
}

export async function getVentesByBoutique(boutiqueId) {
  const db = await getDB()
  return db.getAllFromIndex('ventes', 'boutiqueId', boutiqueId)
}

export async function getVentesAujourdhui(boutiqueId) {
  const ventes = await getVentesByBoutique(boutiqueId)
  const today = new Date().toDateString()
  return ventes.filter(v => new Date(v.date).toDateString() === today)
}

// ─── STATISTIQUES ────────────────────────────────────────────────────────────

export async function getDashboardStats(boutiqueId) {
  const [categories, produits, ventes] = await Promise.all([
    getCategoriesByBoutique(boutiqueId),
    getProduitsByBoutique(boutiqueId),
    getVentesByBoutique(boutiqueId)
  ])

  const today = new Date().toDateString()
  const ventesAujourdhui = ventes.filter(v => new Date(v.date).toDateString() === today)
  const produitsDisponibles = produits.filter(p => !p.vendu)
  const produitsFaibleStock = []

  // Calculer stock faible par catégorie (< 3 restants)
  for (const cat of categories) {
    const restants = produits.filter(p => p.categorieId === cat.id && !p.vendu)
    if (restants.length <= 3 && restants.length > 0) {
      produitsFaibleStock.push({ ...cat, stockRestant: restants.length })
    }
  }

  return {
    beneficeJour: ventesAujourdhui.reduce((s, v) => s + v.benefice, 0),
    ventesJour: ventesAujourdhui.length,
    stockTotal: produitsDisponibles.length,
    totalCategories: categories.length,
    produitsFaibleStock,
    dernieresVentes: ventes.slice(-10).reverse(),
    beneficeTotal: ventes.reduce((s, v) => s + v.benefice, 0),
    ventesTotal: ventes.length
  }
}

// ─── SYNC QUEUE ───────────────────────────────────────────────────────────────

export async function addToSyncQueue(action, entity, data) {
  const db = await getDB()
  await db.add('sync_queue', {
    action,
    entity,
    data,
    timestamp: new Date().toISOString(),
    attempts: 0
  })
}

export async function getSyncQueue() {
  const db = await getDB()
  return db.getAll('sync_queue')
}

export async function clearSyncItem(id) {
  const db = await getDB()
  await db.delete('sync_queue', id)
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
}

function generatePrefix(nom) {
  // Générer un préfixe de 3 lettres depuis le nom
  const clean = nom.replace(/[^a-zA-Z]/g, '').toUpperCase()
  return clean.length >= 3 ? clean.substr(0, 3) : clean.padEnd(3, 'X')
}
