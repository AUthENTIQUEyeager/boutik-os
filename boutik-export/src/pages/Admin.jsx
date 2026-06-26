/**
 * BoutiK — Interface Admin v3
 * Statistiques en courbes swipables · Infos boutiques masquées · Responsive soigné
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Badge, Spinner, Input, Button } from '../components/ui'
import {
  ShieldOff, ShieldCheck, Clock, TrendingUp, Users, ShoppingCart,
  LogOut, MessageCircle, Smartphone, Eye, EyeOff, ChevronLeft,
  ChevronRight, Download, Activity, BarChart2
} from 'lucide-react'

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0) + ' F'
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [boutiques, setBoutiques] = useState([])
  const [globalStats, setGlobalStats] = useState(null)
  const [pwaStats, setPwaStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('boutik_admin_token')
    if (!token) { navigate('/admin/login', { replace: true }); return }
    loadData(token)
  }, [])

  async function loadData(token) {
    try {
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      const [r1, r2, r3] = await Promise.all([
        fetch(`${API_URL}/api/admin/boutiques`, { headers }),
        fetch(`${API_URL}/api/admin/stats`, { headers }),
        fetch(`${API_URL}/api/admin/pwa/stats`, { headers })
      ])
      if (r1.status === 401) {
        localStorage.removeItem('boutik_admin_token')
        navigate('/admin/login', { replace: true })
        return
      }
      setBoutiques(await r1.json())
      setGlobalStats(await r2.json())
      if (r3.ok) setPwaStats(await r3.json())
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  async function handleBloquer(id, estBloquee) {
    const token = localStorage.getItem('boutik_admin_token')
    const route = estBloquee ? 'debloquer' : 'bloquer'
    await fetch(`${API_URL}/api/admin/boutiques/${id}/${route}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    })
    await loadData(token)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <Spinner size="lg" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-4 lg:px-8 h-14 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand rounded-[10px] flex items-center justify-center">
            <span className="text-white text-sm font-bold">B</span>
          </div>
          <span className="font-semibold text-slate-900 text-sm">BoutiK Admin</span>
          <Badge variant="ink" className="text-[10px]">Système</Badge>
        </div>
        <button onClick={() => { localStorage.removeItem('boutik_admin_token'); navigate('/login') }}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors">
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Quitter</span>
        </button>
      </div>

      <div className="p-4 lg:p-8 space-y-8 max-w-[1400px] mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-[10px] px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {globalStats && (
          <section>
            <SectionTitle icon={BarChart2} title="Vue globale" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <KpiCard icon={Users} label="Boutiques actives" value={globalStats.totalBoutiques} />
              <KpiCard icon={ShoppingCart} label="Ventes totales" value={globalStats.totalVentes} />
              <KpiCard icon={TrendingUp} label="CA global" value={fmt(globalStats.totalCA)} />
              <KpiCard icon={TrendingUp} label="Bénéfice global" value={fmt(globalStats.totalBenefice)} accent />
            </div>
          </section>
        )}

        {pwaStats && (
          <section>
            <SectionTitle icon={Smartphone} title="Statistiques PWA" sub="7 derniers jours" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <KpiCard icon={Download} label="Installs Android (auj.)" value={pwaStats.today?.androidInstalls ?? 0} small />
              <KpiCard icon={Download} label="Installs iPhone (auj.)" value={pwaStats.today?.iosInstalls ?? 0} small />
              <KpiCard icon={Activity} label="Utilisations (auj.)" value={pwaStats.today?.activeUsers ?? 0} small />
              <KpiCard icon={Users} label="Visiteurs (auj.)" value={pwaStats.today?.visits ?? 0} small />
            </div>
            <ChartsCarousel data={pwaStats} />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
              <MiniKpi label="Total installs" value={pwaStats.totalInstalls} accent />
              <MiniKpi label="Android" value={pwaStats.androidInstalls} />
              <MiniKpi label="iPhone" value={pwaStats.iosInstalls} />
              <MiniKpi label="Sans install" value={pwaStats.nonInstalledVisits} />
              <MiniKpi label="Taux install" value={`${pwaStats.tauxInstallation}%`} />
              <MiniKpi
                label="Dernière install"
                value={pwaStats.lastInstall ? new Date(pwaStats.lastInstall.installedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}
                sub={pwaStats.lastInstall?.platform || ''}
              />
            </div>
          </section>
        )}

        <section>
          <SectionTitle icon={Users} title={`Boutiques (${boutiques.length})`} />
          {boutiques.length === 0 ? (
            <div className="text-center py-10 text-sm text-slate-500 bg-white rounded-[14px] border border-slate-200">
              Aucune boutique enregistrée
            </div>
          ) : (
            <>
              <div className="lg:hidden space-y-3">
                {boutiques.map(b => (
                  <BoutiqueCardMobile key={b.id} boutique={b} onBloquer={() => handleBloquer(b.id, b.bloquee)} />
                ))}
              </div>
              <div className="hidden lg:block bg-white border border-slate-200 rounded-[14px] shadow-card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <Th>Boutique</Th>
                      <Th>Inscription</Th>
                      <Th>Abonnement</Th>
                      <Th align="right">Ventes</Th>
                      <Th align="right">CA</Th>
                      <Th align="right">Bénéfice</Th>
                      <Th align="center">Statut</Th>
                      <Th align="right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {boutiques.map(b => (
                      <BoutiqueRowDesktop key={b.id} boutique={b} onBloquer={() => handleBloquer(b.id, b.bloquee)} />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

// ── Charts Carousel ───────────────────────────────────────────────────────────

const CHARTS = [
  {
    id: 'installs',
    label: 'Installations',
    icon: Download,
    series: [
      { key: 'androidInstalls', label: 'Android', color: '#16A34A' },
      { key: 'iosInstalls', label: 'iPhone', color: '#6366F1' },
    ]
  },
  {
    id: 'usage',
    label: 'Utilisation',
    icon: Activity,
    series: [
      { key: 'activeUsers', label: 'Utilisateurs actifs', color: '#6366F1' },
      { key: 'visits', label: 'Visiteurs total', color: '#94A3B8' },
    ]
  },
  {
    id: 'combined',
    label: 'Vue combinée',
    icon: BarChart2,
    series: [
      { key: 'totalInstalls', label: 'Installs', color: '#16A34A' },
      { key: 'activeUsers', label: 'Utilisateurs', color: '#6366F1' },
      { key: 'visits', label: 'Visiteurs', color: '#94A3B8' },
    ]
  },
]

function enrichDailyData(dailyData) {
  return (dailyData || []).map(d => ({
    ...d,
    totalInstalls: (d.androidInstalls || 0) + (d.iosInstalls || 0)
  }))
}

function ChartsCarousel({ data }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const touchStartX = useRef(null)
  const dailyData = enrichDailyData(data.dailyData)

  const prev = () => setActiveIdx(i => (i - 1 + CHARTS.length) % CHARTS.length)
  const next = () => setActiveIdx(i => (i + 1) % CHARTS.length)

  function onTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx > 50) prev()
    else if (dx < -50) next()
    touchStartX.current = null
  }

  const chart = CHARTS[activeIdx]

  return (
    <div className="bg-white border border-slate-200 rounded-[16px] shadow-card overflow-hidden">
      <div className="flex border-b border-slate-100">
        {CHARTS.map((c, i) => {
          const Icon = c.icon
          return (
            <button key={c.id} onClick={() => setActiveIdx(i)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
                activeIdx === i ? 'text-slate-900 border-b-2 border-brand' : 'text-slate-400 hover:text-slate-600'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{c.label}</span>
            </button>
          )
        })}
      </div>

      <div className="p-5 select-none" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="flex items-center gap-4 mb-5 flex-wrap">
          {chart.series.map(s => (
            <div key={s.key} className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full" style={{ background: s.color }} />
              <span className="text-xs text-slate-500">{s.label}</span>
            </div>
          ))}
        </div>

        <LineChart dailyData={dailyData} series={chart.series} />

        <div className="flex justify-between mt-2">
          {dailyData.map((d, i) => (
            <span key={i} className="text-[10px] text-slate-400 text-center flex-1">
              {(d.label || '').split(' ')[0]}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-5 pb-4 md:hidden">
        <button onClick={prev} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>
        <div className="flex gap-1.5">
          {CHARTS.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${activeIdx === i ? 'bg-brand' : 'bg-slate-200'}`} />
          ))}
        </div>
        <button onClick={next} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  )
}

function LineChart({ dailyData, series }) {
  const W = 600; const H = 180
  const PAD = { top: 20, right: 16, bottom: 10, left: 28 }
  const cW = W - PAD.left - PAD.right
  const cH = H - PAD.top - PAD.bottom

  if (!dailyData || dailyData.length === 0) {
    return <div className="flex items-center justify-center h-40 text-xs text-slate-400">Aucune donnée disponible</div>
  }

  const allValues = series.flatMap(s => dailyData.map(d => d[s.key] || 0))
  const maxVal = Math.max(...allValues, 1)
  const yTicks = [0, Math.ceil(maxVal / 2), maxVal]

  const getPath = (key) => dailyData.map((d, i) => {
    const x = PAD.left + (i / (dailyData.length - 1)) * cW
    const y = PAD.top + cH - ((d[key] || 0) / maxVal) * cH
    return `${x},${y}`
  }).join(' L ')

  const getArea = (key) => {
    const pts = dailyData.map((d, i) => {
      const x = PAD.left + (i / (dailyData.length - 1)) * cW
      const y = PAD.top + cH - ((d[key] || 0) / maxVal) * cH
      return `${x},${y}`
    })
    return `M ${PAD.left},${PAD.top + cH} L ${pts.join(' L ')} L ${PAD.left + cW},${PAD.top + cH} Z`
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '180px' }} preserveAspectRatio="none">
      {yTicks.map((tick, i) => {
        const y = PAD.top + cH - (tick / maxVal) * cH
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#E2E8F0" strokeWidth="1" />
            <text x={PAD.left - 4} y={y + 4} textAnchor="end" style={{ fontSize: '9px', fill: '#94A3B8' }}>{tick}</text>
          </g>
        )
      })}
      {series.map(s => (
        <g key={s.key}>
          <path d={getArea(s.key)} fill={s.color} fillOpacity="0.06" />
          <path d={`M ${getPath(s.key)}`} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {dailyData.map((d, i) => {
            const x = PAD.left + (i / (dailyData.length - 1)) * cW
            const y = PAD.top + cH - ((d[s.key] || 0) / maxVal) * cH
            return <circle key={i} cx={x} cy={y} r="3" fill="white" stroke={s.color} strokeWidth="2"><title>{d.label}: {d[s.key] || 0}</title></circle>
          })}
        </g>
      ))}
    </svg>
  )
}

// ── Boutique Desktop Row ──────────────────────────────────────────────────────

function BoutiqueRowDesktop({ boutique: b, onBloquer }) {
  const [showInfo, setShowInfo] = useState(false)
  const joursRestants = getJoursRestants(b.createdAt)
  const expireBientot = joursRestants <= 5 && joursRestants > 0
  const expire = joursRestants <= 0

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors">
      <td className="px-4 py-3.5">
        <p className="text-sm font-semibold text-slate-900">{b.nom}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {showInfo ? (
            <>
              <span className="text-xs text-slate-400">{b.whatsapp}</span>
              {b.whatsapp && (
                <a href={`https://wa.me/${b.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${b.nom}, nous avons une nouveauté sur BoutiK pour vous !`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-50 border border-green-200 text-green-600 hover:bg-green-600 hover:text-white transition-colors">
                  <MessageCircle className="w-3 h-3" />
                </a>
              )}
              <button onClick={() => setShowInfo(false)} className="text-slate-300 hover:text-slate-500">
                <EyeOff className="w-3 h-3" />
              </button>
            </>
          ) : (
            <button onClick={() => setShowInfo(true)} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-brand transition-colors">
              <Eye className="w-3 h-3" /> Voir infos
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-3.5"><p className="text-xs text-slate-500">{formatDate(b.createdAt)}</p></td>
      <td className="px-4 py-3.5 min-w-[160px]">
        <div className="flex items-center gap-2">
          <Clock className={`w-3.5 h-3.5 shrink-0 ${expire || b.bloquee ? 'text-red-500' : expireBientot ? 'text-amber-600' : 'text-slate-400'}`} />
          <div className="flex-1">
            <p className={`text-xs font-medium ${expire || b.bloquee ? 'text-red-700' : expireBientot ? 'text-amber-700' : 'text-slate-600'}`}>
              {b.bloquee ? 'Suspendu' : expire ? 'Expiré' : `${joursRestants}j restants`}
            </p>
            <div className="w-20 bg-slate-200 rounded-full h-1 mt-1 overflow-hidden">
              <div className={`h-full rounded-full ${expire || b.bloquee ? 'bg-red-500' : expireBientot ? 'bg-amber-500' : 'bg-brand'}`}
                style={{ width: `${Math.max(0, Math.min(100, (joursRestants / 30) * 100))}%` }} />
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 text-right">
        <p className="text-sm font-medium text-slate-900">{b._count?.ventes || 0}</p>
        <p className="text-xs text-slate-400">{b.ventesAujourdhui || 0} auj.</p>
      </td>
      <td className="px-4 py-3.5 text-right"><p className="text-sm font-semibold text-slate-900">{fmt(b.ca)}</p></td>
      <td className="px-4 py-3.5 text-right"><p className="text-sm font-semibold text-brand">{fmt(b.benefice)}</p></td>
      <td className="px-4 py-3.5 text-center">
        <Badge variant={b.bloquee ? 'danger' : 'success'}>{b.bloquee ? 'Bloquée' : 'Active'}</Badge>
      </td>
      <td className="px-4 py-3.5 text-right">
        <button onClick={onBloquer}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors ${
            b.bloquee ? 'bg-brand-soft border border-brand-border text-brand hover:bg-brand hover:text-white'
            : 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white'
          }`}>
          {b.bloquee ? <><ShieldCheck className="w-3.5 h-3.5" /> Débloquer</> : <><ShieldOff className="w-3.5 h-3.5" /> Bloquer</>}
        </button>
      </td>
    </tr>
  )
}

// ── Boutique Mobile Card ──────────────────────────────────────────────────────

function BoutiqueCardMobile({ boutique: b, onBloquer }) {
  const [showInfo, setShowInfo] = useState(false)
  const joursRestants = getJoursRestants(b.createdAt)
  const expireBientot = joursRestants <= 5 && joursRestants > 0
  const expire = joursRestants <= 0

  return (
    <Card>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{b.nom}</p>
            {showInfo ? (
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="text-xs text-slate-400">{b.whatsapp}</p>
                {b.whatsapp && (
                  <a href={`https://wa.me/${b.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${b.nom}, nous avons une nouveauté sur BoutiK pour vous !`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-50 border border-green-200 text-green-600 hover:bg-green-600 hover:text-white transition-colors">
                    <MessageCircle className="w-3 h-3" />
                    <span className="text-[10px] font-medium">WhatsApp</span>
                  </a>
                )}
                <button onClick={() => setShowInfo(false)} className="text-slate-300"><EyeOff className="w-3 h-3" /></button>
              </div>
            ) : (
              <button onClick={() => setShowInfo(true)} className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400 hover:text-brand transition-colors">
                <Eye className="w-3 h-3" /> Voir infos boutique
              </button>
            )}
            <p className="text-xs text-slate-400 mt-0.5">Inscrit le {formatDate(b.createdAt)}</p>
          </div>
          <Badge variant={b.bloquee ? 'danger' : 'success'}>{b.bloquee ? 'Bloquée' : 'Active'}</Badge>
        </div>

        <div className={`flex items-center gap-2 rounded-[10px] px-3 py-2 ${
          b.bloquee || expire ? 'bg-red-50 border border-red-200' :
          expireBientot ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 border border-slate-200'
        }`}>
          <Clock className={`w-3.5 h-3.5 shrink-0 ${expire || b.bloquee ? 'text-red-500' : expireBientot ? 'text-amber-600' : 'text-slate-400'}`} />
          <div className="flex-1">
            <p className={`text-xs font-medium ${expire || b.bloquee ? 'text-red-700' : expireBientot ? 'text-amber-700' : 'text-slate-600'}`}>
              {b.bloquee ? 'Compte suspendu' : expire ? 'Abonnement expiré' : `${joursRestants} jour${joursRestants > 1 ? 's' : ''} restant${joursRestants > 1 ? 's' : ''}`}
            </p>
            <div className="w-full bg-slate-200 rounded-full h-1 mt-1.5 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${expire || b.bloquee ? 'bg-red-500' : expireBientot ? 'bg-amber-500' : 'bg-brand'}`}
                style={{ width: `${Math.max(0, Math.min(100, (joursRestants / 30) * 100))}%` }} />
            </div>
          </div>
          <span className={`text-xs font-bold ${expire || b.bloquee ? 'text-red-600' : expireBientot ? 'text-amber-600' : 'text-brand'}`}>
            {Math.max(0, joursRestants)}/30j
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="Ventes" value={b._count?.ventes || 0} />
          <MiniStat label="Auj." value={b.ventesAujourdhui || 0} />
          <MiniStat label="Catégories" value={b._count?.categories || 0} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 rounded-[10px] p-2.5">
            <p className="text-[10px] text-slate-500 mb-0.5">Chiffre d'affaires</p>
            <p className="text-sm font-bold text-slate-900">{fmt(b.ca)}</p>
          </div>
          <div className="bg-brand-soft border border-brand-border rounded-[10px] p-2.5">
            <p className="text-[10px] text-brand mb-0.5">Bénéfice total</p>
            <p className="text-sm font-bold text-brand">{fmt(b.benefice)}</p>
          </div>
        </div>

        <button onClick={onBloquer}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-sm font-medium transition-colors ${
            b.bloquee ? 'bg-brand-soft border border-brand-border text-brand hover:bg-brand hover:text-white'
            : 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white'
          }`}>
          {b.bloquee ? <><ShieldCheck className="w-4 h-4" /> Débloquer la boutique</> : <><ShieldOff className="w-4 h-4" /> Bloquer la boutique</>}
        </button>
      </div>
    </Card>
  )
}

// ── Sous-composants ───────────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, title, sub }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-slate-400" />
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      {sub && <span className="text-xs text-slate-400">· {sub}</span>}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, accent, small }) {
  return (
    <div className={`bg-white border rounded-[14px] p-4 shadow-card ${accent ? 'border-brand-border bg-brand-soft' : 'border-slate-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`text-xs ${accent ? 'text-brand' : 'text-slate-500'}`}>{label}</p>
        <Icon className={`w-3.5 h-3.5 ${accent ? 'text-brand' : 'text-slate-300'}`} />
      </div>
      <p className={`font-bold ${small ? 'text-xl' : 'text-2xl'} ${accent ? 'text-brand' : 'text-slate-900'}`}>{value}</p>
    </div>
  )
}

function MiniKpi({ label, value, sub, accent }) {
  return (
    <div className={`rounded-[12px] p-3 border ${accent ? 'bg-brand-soft border-brand-border' : 'bg-white border-slate-200 shadow-card'}`}>
      <p className={`text-[10px] mb-1 ${accent ? 'text-brand' : 'text-slate-500'}`}>{label}</p>
      <p className={`text-lg font-bold ${accent ? 'text-brand' : 'text-slate-900'}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400 capitalize">{sub}</p>}
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-[10px] py-2 text-center">
      <p className="text-base font-bold text-slate-900">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  )
}

function Th({ children, align = 'left' }) {
  const cls = { left: 'text-left', right: 'text-right', center: 'text-center' }[align]
  return <th className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${cls}`}>{children}</th>
}

function getJoursRestants(createdAt) {
  if (!createdAt) return 30
  const expiration = new Date(new Date(createdAt).getTime() + 30 * 24 * 60 * 60 * 1000)
  return Math.ceil((expiration - new Date()) / (1000 * 60 * 60 * 24))
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Login Admin ───────────────────────────────────────────────────────────────

export function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Accès refusé'); setLoading(false); return }
      localStorage.setItem('boutik_admin_token', data.token)
      setTimeout(() => navigate('/admin', { replace: true }), 100)
    } catch {
      setError('Impossible de contacter le serveur.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl font-bold">B</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900">Admin BoutiK</h1>
          <p className="text-xs text-slate-500 mt-1">Espace réservé aux administrateurs</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Mot de passe admin" type="password" value={password}
            onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoFocus />
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-[10px] px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          <Button type="submit" className="w-full" size="lg" loading={loading}>Accéder</Button>
        </form>
        <button onClick={() => navigate('/login')} className="w-full text-xs text-slate-400 text-center">
          Retour à l'application
        </button>
      </div>
    </div>
  )
}
