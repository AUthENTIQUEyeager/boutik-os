/**
 * BoutiK - Context global
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getCurrentSession, logout as authLogout } from '../lib/auth'
import { getBoutique, getDashboardStats } from '../lib/db'
import { syncService } from '../lib/sync'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [session, setSession] = useState(null)
  const [boutique, setBoutique] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState('idle')
  const [lastSync, setLastSync] = useState(null)
  const checkInterval = useRef(null)

  useEffect(() => {
    initSession()
    syncService.start()
    const unsub = syncService.subscribe((event) => {
      setSyncStatus(event)
      if (event === 'synced') {
        setLastSync(new Date())
        setTimeout(() => setSyncStatus('idle'), 3000)
      }
    })
    return () => { unsub(); syncService.stop(); clearInterval(checkInterval.current) }
  }, [])

  // Vérifier le statut bloqué toutes les 30 secondes
  useEffect(() => {
    if (!session?.boutiqueId) return
    checkInterval.current = setInterval(() => {
      if (navigator.onLine) checkBlocage()
    }, 30000)
    return () => clearInterval(checkInterval.current)
  }, [session])

  async function checkBlocage() {
    try {
      const token = localStorage.getItem('boutik_token')
      if (!token || !API_URL) return
      const res = await fetch(`${API_URL}/api/boutique`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.status === 403) {
        const data = await res.json()
        if (data.bloquee) {
          setBoutique(prev => prev ? { ...prev, bloquee: true } : prev)
        }
        return
      }
      if (res.ok) {
        const data = await res.json()
        setBoutique(prev => prev ? { ...prev, bloquee: data.bloquee || false } : prev)
      }
    } catch {}
  }

  async function initSession() {
    try {
      const sess = await getCurrentSession()
      if (sess) {
        setSession(sess)
        if (sess.boutiqueId) {
          const b = await getBoutique(sess.boutiqueId)
          const boutiqueData = await fetchBoutiqueStatus(b)
          setBoutique(boutiqueData)
          await refreshStats(sess.boutiqueId)
        }
      }
    } catch (err) {
      console.error('Erreur init session:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchBoutiqueStatus(localBoutique) {
    if (!API_URL || !navigator.onLine) return localBoutique
    try {
      const token = localStorage.getItem('boutik_token')
      if (!token) return localBoutique
      const res = await fetch(`${API_URL}/api/boutique`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.status === 403) {
        return { ...localBoutique, bloquee: true }
      }
      if (res.ok) {
        const data = await res.json()
        return { ...localBoutique, bloquee: data.bloquee || false }
      }
    } catch {}
    return localBoutique
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
    const boutiqueData = await fetchBoutiqueStatus(b)
    setBoutique(boutiqueData)
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
      session, boutique, stats, loading,
      syncStatus, lastSync,
      isOnline: navigator.onLine,
      login, logout, updateBoutique, refreshStats, manualSync
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
