import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Users, ClipboardList,
  Receipt, Wallet, BarChart3, Settings, RefreshCw, WifiOff, AlertCircle,
} from 'lucide-react';
import { useApp } from '../../store/AppContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/ventes', label: 'Ventes', icon: ShoppingCart },
  { to: '/stock', label: 'Produits/Stock', icon: Package },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/commandes', label: 'Commandes', icon: ClipboardList },
  { to: '/depenses', label: 'Dépenses', icon: Receipt },
  { to: '/dettes', label: 'Dettes', icon: Wallet },
  { to: '/stats', label: 'Statistiques', icon: BarChart3 },
  { to: '/parametres', label: 'Paramètres', icon: Settings },
];

const MOBILE_NAV = [
  { to: '/', label: 'Accueil', icon: LayoutDashboard },
  { to: '/ventes', label: 'Ventes', icon: ShoppingCart },
  { to: '/stock', label: 'Stock', icon: Package },
  { to: '/parametres', label: 'Réglages', icon: Settings },
];

function SyncIndicator({ status }) {
  if (status === 'offline') return <WifiOff size={14} className="text-slate-500" />;
  if (status === 'error') return <AlertCircle size={14} className="text-danger" />;
  if (status === 'syncing') return <RefreshCw size={14} className="text-brand animate-spin" />;
  return <RefreshCw size={14} className="text-brand-light" />;
}

export default function Layout({ children }) {
  const { boutique, syncStatus } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* Sidebar tablette + desktop */}
      <aside className="hidden md:flex flex-col w-16 lg:w-60 bg-white border-r border-slate-200 shrink-0">
        <div className="h-16 flex items-center px-4 border-b border-slate-200">
          <div className="w-9 h-9 rounded-lg bg-brand text-white flex items-center justify-center font-bold shrink-0">B</div>
          <span className="hidden lg:block ml-3 font-bold text-slate-950 truncate">{boutique?.nom || 'BoutiK'}</span>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-soft text-brand' : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              <span className="hidden lg:block truncate">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-200 hidden lg:flex items-center gap-2 text-xs text-slate-500">
          <SyncIndicator status={syncStatus} />
          <span>
            {syncStatus === 'offline' ? 'Hors ligne' : syncStatus === 'error' ? 'Erreur sync' : syncStatus === 'syncing' ? 'Synchronisation...' : 'Synchronisé'}
          </span>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
          <span className="font-bold text-slate-950 md:hidden">{boutique?.nom || 'BoutiK'}</span>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2 md:hidden text-xs text-slate-500">
            <SyncIndicator status={syncStatus} />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom navigation mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around h-16 z-30">
        {MOBILE_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 flex-1 h-full justify-center text-xs font-medium ${
                isActive ? 'text-brand' : 'text-slate-500'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
