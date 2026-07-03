import { openDB } from 'idb';

const DB_NAME = 'boutik-db';
const DB_VERSION = 2;

// IMPORTANT : un seul fichier gère l'ouverture d'IndexedDB avec DB_VERSION.
// Ne jamais ouvrir IndexedDB depuis un autre fichier avec une version différente.
let dbInstance = null;

const STORES = [
  'boutiques',
  'categories',
  'produits',
  'ventes',
  'clients',
  'salaries',
  'commandes',
  'depenses',
  'dettes',
  'paiements_dette',
  'sync_queue',
  'session',
];

export async function getDB() {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id', autoIncrement: store === 'sync_queue' });
        }
      }
    },
  });
  return dbInstance;
}

// Vide entièrement la base locale (login/logout) pour l'isolation par compte.
export async function clearAllData() {
  dbInstance = null;
  const db = await getDB();
  const storeNames = [...db.objectStoreNames];
  const tx = db.transaction(storeNames, 'readwrite');
  await Promise.all(storeNames.map((s) => tx.objectStore(s).clear()));
  await tx.done;
}

export async function getAll(store) {
  const db = await getDB();
  return db.getAll(store);
}

export async function getOne(store, id) {
  const db = await getDB();
  return db.get(store, id);
}

export async function put(store, value) {
  const db = await getDB();
  return db.put(store, value);
}

export async function putMany(store, values) {
  const db = await getDB();
  const tx = db.transaction(store, 'readwrite');
  await Promise.all(values.map((v) => tx.store.put(v)));
  await tx.done;
}

export async function remove(store, id) {
  const db = await getDB();
  return db.delete(store, id);
}

export async function addToQueue(op) {
  const db = await getDB();
  return db.add('sync_queue', { ...op, createdAt: new Date().toISOString() });
}

export async function getQueue() {
  const db = await getDB();
  return db.getAll('sync_queue');
}

export async function clearQueueItems(ids) {
  const db = await getDB();
  const tx = db.transaction('sync_queue', 'readwrite');
  await Promise.all(ids.map((id) => tx.store.delete(id)));
  await tx.done;
}

export async function getSessionValue(key) {
  const db = await getDB();
  const row = await db.get('session', key);
  return row?.value;
}

export async function setSessionValue(key, value) {
  const db = await getDB();
  return db.put('session', { id: key, value });
}
