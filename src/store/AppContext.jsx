/**
 * BoutiK - Context global de l'application
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getCurrentSession, logout as authLogout } from '../lib/auth'
import { getBoutique, getDashboardStats } from '../lib/db'
import { syncService } from '../lib/sync'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [session, setSession] = useState(null)
  const [boutique, setBoutique] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState('idle') // idle | syncing | synced | error | offline | online
  const [lastSync, setLastSync] = useState(null)

  // Initialiser la session
  useEffect(() => {
    initSession()
    syncService.start()

    const unsub = syncService.subscribe((event, data) => {
      setSyncStatus(event)
      if (event === 'synced') {
        setLastSync(new Date())
        setTimeout(() => setSyncStatus('idle'), 3000)
      }
    })

    return () => {
      unsub()
      syncService.stop()
    }
  }, [])

  async function initSession() {
    try {
      const sess = await getCurrentSession()
      if (sess) {
        setSession(sess)
        if (sess.boutiqueId) {
          const b = await getBoutique(sess.boutiqueId)
          setBoutique(b)
          await refreshStats(sess.boutiqueId)
        }
      }
    } catch (err) {
      console.error('Erreur init session:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshStats = useCallback(async (boutiqueId) => {
    try {
      const s = await getDashboardStats(boutiqueId || session?.boutiqueId)
      setStats(s)
    } catch (err) {
      console.error('Erreur stats:', err)
    }
  }, [session])

  const login = useCallback(async (sess, b) => {
    setSession(sess)
    setBoutique(b)
    if (b) await refreshStats(b.id)
  }, [refreshStats])

  const logout = useCallback(async () => {
    await authLogout()
    setSession(null)
    setBoutique(null)
    setStats(null)
  }, [])

  const updateBoutique = useCallback((updates) => {
    setBoutique(prev => ({ ...prev, ...updates }))
  }, [])

  const manualSync = useCallback(async () => {
    await syncService.sync()
  }, [])

  return (
    <AppContext.Provider value={{
      session,
      boutique,
      stats,
      loading,
      syncStatus,
      lastSync,
      isOnline: navigator.onLine,
      login,
      logout,
      updateBoutique,
      refreshStats,
      manualSync
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp doit être utilisé dans AppProvider')
  return ctx
}
