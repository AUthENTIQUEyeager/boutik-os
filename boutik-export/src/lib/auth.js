/**
 * BoutiK — Authentification
 * Deux modes :
 * - Nouvelle boutique : register backend + créer local
 * - Boutique existante : login backend + pull complet des données
 */
import {
  findBoutiqueByWhatsapp, createBoutique,
  saveSession, getSession, clearSession,
} from './db'
import { apiLogout, hasApiUrl } from './api'
import { pullFromBackend } from './pull'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

// ─── LOGIN NOUVELLE BOUTIQUE ──────────────────────────────────────────────────
// Essaie login (si compte existe) ou register (si nouveau)

export async function login(nomBoutique, whatsapp, motDePasse) {
  if (hasApiUrl() && navigator.onLine) {
    try {
      return await loginViaBackend(nomBoutique, whatsapp, motDePasse, false)
    } catch (err) {
      console.warn('Backend injoignable, fallback local:', err.message)
    }
  }
  return loginViaLocal(nomBoutique, whatsapp, motDePasse)
}

// ─── LOGIN BOUTIQUE EXISTANTE ─────────────────────────────────────────────────
// Login strict + pull complet des données

export async function loginExistant(whatsapp, motDePasse) {
  if (!hasApiUrl() || !navigator.onLine) {
    // Offline : essayer IndexedDB
    return loginViaLocal('', whatsapp, motDePasse)
  }

  try {
    const result = await loginViaBackend('', whatsapp, motDePasse, true)
    return result
  } catch (err) {
    return { success: false, error: 'Impossible de contacter le serveur. Vérifiez votre connexion.' }
  }
}

// ─── BACKEND AUTH ─────────────────────────────────────────────────────────────

async function loginViaBackend(nomBoutique, whatsapp, motDePasse, existantOnly) {

  // 1. Tenter login
  const loginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ whatsapp, password: motDePasse })
  })
  const loginData = await loginRes.json()

  if (loginRes.ok) {
    // Connexion réussie → sauvegarder token
    if (loginData.token) localStorage.setItem('boutik_token', loginData.token)

    // Pull complet des données depuis le backend
    const pullResult = await pullFromBackend(loginData.token)
    console.log('Pull result:', pullResult)

    // Récupérer ou créer la boutique locale
    const boutique = await syncBoutiqueLocale(loginData.boutique, motDePasse)

    await saveSession({
      boutiqueId: boutique.id,
      role: 'gerant',
      whatsapp,
      password: motDePasse
    })

    return {
      success: true,
      boutique,
      isNew: false,
      pulled: pullResult.counts
    }
  }

  // Si mode "existant seulement" et boutique introuvable
  if (existantOnly) {
    if (loginRes.status === 401) {
      const msg = loginData.error || ''
      if (msg.includes('Aucune') || msg.includes('introuvable')) {
        return { success: false, error: 'Aucune boutique trouvée avec ce numéro WhatsApp' }
      }
      return { success: false, error: 'Mot de passe incorrect' }
    }
    return { success: false, error: loginData.error || 'Erreur de connexion' }
  }

  // Mode normal : si boutique introuvable → register
  if (loginRes.status === 401) {
    const msg = loginData.error || ''
    if (msg.includes('Aucune') || msg.includes('introuvable')) {
      return await registerViaBackend(nomBoutique, whatsapp, motDePasse)
    }
    return { success: false, error: 'Mot de passe incorrect' }
  }

  return { success: false, error: loginData.error || 'Erreur serveur' }
}

async function registerViaBackend(nomBoutique, whatsapp, motDePasse) {
  const regRes = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nom: nomBoutique, whatsapp, password: motDePasse })
  })
  const regData = await regRes.json()

  if (!regRes.ok) return { success: false, error: regData.error || 'Erreur lors de la création' }

  if (regData.token) localStorage.setItem('boutik_token', regData.token)
  const boutique = await syncBoutiqueLocale(regData.boutique, motDePasse)
  await saveSession({ boutiqueId: boutique.id, role: 'gerant', whatsapp, password: motDePasse })
  return { success: true, boutique, isNew: true }
}

// ─── LOCAL AUTH ───────────────────────────────────────────────────────────────

async function loginViaLocal(nomBoutique, whatsapp, motDePasse) {
  const boutique = await findBoutiqueByWhatsapp(whatsapp)

  if (!boutique) {
    if (!nomBoutique) return { success: false, error: 'Boutique introuvable hors ligne' }
    const nouvelle = await createBoutique({
      nom: nomBoutique, whatsapp,
      motDePasse: hashPassword(motDePasse),
      adresse: '', logo: null, siteWeb: null
    })
    await saveSession({ boutiqueId: nouvelle.id, role: 'gerant', whatsapp, password: motDePasse })
    return { success: true, boutique: nouvelle, isNew: true }
  }

  if (boutique.motDePasse !== hashPassword(motDePasse)) {
    return { success: false, error: 'Mot de passe incorrect' }
  }

  await saveSession({ boutiqueId: boutique.id, role: 'gerant', whatsapp, password: motDePasse })
  return { success: true, boutique, isNew: false }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function syncBoutiqueLocale(remoteBoutique, motDePasse) {
  if (!remoteBoutique) throw new Error('Données boutique manquantes')
  let local = await findBoutiqueByWhatsapp(remoteBoutique.whatsapp)
  if (!local) {
    local = await createBoutique({
      id: remoteBoutique.id,
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

export async function getCurrentSession() { return getSession() }

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
