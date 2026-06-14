/**
 * BoutiK - Authentification & Seed Data
 */
import {
  findBoutiqueByWhatsapp,
  createBoutique,
  saveSession,
  getSession,
  clearSession,
  createCategorie,
  getBoutique
} from './db'
import { apiLoginOrRegister, apiLogout, hasApiUrl } from './api'

// ─── AUTH ────────────────────────────────────────────────────────────────────

export async function login(nomBoutique, whatsapp, motDePasse) {
  const boutique = await findBoutiqueByWhatsapp(whatsapp)
  let result

  if (!boutique) {
    // Première connexion : créer la boutique localement (offline-first)
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
      // Stocké localement uniquement, pour reconnexion auto au backend
      password: motDePasse
    })
    result = { success: true, boutique: nouvelle, isNew: true }
  } else {
    if (boutique.motDePasse !== hashPassword(motDePasse)) {
      return { success: false, error: 'Mot de passe incorrect' }
    }
    await saveSession({
      boutiqueId: boutique.id,
      role: 'gerant',
      whatsapp,
      password: motDePasse
    })
    result = { success: true, boutique, isNew: false }
  }

  // Synchronisation immédiate avec le backend si en ligne
  if (hasApiUrl() && navigator.onLine) {
    try {
      await apiLoginOrRegister(nomBoutique, whatsapp, motDePasse)
    } catch (err) {
      // Pas bloquant : l'app fonctionne offline,
      // sync.js réessaiera dès que possible
      console.warn('Sync backend différée :', err.message)
    }
  }

  return result
}

export async function loginAdmin(password) {
  if (password === 'boutik-admin-2024') {
    await saveSession({ boutiqueId: null, role: 'admin' })
    return { success: true }
  }
  return { success: false, error: 'Accès refusé' }
}

export async function getCurrentSession() {
  return getSession()
}

export async function logout() {
  apiLogout()
  await clearSession()
}

function hashPassword(password) {
  // Simple hash pour demo - en prod utiliser bcrypt côté serveur
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) - hash) + password.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(36)
}

// ─── SEED DATA ───────────────────────────────────────────────────────────────

export async function seedDemoData(boutiqueId) {
  const categories = [
    { nom: 'Maillots Real Madrid', prixAchat: 4000, prixVente: 6000, quantite: 15 },
    { nom: 'Pantalons Jeans', prixAchat: 5000, prixVente: 8500, quantite: 10 },
    { nom: 'Chemises Batik', prixAchat: 2500, prixVente: 4500, quantite: 20 },
    { nom: 'Sandales Cuir', prixAchat: 3000, prixVente: 5500, quantite: 8 },
    { nom: 'Sacs à main', prixAchat: 6000, prixVente: 10000, quantite: 5 },
  ]

  for (const cat of categories) {
    await createCategorie(boutiqueId, cat)
  }
}
