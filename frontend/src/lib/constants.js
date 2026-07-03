export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const WHATSAPP_SUPPORT = '22665189025';
export const WHATSAPP_SUPPORT_DISPLAY = '+226 65 18 90 25';

export function waLink(numero, message = '') {
  const clean = (numero || '').replace(/\D/g, '');
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${clean}${text}`;
}

export const DEVISES = ['FCFA', 'XOF', 'GNF', 'XAF', 'USD', 'EUR'];

export const CATEGORIES_DEPENSE = [
  { value: 'stock', label: 'Stock' },
  { value: 'transport', label: 'Transport' },
  { value: 'loyer', label: 'Loyer' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'salaire', label: 'Salaire' },
  { value: 'autre', label: 'Autre' },
];

export const SYNC_INTERVAL_MS = 5000;
export const STOCK_FAIBLE_SEUIL = 3;

export function formatMontant(n, devise = 'FCFA') {
  return `${Number(n || 0).toLocaleString('fr-FR')} ${devise}`;
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(date) {
  return new Date(date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
