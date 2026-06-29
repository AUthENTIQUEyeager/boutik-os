/**
 * BoutiK - Authentification
 * Backend d'abord si en ligne, IndexedDB en fallback offline
 */
import {
  findBoutiqueByWhatsapp,
  createBoutique,
  saveSession,
  getSession,
  clearSession,
} from './db'
import { apiLogout, hasApiUrl } from './api'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export async function login(nomBoutique, whatsapp, motDePasse) {

  // ── Backend d'abord si en ligne ──────────────────────────────────────────
  if (hasApiUrl() && navigator.onLine) {
    try {
      const result = await loginViaBackend(nomBoutique, whatsapp, motDePasse)
      if (result) return result
    } catch (err) {
      console.warn('Backend injoignable, fallback local:', err.message)
    }
  }

  // ── Fallback IndexedDB offline ───────────────────────────────────────────
  return loginViaLocal(nomBoutique, whatsapp, motDePasse)
}

async function loginViaBackend(nomBoutique, whatsapp, motDePasse) {
  // 1. Essayer login
  const loginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ whatsapp, password: motDePasse })
  })
  const loginData = await loginRes.json()

  if (loginRes.ok) {
    // Connexion réussie
    if (loginData.token) localStorage.setItem('boutik_token', loginData.token)
    const boutique = await syncBoutiqueLocale(loginData.boutique, motDePasse)
    await saveSession({ boutiqueId: boutique.id, role: 'gerant', whatsapp, password: motDePasse })
    return { success: true, boutique, isNew: false }
  }

  // 2. Si 401 "Aucune boutique" → register
  if (loginRes.status === 401 || loginRes.status === 404) {
    const registerRes = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom: nomBoutique, whatsapp, password: motDePasse })
    })
    const registerData = await registerRes.json()

    if (registerRes.ok) {
      if (registerData.token) localStorage.setItem('boutik_token', registerData.token)
      const boutique = await syncBoutiqueLocale(registerData.boutique, motDePasse)
      await saveSession({ boutiqueId: boutique.id, role: 'gerant', whatsapp, password: motDePasse })
      return { success: true, boutique, isNew: true }
    }

    // Register échoue (ex: déjà existant mais mauvais mdp)
    return { success: false, error: registerData.error || 'Erreur de connexion' }
  }

  // 3. Autre erreur backend (500, etc.)
  return { success: false, error: loginData.error || 'Erreur serveur' }
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

async function loginViaLocal(nomBoutique, whatsapp, motDePasse) {
  const boutique = await findBoutiqueByWhatsapp(whatsapp)

  if (!boutique) {
    const nouvelle = await createBoutique({
      nom: nomBoutique,
      whatsapp,
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
