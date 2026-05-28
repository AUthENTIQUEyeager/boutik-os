/**
 * BoutiK - Layout principal avec navigation bas
 */
import { NavLink, useLocation } from 'react-router-dom'
import { useApp } from '../../store/AppContext'

const NAV_ITEMS = [
  { path: '/', label: 'Accueil', icon: HomeIcon },
  { path: '/ventes', label: 'Ventes', icon: SalesIcon },
  { path: '/stock', label: 'Stock', icon: BoxIcon },
  { path: '/parametres', label: 'Réglages', icon: SettingsIcon },
]

export default function Layout({ children }) {
  const { boutique, syncStatus, isOnline, manualSync } = useApp()
  const location = useLocation()

  const syncLabel = {
    syncing: 'Sync...',
    synced: 'Synchronisé',
    error: 'Erreur sync',
    offline: 'Hors ligne',
    online: 'En ligne',
    idle: ''
  }[syncStatus] || ''

  return (
    <div className="min-h-screen bg-paper-soft flex flex-col max-w-md mx-auto relative">
      {/* Header */}
      <header className="bg-white border-b border-paper-border px-4 h-14 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-ink rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">B</span>
          </div>
          <span className="font-semibold text-ink text-sm">
            {boutique?.nom || 'BoutiK'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Indicateur sync */}
          {syncLabel && (
            <span className="text-xs text-ink-muted">{syncLabel}</span>
          )}
          {/* Indicateur online/offline */}
          <button
            onClick={manualSync}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-paper-soft transition-colors"
          >
            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-accent-success' : 'bg-accent-danger'}`} />
            <span className="text-xs text-ink-muted">{isOnline ? 'En ligne' : 'Hors ligne'}</span>
          </button>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 overflow-auto pb-20">
        {children}
      </main>

      {/* Navigation bas */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-paper-border shadow-nav z-40">
        <div className="flex">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-2 transition-colors ${
                  isActive ? 'text-ink' : 'text-ink-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-6 h-6 ${isActive ? 'text-ink' : 'text-ink-muted'}`}>
                    <Icon />
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? 'text-ink' : 'text-ink-muted'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
        {/* Safe area pour mobiles avec notch */}
        <div className="h-safe-bottom bg-white" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
      </nav>
    </div>
  )
}

// ─── ICÔNES SVG ──────────────────────────────────────────────────────────────

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-full h-full">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function SalesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-full h-full">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  )
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-full h-full">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-full h-full">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}
