/**
 * BoutiK — Fonctions DB pour Dettes et Dépenses
 * Utilise getDB() de db.js (même instance, pas de conflit de version)
 */
import { getDB } from './db'

function genId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
}

// ═══════════════════════════════════════════════════════════════════
// DETTES
// ═══════════════════════════════════════════════════════════════════

export async function creerDette(boutiqueId, data) {
  const db = await getDB()
  const dette = {
    id: genId('DET'),
    boutiqueId,
    nomClient: data.nomClient,
    telephone: data.telephone || '',
    montantTotal: data.montantTotal,
    montantPaye: 0,
    solde: data.montantTotal,
    statut: 'en_cours',
    description: data.description || '',
    venteId: data.venteId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  await db.put('dettes', dette)
  return dette
}

export async function getDettes(boutiqueId) {
  const db = await getDB()
  return db.getAllFromIndex('dettes', 'boutiqueId', boutiqueId)
}

export async function getDette(id) {
  const db = await getDB()
  return db.get('dettes', id)
}

export async function ajouterPaiement(detteId, montant) {
  const db = await getDB()
  const dette = await db.get('dettes', detteId)
  if (!dette) throw new Error('Dette introuvable')

  const paiement = {
    id: genId('PAY'),
    detteId,
    montant,
    date: new Date().toISOString(),
  }
  await db.put('paiements_dette', paiement)

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
  const db = await getDB()
  return db.getAllFromIndex('paiements_dette', 'detteId', detteId)
}

export async function supprimerDette(id) {
  const db = await getDB()
  const paiements = await db.getAllFromIndex('paiements_dette', 'detteId', id)
  for (const p of paiements) await db.delete('paiements_dette', p.id)
  await db.delete('dettes', id)
}

// ═══════════════════════════════════════════════════════════════════
// DÉPENSES
// ═══════════════════════════════════════════════════════════════════

export const CATEGORIES_DEPENSES = [
  { value: 'stock',       label: 'Réapprovisionnement stock' },
  { value: 'transport',   label: 'Transport' },
  { value: 'loyer',       label: 'Loyer' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'salaire',     label: 'Salaire' },
  { value: 'autre',       label: 'Autre' },
]

export async function creerDepense(boutiqueId, data) {
  const db = await getDB()
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
  const db = await getDB()
  return db.getAllFromIndex('depenses', 'boutiqueId', boutiqueId)
}

export async function supprimerDepense(id) {
  const db = await getDB()
  await db.delete('depenses', id)
}
