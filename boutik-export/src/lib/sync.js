/**
 * BoutiK - Service de Synchronisation
 */
import { getSyncQueue, clearSyncItem, getSession } from './db'
import { apiSync, apiLoginOrRegister, hasApiUrl, hasToken } from './api'

const SYNC_INTERVAL = 5000

let syncInterval = null
let isSyncing = false
let listeners = []

export const syncService = {
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

  stop() {
    if (syncInterval) {
      clearInterval(syncInterval)
      syncInterval = null
    }
  },

  async sync() {
    if (isSyncing || !navigator.onLine) return
    if (!hasApiUrl()) return

    isSyncing = true
    this.notifyListeners('syncing')

    try {
      const queue = await getSyncQueue()
      if (queue.length === 0) {
        this.notifyListeners('synced')
        return
      }

      const ok = await ensureToken()
      if (!ok) {
        this.notifyListeners('error')
        return
      }

      const result = await apiSync(queue)
      const failedIds = new Set((result.errors || []).map(e => e.id))
      for (const item of queue) {
        if (!failedIds.has(item.id)) {
          await clearSyncItem(item.id)
        }
      }

      this.notifyListeners('synced', { count: queue.length - (result.errors?.length || 0) })
    } catch (err) {
      console.warn('Sync error:', err.message)
      this.notifyListeners('error', err)
    } finally {
      isSyncing = false
    }
  },

  subscribe(listener) {
    listeners.push(listener)
    return () => {
      listeners = listeners.filter(l => l !== listener)
    }
  },

  notifyListeners(event, data) {
    listeners.forEach(l => l(event, data))
  },

  isOnline() { return navigator.onLine },
  isSyncing() { return isSyncing }
}

async function ensureToken() {
  if (hasToken()) return true
  const session = await getSession()
  if (!session?.whatsapp || !session?.password) return false
  try {
    await apiLoginOrRegister(session.nom || '', session.whatsapp, session.password)
    return hasToken()
  } catch {
    return false
  }
}
