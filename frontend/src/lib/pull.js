import { api } from './api';
import { putMany, getSessionValue, setSessionValue } from './db';

const LAST_SYNC_KEY = 'lastSync';

// Pull complet : utilisé à la connexion, après avoir vidé IndexedDB.
export async function pullComplet() {
  const data = await api.syncPull();
  await applyPull(data);
  return data;
}

// Pull différentiel : utilisé toutes les 5s, ne récupère que les nouveautés.
export async function pullDifferentiel() {
  const since = await getSessionValue(LAST_SYNC_KEY);
  const data = await api.syncPull(since);
  await applyPull(data);
  return data;
}

async function applyPull(data) {
  const mapping = {
    categories: 'categories',
    produits: 'produits',
    ventes: 'ventes',
    clients: 'clients',
    salaries: 'salaries',
    commandes: 'commandes',
    depenses: 'depenses',
    dettes: 'dettes',
  };

  for (const [key, store] of Object.entries(mapping)) {
    if (Array.isArray(data[key]) && data[key].length) {
      await putMany(store, data[key]);
    }
  }

  if (data.pulledAt) {
    await setSessionValue(LAST_SYNC_KEY, data.pulledAt);
  }
}
