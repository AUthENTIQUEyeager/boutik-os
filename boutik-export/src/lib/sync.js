/**
 * BoutiK - Service de Synchronisation
 * Sync automatique toutes les 5 secondes quand internet disponible
 */
import { getSyncQueue, clearSyncItem, getSession } from './db'
import { apiSync, apiLoginOrRegister, hasApiUrl, hasToken } from './api'

const SYNC_INTERVAL = 5000 // 5 secondes

let syncInterval = null
let isSyncing = false
let listeners = []

export const syncService = {
  // Démarrer la synchronisation automatique
  start() {
    if (syncInterval) return
    syncInterval = setInterval(() => {
      if (navigator.onLine) this.sync()
    }, SYNC_INTERVAL)

    window.addEventListener('online', () => {
      this.notifyListeners('online')
      this.sync()
    })
    window.addEventListener('offline', () => {
      this.notifyListeners('offline')
    })
  },

  // Arrêter la synchronisation
  stop() {
    if (syncInterval) {
      clearInterval(syncInterval)
      syncInterval = null
    }
  },

  // Synchronisation manuelle
  async sync() {
    if (isSyncing || !navigator.onLine) return
    if (!hasApiUrl()) return // Pas de backend configuré

    isSyncing = true
    this.notifyListeners('syncing')

    try {
      const queue = await getSyncQueue()
      if (queue.length === 0) {
        this.notifyListeners('synced')
        return
      }

      // S'assurer qu'on a un token valide (login/register auto si besoin)
      const ok = await ensureToken()
      if (!ok) {
        this.notifyListeners('error')
        return
      }

      // Envoyer toute la file en une seule requête (idempotent côté backend)
      const result = await apiSync(queue)

      // Retirer les éléments traités avec succès
      const failedIds = new Set((result.errors || []).map(e => e.id))
      for (const item of queue) {
        if (!failedIds.has(item.id)) {
          await clearSyncItem(item.id)
        }
      }

      if (result.errors?.length) {
        console.warn('Éléments non synchronisés :', result.errors)
      }

      this.notifyListeners('synced', { count: queue.length - (result.errors?.length || 0) })
    } catch (err) {
      console.warn('Sync error:', err.message)
      this.notifyListeners('error', err)
    } finally {
      isSyncing = false
    }
  },

  // Abonnement aux événements de sync
  subscribe(listener) {
    listeners.push(listener)
    return () => {
      listeners = listeners.filter(l => l !== listener)
    }
  },

  notifyListeners(event, data) {
    listeners.forEach(l => l(event, data))
  },

  isOnline() {
    return navigator.onLine
  },

  isSyncing() {
    return isSyncing
  }
}

// S'assure qu'un token backend valide existe.
// Si absent (ex: boutique créée hors-ligne), tente une connexion
// automatique avec les identifiants stockés localement.
async function ensureToken() {
  if (hasToken()) return true

  const session = await getSession()
  if (!session?.whatsapp || !session?.password) return false

  try {
    await apiLoginOrRegister(session.nom || '', session.whatsapp, session.password)
    return hasToken()
  } catch (err) {
    console.warn('Impossible d\'obtenir un token :', err.message)
    return false
  }
}
