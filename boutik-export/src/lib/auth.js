/**
 * BoutiK - Authentification
 * Logique : Backend d'abord (si en ligne), IndexedDB en fallback offline
 */
import {
  findBoutiqueByWhatsapp,
  createBoutique,
  saveSession,
  getSession,
  clearSession,
  getBoutique
} from './db'
import { apiLogout, hasApiUrl } from './api'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

// ─── LOGIN PRINCIPAL ──────────────────────────────────────────────────────────

export async function login(nomBoutique, whatsapp, motDePasse) {

  // ── 1. Essayer le backend si en ligne ────────────────────────────────────
  if (hasApiUrl() && navigator.onLine) {
    try {
      const result = await loginViaBackend(nomBoutique, whatsapp, motDePasse)
      if (result.success) return result
      // Si le backend répond "mot de passe incorrect" → ne pas créer localement
      if (result.error === 'Mot de passe incorrect') {
        return { success: false, error: 'Mot de passe incorrect' }
      }
    } catch (err) {
      // Backend injoignable → fallback local
      console.warn('Backend injoignable, fallback IndexedDB:', err.message)
    }
  }

  // ── 2. Fallback IndexedDB (offline) ─────────────────────────────────────
  return loginViaLocal(nomBoutique, whatsapp, motDePasse)
}

// ─── LOGIN VIA BACKEND ───────────────────────────────────────────────────────

async function loginViaBackend(nomBoutique, whatsapp, motDePasse) {
  // Essayer login d'abord
  let res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ whatsapp, password: motDePasse })
  })

  let data = await res.json()
  let isNew = false

  // Si boutique n'existe pas → register
  if (!res.ok && (data.error?.includes('Aucune') || data.error?.includes('introuvable') || res.status === 404)) {
    const regRes = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom: nomBoutique, whatsapp, password: motDePasse })
    })
    data = await regRes.json()
    if (!regRes.ok) throw new Error(data.error || 'Erreur register')
    isNew = true
  } else if (!res.ok) {
    return { success: false, error: data.error || 'Erreur de connexion' }
  }

  // Sauvegarder le token JWT
  if (data.token) localStorage.setItem('boutik_token', data.token)

  // Synchroniser la boutique dans IndexedDB local
  const boutique = await syncBoutiqueLocale(data.boutique, motDePasse)

  await saveSession({
    boutiqueId: boutique.id,
    role: 'gerant',
    whatsapp,
    password: motDePasse
  })

  return { success: true, boutique, isNew }
}

// ─── LOGIN VIA INDEXEDDB (offline) ───────────────────────────────────────────

async function loginViaLocal(nomBoutique, whatsapp, motDePasse) {
  const boutique = await findBoutiqueByWhatsapp(whatsapp)

  if (!boutique) {
    // Créer localement (sera sync quand internet revient)
    const nouvelle = await createBoutique({
      nom: nomBoutique,
      whatsapp,
      motDePasse: hashPassword(motDePasse),
      adresse: '',
      logo: null,
      siteWeb: null
    })
    await saveSession({
      boutiqueId: nouvelle.id,
      role: 'gerant',
      whatsapp,
      password: motDePasse
    })
    return { success: true, boutique: nouvelle, isNew: true }
  }

  if (boutique.motDePasse !== hashPassword(motDePasse)) {
    return { success: false, error: 'Mot de passe incorrect' }
  }

  await saveSession({
    boutiqueId: boutique.id,
    role: 'gerant',
    whatsapp,
    password: motDePasse
  })
  return { success: true, boutique, isNew: false }
}

// ─── SYNC BOUTIQUE LOCALE ────────────────────────────────────────────────────
// Crée ou met à jour la boutique dans IndexedDB avec les données du backend

async function syncBoutiqueLocale(remoteBoutique, motDePasse) {
  if (!remoteBoutique) throw new Error('Données boutique manquantes')

  // Chercher par WhatsApp (l'ID backend peut différer de l'ID local)
  let local = await findBoutiqueByWhatsapp(remoteBoutique.whatsapp)

  if (!local) {
    // Créer localement avec l'ID du backend
    local = await createBoutique({
      id: remoteBoutique.id, // utiliser l'ID backend comme référence
      nom: remoteBoutique.nom,
      whatsapp: remoteBoutique.whatsapp,
      motDePasse: hashPassword(motDePasse),
      adresse: remoteBoutique.adresse || '',
      logo: remoteBoutique.logo || null,
      siteWeb: remoteBoutique.siteWeb || null,
      bloquee: remoteBoutique.bloquee || false,
    })
  }

  return local
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export async function getCurrentSession() {
  return getSession()
}

export async function logout() {
  apiLogout()
  await clearSession()
}

function hashPassword(password) {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) - hash) + password.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(36)
}
