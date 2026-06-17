/**
 * BoutiK — Layout principal v2
 */
import { NavLink } from 'react-router-dom'
import { useApp } from '../../store/AppContext'
import {
  LayoutDashboard, ShoppingCart, Package, History, Settings,
  Wifi, WifiOff, RefreshCw, CheckCircle2
} from 'lucide-react'

const NAV = [
  { path: '/',           label: 'Accueil',    Icon: LayoutDashboard },
  { path: '/ventes',     label: 'Ventes',     Icon: ShoppingCart },
  { path: '/stock',      label: 'Stock',      Icon: Package },
  { path: '/parametres', label: 'Réglages',   Icon: Settings },
]

export default function Layout({ children }) {
  const { boutique, syncStatus, isOnline, manualSync } = useApp()

  const syncIcon = {
    syncing: <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />,
    synced:  <CheckCircle2 className="w-3 h-3 text-brand" />,
  }[syncStatus] || null

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative">

      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand rounded-[10px] flex items-center justify-center shadow-brand shadow-sm">
            <span className="text-white text-sm font-bold">B</span>
          </div>
          <span className="font-semibold text-slate-900 text-sm tracking-tight">
            {boutique?.nom || 'BoutiK'}
          </span>
        </div>

        <button
          onClick={manualSync}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          {syncIcon}
          <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-brand' : 'bg-red-400'}`} />
          <span className="text-xs text-slate-500">{isOnline ? 'En ligne' : 'Hors ligne'}</span>
        </button>
      </header>

      {/* ── Contenu ── */}
      <main className="flex-1 overflow-auto pb-20">
        {children}
      </main>

      {/* ── Navigation bas ── */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-200 z-40">
        <div className="flex">
          {NAV.map(({ path, label, Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${
                  isActive ? 'text-brand' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`relative ${isActive ? 'text-brand' : ''}`}>
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
                    {isActive && (
                      <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand rounded-full" />
                    )}
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? 'text-brand' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
        <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
      </nav>
    </div>
  )
}
