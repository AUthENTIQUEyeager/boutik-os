/**
 * BoutiK - Service API
 * Centralise tous les appels vers le backend Render
 */

const API_URL = import.meta.env.VITE_API_URL || ''

// Helper fetch avec token JWT
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

// ─── AUTH ────────────────────────────────────────────────────────────────────

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

export async function apiLogout() {
  localStorage.removeItem('boutik_token')
  localStorage.removeItem('boutik_admin_token')
}

// ─── ADMIN ───────────────────────────────────────────────────────────────────

export async function apiAdminLogin(password) {
  const res = await fetch(`${API_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Accès refusé')
  if (data.token) localStorage.setItem('boutik_admin_token', data.token)
  return data
}

export async function apiGetAllBoutiques() {
  const token = localStorage.getItem('boutik_admin_token')
  const res = await fetch(`${API_URL}/api/admin/boutiques`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur')
  return data
}

export async function apiGetGlobalStats() {
  const token = localStorage.getItem('boutik_admin_token')
  const res = await fetch(`${API_URL}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur')
  return data
}

export async function apiBloquerBoutique(id) {
  const token = localStorage.getItem('boutik_admin_token')
  const res = await fetch(`${API_URL}/api/admin/boutiques/${id}/bloquer`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

export async function apiDebloquerBoutique(id) {
  const token = localStorage.getItem('boutik_admin_token')
  const res = await fetch(`${API_URL}/api/admin/boutiques/${id}/debloquer`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
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
  return !!import.meta.env.VITE_API_URL
}