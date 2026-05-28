/**
 * BoutiK - Service de Synchronisation
 * Sync automatique toutes les 5 secondes quand internet disponible
 */
import { getSyncQueue, clearSyncItem } from './db'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.boutik.app'
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

    isSyncing = true
    this.notifyListeners('syncing')

    try {
      const queue = await getSyncQueue()
      if (queue.length === 0) {
        this.notifyListeners('synced')
        return
      }

      // En prod : envoyer au vrai backend
      // Pour l'instant : simulation
      for (const item of queue) {
        try {
          // await sendToAPI(item)
          await simulateAPICall(item)
          await clearSyncItem(item.id)
        } catch (err) {
          console.warn('Sync item failed:', err)
        }
      }

      this.notifyListeners('synced', { count: queue.length })
    } catch (err) {
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

// Simulation d'appel API (remplacer par vrais appels en prod)
async function simulateAPICall(item) {
  await new Promise(resolve => setTimeout(resolve, 50))
  return { success: true }
}

// Vrai appel API (décommenter quand backend prêt)
async function sendToAPI(item) {
  const res = await fetch(`${API_BASE}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  })
  if (!res.ok) throw new Error(`Sync failed: ${res.status}`)
  return res.json()
}
