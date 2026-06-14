/**
 * BoutiK - Service API
 * Centralise tous les appels vers le backend Render
 */

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

// Helper fetch avec token JWT boutique
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('boutik_token')

  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Erreur serveur')
  }

  return data
}

// ─── AUTH BOUTIQUE ───────────────────────────────────────────────────────────

export async function apiLogin(whatsapp, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ whatsapp, password })
  })
  if (data.token) localStorage.setItem('boutik_token', data.token)
  return data
}

export async function apiRegister(nom, whatsapp, password) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nom, whatsapp, password })
  })
  if (data.token) localStorage.setItem('boutik_token', data.token)
  return data
}

// Essaie de se connecter sur le backend ; si la boutique n'existe pas
// encore en ligne (créée hors-ligne), la crée automatiquement.
export async function apiLoginOrRegister(nom, whatsapp, password) {
  try {
    return await apiLogin(whatsapp, password)
  } catch (err) {
    const msg = err.message || ''
    if (msg.includes('Aucune') || msg.includes('introuvable')) {
      return apiRegister(nom, whatsapp, password)
    }
    throw err
  }
}

export function apiLogout() {
  localStorage.removeItem('boutik_token')
  localStorage.removeItem('boutik_admin_token')
}

export function hasToken() {
  return !!localStorage.getItem('boutik_token')
}

// ─── BOUTIQUE ────────────────────────────────────────────────────────────────

export async function apiGetStats() {
  return apiFetch('/boutique/stats')
}

export async function apiUpdateBoutique(data) {
  return apiFetch('/boutique', { method: 'PUT', body: JSON.stringify(data) })
}

// ─── SYNC ────────────────────────────────────────────────────────────────────

export async function apiSync(queue) {
  return apiFetch('/sync', {
    method: 'POST',
    body: JSON.stringify({ queue })
  })
}

export function hasApiUrl() {
  return !!API_URL
}
