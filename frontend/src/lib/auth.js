import { api, setApiToken } from './api';
import { clearAllData } from './db';
import { syncService } from './sync';
import { pullComplet } from './pull';

const TOKEN_KEY = 'boutik_token';
const ADMIN_TOKEN_KEY = 'boutik_admin_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function initAuth() {
  const token = getToken();
  if (token) {
    setApiToken(token);
    syncService.setToken(token);
  }
}

export async function login(whatsapp, password) {
  const { token, boutique } = await api.login({ whatsapp, password });
  await clearAllData();
  localStorage.setItem(TOKEN_KEY, token);
  setApiToken(token);
  syncService.setToken(token);
  await pullComplet();
  return boutique;
}

export async function register(nom, whatsapp, password, adresse) {
  const { token, boutique } = await api.register({ nom, whatsapp, password, adresse });
  await clearAllData();
  localStorage.setItem(TOKEN_KEY, token);
  setApiToken(token);
  syncService.setToken(token);
  return boutique;
}

export async function logout() {
  syncService.stop();
  await clearAllData();
  localStorage.removeItem(TOKEN_KEY);
  setApiToken(null);
  window.location.href = '/login';
}

export async function adminLogin(password) {
  const { token } = await api.adminLogin(password);
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  return token;
}

export function adminLogout() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  window.location.href = '/admin/login';
}
