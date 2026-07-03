/**
 * BoutiK — Service PWA Install Tracking
 * Détection fiable + stats pour le dashboard admin
 * Stocké dans localStorage uniquement (pas IndexedDB, pas de sync)
 */

const KEYS = {
  installed:      'pwa_installed',
  platform:       'pwa_platform',       // 'android' | 'ios' | 'desktop'
  installDate:    'pwa_install_date',
  visits:         'pwa_visits',
  browserVisits:  'pwa_browser_visits', // visites hors standalone
  dismissed:      'pwa_dismissed',
  promptShown:    'pwa_prompt_shown',
}

// ─── Détection ────────────────────────────────────────────────────────────────

export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  )
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
}

export function isAndroid() {
  return /android/i.test(navigator.userAgent)
}

export function getPlatform() {
  if (isIOS()) return 'ios'
  if (isAndroid()) return 'android'
  return 'desktop'
}

export function isInstalled() {
  return isStandalone() || localStorage.getItem(KEYS.installed) === 'true'
}

// ─── Enregistrement ───────────────────────────────────────────────────────────

export function recordVisit() {
  const visits = parseInt(localStorage.getItem(KEYS.visits) || '0') + 1
  localStorage.setItem(KEYS.visits, visits)

  if (!isStandalone()) {
    const bv = parseInt(localStorage.getItem(KEYS.browserVisits) || '0') + 1
    localStorage.setItem(KEYS.browserVisits, bv)
    localStorage.setItem(KEYS.platform, getPlatform())
  }

  return visits
}

export function recordInstall(platform) {
  localStorage.setItem(KEYS.installed, 'true')
  localStorage.setItem(KEYS.platform, platform || getPlatform())
  localStorage.setItem(KEYS.installDate, new Date().toISOString())

  // Envoyer stats au serveur admin si possible
  reportInstallToServer(platform || getPlatform())
}

export function recordDismissed() {
  localStorage.setItem(KEYS.dismissed, 'true')
}

export function wasDismissed() {
  return localStorage.getItem(KEYS.dismissed) === 'true'
}

export function getBrowserVisits() {
  return parseInt(localStorage.getItem(KEYS.browserVisits) || '0')
}

export function getVisits() {
  return parseInt(localStorage.getItem(KEYS.visits) || '0')
}

// ─── Report au serveur admin ──────────────────────────────────────────────────
// Stocké dans localStorage admin-side pour agrégation

export function reportInstallToServer(platform) {
  try {
    const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
    if (!API_URL) return
    // Fire-and-forget — pas bloquant
    fetch(`${API_URL}/api/pwa/install`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform,
        date: new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 150)
      })
    }).catch(() => {}) // silencieux si offline
  } catch {}
}

export function reportVisitToServer() {
  try {
    const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
    if (!API_URL) return
    fetch(`${API_URL}/api/pwa/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: getPlatform(),
        isInstalled: isInstalled(),
        date: new Date().toISOString()
      })
    }).catch(() => {})
  } catch {}
}
