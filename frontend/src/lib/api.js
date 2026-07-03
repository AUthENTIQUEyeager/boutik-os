import { API_URL } from './constants';

let authToken = null;

export function setApiToken(token) {
  authToken = token;
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // réponse vide
  }

  if (!res.ok) {
    const error = new Error(data?.error || `Erreur ${res.status}`);
    error.status = res.status;
    error.bloquee = data?.bloquee || false;
    throw error;
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),
  changePassword: (payload) => request('/auth/password', { method: 'PUT', body: payload }),
  adminLogin: (password) => request('/admin/login', { method: 'POST', body: { password } }),

  getBoutique: () => request('/boutique'),
  updateBoutique: (payload) => request('/boutique', { method: 'PUT', body: payload }),
  getStats: () => request('/boutique/stats'),

  getCategories: () => request('/categories'),
  createCategorie: (payload) => request('/categories', { method: 'POST', body: payload }),
  updateCategorie: (id, payload) => request(`/categories/${id}`, { method: 'PUT', body: payload }),
  deleteCategorie: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
  getProduits: (params = {}) => request(`/produits?${new URLSearchParams(params)}`),

  getVentes: (params = {}) => request(`/ventes?${new URLSearchParams(params)}`),
  createVente: (payload) => request('/ventes', { method: 'POST', body: payload }),
  getBossStats: (periode) => request(`/ventes/stats/boss?periode=${periode}`),

  getClients: () => request('/clients'),
  createClient: (payload) => request('/clients', { method: 'POST', body: payload }),
  updateClient: (id, payload) => request(`/clients/${id}`, { method: 'PUT', body: payload }),
  deleteClient: (id) => request(`/clients/${id}`, { method: 'DELETE' }),
  getClientHistorique: (id) => request(`/clients/${id}/historique`),

  getSalaries: () => request('/salaries'),
  createSalarie: (payload) => request('/salaries', { method: 'POST', body: payload }),
  updateSalarie: (id, payload) => request(`/salaries/${id}`, { method: 'PUT', body: payload }),

  getCommandes: () => request('/commandes'),
  createCommande: (payload) => request('/commandes', { method: 'POST', body: payload }),
  updateCommandeStatut: (id, statut) => request(`/commandes/${id}/statut`, { method: 'PUT', body: { statut } }),

  getDepenses: (params = {}) => request(`/depenses?${new URLSearchParams(params)}`),
  createDepense: (payload) => request('/depenses', { method: 'POST', body: payload }),
  deleteDepense: (id) => request(`/depenses/${id}`, { method: 'DELETE' }),

  getDettes: () => request('/dettes'),
  createDette: (payload) => request('/dettes', { method: 'POST', body: payload }),
  addPaiementDette: (id, montant) => request(`/dettes/${id}/paiement`, { method: 'POST', body: { montant } }),

  syncPush: (queue) => request('/sync', { method: 'POST', body: { queue } }),
  syncPull: (since) => request(`/sync/pull${since ? `?since=${encodeURIComponent(since)}` : ''}`),

  trackInstall: (platform) => request('/pwa/install', { method: 'POST', body: { platform } }),
  trackVisit: (platform, isInstalled) => request('/pwa/visit', { method: 'POST', body: { platform, isInstalled } }),

  importProduits: (csv) => request('/import/produits', { method: 'POST', body: { csv } }),
  importClients: (csv) => request('/import/clients', { method: 'POST', body: { csv } }),

  getAdminBoutiques: () => request('/admin/boutiques'),
  bloquerBoutique: (id) => request(`/admin/boutiques/${id}/bloquer`, { method: 'PUT' }),
  debloquerBoutique: (id) => request(`/admin/boutiques/${id}/debloquer`, { method: 'PUT' }),
  getAdminStats: () => request('/admin/stats'),
  getAdminPwaStats: () => request('/admin/pwa/stats'),
};
