/**
 * BoutiK — Authentification
 * login()         → TOUJOURS register (nouvelle boutique)
 * loginExistant() → login strict + pull données
 */
import {
  findBoutiqueByWhatsapp, createBoutique,
  saveSession, getSession, clearSession,
} from './db'
import { apiLogout, hasApiUrl } from './api'
import { pullFromBackend } from './pull'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

// ─── NOUVELLE BOUTIQUE — toujours register ────────────────────────────────────

export async function login(nomBoutique, whatsapp, motDePasse) {
  if (hasApiUrl() && navigator.onLine) {
    try {
      // Appeler directement register — pas de login, c'est une nouvelle boutique
      const regRes = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: nomBoutique, whatsapp, password: motDePasse })
      })
      const regData = await regRes.json()

      if (regRes.ok) {
        if (regData.token) localStorage.setItem('boutik_token', regData.token)
        const boutique = await syncBoutiqueLocale(regData.boutique, motDePasse)
        await saveSession({ boutiqueId: boutique.id, role: 'gerant', whatsapp, password: motDePasse })
        return { success: true, boutique, isNew: true }
      }

      // Numéro déjà utilisé
      if (regRes.status === 409) {
        return { success: false, error: 'Ce numéro WhatsApp est déjà associé à une boutique. Utilisez "J\'ai déjà une boutique".' }
      }

      return { success: false, error: regData.error || 'Erreur lors de la création' }

    } catch (err) {
      console.warn('Backend injoignable, création locale:', err.message)
    }
  }

  // Fallback offline — créer localement
  return createLocale(nomBoutique, whatsapp, motDePasse)
}

// ─── BOUTIQUE EXISTANTE — login strict + pull ─────────────────────────────────

export async function loginExistant(whatsapp, motDePasse) {
  if (!hasApiUrl() || !navigator.onLine) {
    // Offline : chercher dans IndexedDB
    return loginLocale(whatsapp, motDePasse)
  }

  try {
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsapp, password: motDePasse })
    })
    const loginData = await loginRes.json()

    if (!loginRes.ok) {
      if (loginRes.status === 404 || (loginData.error || '').includes('Aucune')) {
        return { success: false, error: 'Aucune boutique trouvée avec ce numéro WhatsApp' }
      }
      return { success: false, error: loginData.error || 'Mot de passe incorrect' }
    }

    if (loginData.token) localStorage.setItem('boutik_token', loginData.token)

    // Pull complet des données
    const pullResult = await pullFromBackend(loginData.token)

    const boutique = await syncBoutiqueLocale(loginData.boutique, motDePasse)
    await saveSession({ boutiqueId: boutique.id, role: 'gerant', whatsapp, password: motDePasse })

    return {
      success: true,
      boutique,
      isNew: false,
      pulled: pullResult.counts
    }
  } catch (err) {
    console.error('loginExistant error:', err)
    return { success: false, error: 'Impossible de contacter le serveur. Vérifiez votre connexion.' }
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function createLocale(nomBoutique, whatsapp, motDePasse) {
  const existing = await findBoutiqueByWhatsapp(whatsapp)
  if (existing) {
    return { success: false, error: 'Ce numéro est déjà utilisé. Utilisez "J\'ai déjà une boutique".' }
  }
  const nouvelle = await createBoutique({
    nom: nomBoutique, whatsapp,
    motDePasse: hashPassword(motDePasse),
    adresse: '', logo: null, siteWeb: null
  })
  await saveSession({ boutiqueId: nouvelle.id, role: 'gerant', whatsapp, password: motDePasse })
  return { success: true, boutique: nouvelle, isNew: true }
}

async function loginLocale(whatsapp, motDePasse) {
  const boutique = await findBoutiqueByWhatsapp(whatsapp)
  if (!boutique) return { success: false, error: 'Boutique introuvable hors ligne' }
  if (boutique.motDePasse !== hashPassword(motDePasse)) {
    return { success: false, error: 'Mot de passe incorrect' }
  }
  await saveSession({ boutiqueId: boutique.id, role: 'gerant', whatsapp, password: motDePasse })
  return { success: true, boutique, isNew: false }
}

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
