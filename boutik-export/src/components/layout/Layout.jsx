/**
 * BoutiK — Layout
 * Mobile  (<768px)  : header + bottom nav
 * Tablette (768-1024px) : sidebar compacte (icônes seules) + header
 * Desktop (≥1024px) : sidebar complète + header + contenu pleine largeur
 */
import { NavLink, useLocation } from 'react-router-dom'
import { useApp } from '../../store/AppContext'
import {
  LayoutDashboard, ShoppingCart, Package,
  Settings, RefreshCw, CheckCircle2, BarChart3
} from 'lucide-react'

const NAV = [
  { path: '/',           label: 'Accueil',      Icon: LayoutDashboard },
  { path: '/ventes',     label: 'Ventes',       Icon: ShoppingCart },
  { path: '/stock',      label: 'Stock',        Icon: Package },
  { path: '/boss',       label: 'Statistiques', Icon: BarChart3 },
  { path: '/parametres', label: 'Paramètres',   Icon: Settings },
]

export default function Layout({ children }) {
  const { boutique, syncStatus, isOnline, manualSync } = useApp()

  const syncIcon = {
    syncing: <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />,
    synced:  <CheckCircle2 className="w-3 h-3 text-brand" />,
  }[syncStatus] || null

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── Sidebar Tablette + Desktop ── */}
      <aside className="hidden md:flex flex-col w-16 lg:w-60 bg-white border-r border-slate-200 fixed top-0 left-0 h-screen z-40 transition-all">
        {/* Logo */}
        <div className="px-3 lg:px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5 lg:justify-start justify-center">
            <div className="w-8 h-8 bg-brand rounded-[10px] flex items-center justify-center shadow-brand shadow-sm shrink-0">
              <span className="text-white text-sm font-bold">B</span>
            </div>
            <div className="min-w-0 hidden lg:block">
              <p className="font-semibold text-slate-900 text-sm truncate">{boutique?.nom || 'BoutiK'}</p>
              <p className="text-[10px] text-slate-400 truncate">{boutique?.whatsapp || ''}</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 lg:px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ path, label, Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              title={label}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all lg:justify-start justify-center ${
                  isActive
                    ? 'bg-brand-soft text-brand'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                  <span className="hidden lg:inline">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Status bas sidebar */}
        <div className="px-2 lg:px-4 py-4 border-t border-slate-100">
          <button
            onClick={manualSync}
            title={isOnline ? 'Synchronisé' : 'Hors ligne'}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] hover:bg-slate-100 transition-colors lg:justify-start justify-center"
          >
            {syncIcon}
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOnline ? 'bg-brand' : 'bg-red-400'}`} />
            <span className="text-xs text-slate-500 hidden lg:inline">{isOnline ? 'Synchronisé' : 'Hors ligne'}</span>
          </button>
        </div>
      </aside>

      {/* ── Contenu principal ── */}
      <div className="flex-1 md:ml-16 lg:ml-60 flex flex-col min-h-screen min-w-0">

        {/* Header mobile uniquement */}
        <header className="md:hidden bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand rounded-[10px] flex items-center justify-center shadow-brand shadow-sm">
              <span className="text-white text-sm font-bold">B</span>
            </div>
            <span className="font-semibold text-slate-900 text-sm">{boutique?.nom || 'BoutiK'}</span>
          </div>
          <button onClick={manualSync} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            {syncIcon}
            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-brand' : 'bg-red-400'}`} />
            <span className="text-xs text-slate-500">{isOnline ? 'En ligne' : 'Hors ligne'}</span>
          </button>
        </header>

        {/* Header tablette + desktop */}
        <header className="hidden md:flex bg-white border-b border-slate-200 px-5 lg:px-8 h-14 items-center justify-between sticky top-0 z-30">
          <PageTitle />
          <button onClick={manualSync} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            {syncIcon}
            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-brand' : 'bg-red-400'}`} />
            <span className="text-xs text-slate-500">{isOnline ? 'Synchronisé' : 'Hors ligne'}</span>
          </button>
        </header>

        {/* Contenu — pleine largeur, pas de recentrage artificiel */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* ── Navigation bas Mobile uniquement ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40">
        <div className="flex">
          {NAV.filter(n => n.path !== '/boss').map(({ path, label, Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${
                  isActive ? 'text-brand' : 'text-slate-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
                  <span className={`text-[10px] font-medium ${isActive ? 'text-brand' : 'text-slate-400'}`}>{label}</span>
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

function PageTitle() {
  const location = useLocation()
  const titles = {
    '/':           'Tableau de bord',
    '/ventes':     'Ventes',
    '/stock':      'Stock',
    '/boss':       'Statistiques',
    '/parametres': 'Paramètres',
  }
  return <h1 className="text-sm font-semibold text-slate-900">{titles[location.pathname] || 'BoutiK'}</h1>
}
