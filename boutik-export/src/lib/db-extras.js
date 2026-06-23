/**
 * BoutiK — Module IndexedDB additionnel
 * Dettes clients + Dépenses
 * N'importe RIEN de db.js, gère sa propre upgrade via DB_VERSION bump
 */
import { openDB } from 'idb'

const DB_NAME = 'boutik-db'
const DB_VERSION = 2  // Version 1 = db.js, Version 2 = ce fichier

let dbInstance = null

export async function getExtDB() {
  if (dbInstance) return dbInstance

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // ── Stores existants (version 1) ──
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains('boutiques')) {
          const s = db.createObjectStore('boutiques', { keyPath: 'id' })
          s.createIndex('whatsapp', 'whatsapp', { unique: true })
        }
        if (!db.objectStoreNames.contains('categories')) {
          const s = db.createObjectStore('categories', { keyPath: 'id' })
          s.createIndex('boutiqueId', 'boutiqueId')
          s.createIndex('synced', 'synced')
        }
        if (!db.objectStoreNames.contains('produits')) {
          const s = db.createObjectStore('produits', { keyPath: 'id' })
          s.createIndex('categorieId', 'categorieId')
          s.createIndex('boutiqueId', 'boutiqueId')
          s.createIndex('vendu', 'vendu')
          s.createIndex('synced', 'synced')
        }
        if (!db.objectStoreNames.contains('ventes')) {
          const s = db.createObjectStore('ventes', { keyPath: 'id' })
          s.createIndex('boutiqueId', 'boutiqueId')
          s.createIndex('date', 'date')
          s.createIndex('synced', 'synced')
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true })
        }
        if (!db.objectStoreNames.contains('session')) {
          db.createObjectStore('session', { keyPath: 'key' })
        }
      }

      // ── Nouveaux stores (version 2) ──
      if (oldVersion < 2) {
        // Dettes clients
        if (!db.objectStoreNames.contains('dettes')) {
          const s = db.createObjectStore('dettes', { keyPath: 'id' })
          s.createIndex('boutiqueId', 'boutiqueId')
          s.createIndex('statut', 'statut')
        }
        // Paiements partiels sur dettes
        if (!db.objectStoreNames.contains('paiements_dette')) {
          const s = db.createObjectStore('paiements_dette', { keyPath: 'id' })
          s.createIndex('detteId', 'detteId')
        }
        // Dépenses
        if (!db.objectStoreNames.contains('depenses')) {
          const s = db.createObjectStore('depenses', { keyPath: 'id' })
          s.createIndex('boutiqueId', 'boutiqueId')
          s.createIndex('date', 'date')
          s.createIndex('categorie', 'categorie')
        }
      }
    }
  })

  return dbInstance
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function genId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
}

// ═══════════════════════════════════════════════════════════════════
// DETTES
// ═══════════════════════════════════════════════════════════════════

export async function creerDette(boutiqueId, data) {
  const db = await getExtDB()
  const dette = {
    id: genId('DET'),
    boutiqueId,
    nomClient: data.nomClient,
    telephone: data.telephone || '',
    montantTotal: data.montantTotal,
    montantPaye: 0,
    solde: data.montantTotal,
    statut: 'en_cours', // en_cours | paye
    description: data.description || '',
    venteId: data.venteId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  await db.put('dettes', dette)
  return dette
}

export async function getDettes(boutiqueId) {
  const db = await getExtDB()
  return db.getAllFromIndex('dettes', 'boutiqueId', boutiqueId)
}

export async function getDette(id) {
  const db = await getExtDB()
  return db.get('dettes', id)
}

export async function ajouterPaiement(detteId, montant) {
  const db = await getExtDB()
  const dette = await db.get('dettes', detteId)
  if (!dette) throw new Error('Dette introuvable')

  // Enregistrer le paiement
  const paiement = {
    id: genId('PAY'),
    detteId,
    montant,
    date: new Date().toISOString(),
  }
  await db.put('paiements_dette', paiement)

  // Mettre à jour la dette
  const nouveauPaye = dette.montantPaye + montant
  const nouveauSolde = Math.max(0, dette.montantTotal - nouveauPaye)
  const detteMAJ = {
    ...dette,
    montantPaye: nouveauPaye,
    solde: nouveauSolde,
    statut: nouveauSolde === 0 ? 'paye' : 'en_cours',
    updatedAt: new Date().toISOString(),
  }
  await db.put('dettes', detteMAJ)
  return { dette: detteMAJ, paiement }
}

export async function getPaiementsDette(detteId) {
  const db = await getExtDB()
  return db.getAllFromIndex('paiements_dette', 'detteId', detteId)
}

export async function supprimerDette(id) {
  const db = await getExtDB()
  const paiements = await db.getAllFromIndex('paiements_dette', 'detteId', id)
  for (const p of paiements) await db.delete('paiements_dette', p.id)
  await db.delete('dettes', id)
}

export async function getStatsDetttes(boutiqueId) {
  const dettes = await getDettes(boutiqueId)
  return {
    total: dettes.length,
    enCours: dettes.filter(d => d.statut === 'en_cours').length,
    totalDu: dettes.filter(d => d.statut === 'en_cours').reduce((s, d) => s + d.solde, 0),
    totalRecu: dettes.reduce((s, d) => s + d.montantPaye, 0),
  }
}

// ═══════════════════════════════════════════════════════════════════
// DÉPENSES
// ═══════════════════════════════════════════════════════════════════

export const CATEGORIES_DEPENSES = [
  { value: 'stock',      label: 'Réapprovisionnement stock' },
  { value: 'transport',  label: 'Transport' },
  { value: 'loyer',      label: 'Loyer' },
  { value: 'electricite',label: 'Électricité' },
  { value: 'salaire',    label: 'Salaire' },
  { value: 'autre',      label: 'Autre' },
]

export async function creerDepense(boutiqueId, data) {
  const db = await getExtDB()
  const depense = {
    id: genId('DEP'),
    boutiqueId,
    montant: data.montant,
    categorie: data.categorie,
    description: data.description || '',
    date: new Date().toISOString(),
  }
  await db.put('depenses', depense)
  return depense
}

export async function getDepenses(boutiqueId) {
  const db = await getExtDB()
  return db.getAllFromIndex('depenses', 'boutiqueId', boutiqueId)
}

export async function supprimerDepense(id) {
  const db = await getExtDB()
  await db.delete('depenses', id)
}

export async function getStatsDepenses(boutiqueId) {
  const depenses = await getDepenses(boutiqueId)
  const now = new Date()
  const today = depenses.filter(d => new Date(d.date).toDateString() === now.toDateString())
  const thisMonth = depenses.filter(d => {
    const dd = new Date(d.date)
    return dd.getMonth() === now.getMonth() && dd.getFullYear() === now.getFullYear()
  })
  return {
    totalJour: today.reduce((s, d) => s + d.montant, 0),
    totalMois: thisMonth.reduce((s, d) => s + d.montant, 0),
    totalGlobal: depenses.reduce((s, d) => s + d.montant, 0),
    parCategorie: CATEGORIES_DEPENSES.map(cat => ({
      ...cat,
      total: depenses.filter(d => d.categorie === cat.value).reduce((s, d) => s + d.montant, 0)
    }))
  }
}
