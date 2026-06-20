/**
 * BoutiK — Tableau de bord avancé (Boss)
 * Mobile : flux vertical
 * Desktop : bandeau KPI pleine largeur + grand graphique + sidebar top catégories
 */
import { useState, useEffect } from 'react'
import { useApp } from '../store/AppContext'
import { getVentesByBoutique, getCategoriesByBoutique, getProduitsByBoutique } from '../lib/db'
import { Card, Spinner, SectionHeader } from '../components/ui'
import { TrendingUp, ShoppingCart, Package, Percent, ArrowLeft, Trophy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' F'

export default function BossDashboard() {
  const { boutique } = useApp()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [periode, setPeriode] = useState('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!boutique) return
      const [ventes, categories, produits] = await Promise.all([
        getVentesByBoutique(boutique.id),
        getCategoriesByBoutique(boutique.id),
        getProduitsByBoutique(boutique.id)
      ])
      const now = new Date()
      const filtered = ventes.filter(v => {
        const d = new Date(v.date)
        if (periode === 'week') return (now - d) <= 7 * 86400000
        if (periode === 'month') return (now - d) <= 30 * 86400000
        return true
      })
      const ventesByDay = {}
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i)
        const key = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
        ventesByDay[key] = { count: 0, benefice: 0, ca: 0 }
      }
      for (const v of ventes) {
        const d = new Date(v.date)
        if ((now - d) <= 7 * 86400000) {
          const key = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
          if (ventesByDay[key]) { ventesByDay[key].count++; ventesByDay[key].benefice += v.benefice; ventesByDay[key].ca += v.prixVente }
        }
      }
      const topCats = categories.map(cat => {
        const cv = filtered.filter(v => v.categorieId === cat.id)
        return { ...cat, ventesCount: cv.length, benefice: cv.reduce((s, v) => s + v.benefice, 0), ca: cv.reduce((s, v) => s + v.prixVente, 0) }
      }).sort((a, b) => b.benefice - a.benefice)
      const totalCA = filtered.reduce((s, v) => s + v.prixVente, 0)
      const totalB = filtered.reduce((s, v) => s + v.benefice, 0)
      setData({
        totalCA, totalBenefice: totalB, totalVentes: filtered.length,
        marge: totalCA > 0 ? Math.round((totalB / totalCA) * 100) : 0,
        ventesByDay: Object.entries(ventesByDay),
        topCategories: topCats.slice(0, 8),
        produitsVendus: produits.filter(p => p.vendu).length,
        produitsDisponibles: produits.filter(p => !p.vendu).length,
        totalProduits: produits.length
      })
      setLoading(false)
    }
    load()
  }, [boutique, periode])

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (!data) return null

  const maxB = Math.max(...data.ventesByDay.map(([, v]) => v.benefice), 1)
  const kpis = [
    { label: "Chiffre d'affaires", value: fmt(data.totalCA), icon: ShoppingCart, variant: 'default' },
    { label: 'Bénéfice net', value: fmt(data.totalBenefice), icon: TrendingUp, variant: 'brand' },
    { label: 'Ventes', value: data.totalVentes, icon: Package, variant: 'default' },
    { label: 'Marge', value: `${data.marge}%`, icon: Percent, variant: data.marge >= 30 ? 'brand' : 'default' },
  ]

  return (
    <>
      {/* ════════════════ MOBILE ════════════════ */}
      <div className="lg:hidden p-4 space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/parametres')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Statistiques</h1>
            <p className="text-xs text-slate-500">Vue propriétaire</p>
          </div>
        </div>

        <PeriodePills periode={periode} setPeriode={setPeriode} />

        <div className="grid grid-cols-2 gap-3">
          {kpis.map(k => <KpiCard key={k.label} {...k} />)}
        </div>

        <GraphiqueBarres data={data} maxB={maxB} />
        <StockCard data={data} />
        <TopCategories data={data} compact />
      </div>

      {/* ════════════════ DESKTOP ════════════════ */}
      <div className="hidden lg:block animate-fade-in">

        {/* Bandeau supérieur */}
        <div className="bg-white border-b border-slate-200 px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Statistiques</h1>
              <p className="text-xs text-slate-500 mt-0.5">Vue propriétaire — performance globale</p>
            </div>
            <PeriodePills periode={periode} setPeriode={setPeriode} />
          </div>

          <div className="grid grid-cols-4 gap-4">
            {kpis.map(k => <KpiCard key={k.label} {...k} large />)}
          </div>
        </div>

        {/* Corps : graphique large + sidebar top catégories */}
        <div className="flex">
          <div className="flex-1 p-8 space-y-6 min-w-0">
            <GraphiqueBarres data={data} maxB={maxB} large />
            <StockCard data={data} />
          </div>

          <aside className="w-96 shrink-0 border-l border-slate-200 bg-white p-6 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" /> Top catégories
            </p>
            <div className="space-y-1">
              {data.topCategories.length === 0 ? (
                <p className="text-xs text-slate-400">Aucune donnée pour cette période</p>
              ) : data.topCategories.map((cat, i) => (
                <div key={cat.id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{cat.nom}</p>
                    <p className="text-xs text-slate-400">{cat.ventesCount} vente{cat.ventesCount > 1 ? 's' : ''}</p>
                  </div>
                  <p className="text-sm font-semibold text-brand shrink-0">{fmt(cat.benefice)}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}

function PeriodePills({ periode, setPeriode }) {
  return (
    <div className="flex gap-2 bg-slate-100 p-1 rounded-[10px] max-w-xs">
      {[{ k: 'week', l: '7 jours' }, { k: 'month', l: '30 jours' }, { k: 'all', l: 'Tout' }].map(p => (
        <button key={p.k} onClick={() => setPeriode(p.k)}
          className={`flex-1 py-1.5 px-3 rounded-[8px] text-xs font-medium transition-all whitespace-nowrap ${periode === p.k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
          {p.l}
        </button>
      ))}
    </div>
  )
}

function KpiCard({ label, value, icon: Icon, variant, large }) {
  return (
    <div className={`bg-white border rounded-[14px] p-4 shadow-card ${variant === 'brand' ? 'border-brand-border bg-brand-soft' : 'border-slate-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-500">{label}</p>
        <Icon className={`w-4 h-4 ${variant === 'brand' ? 'text-brand' : 'text-slate-300'}`} />
      </div>
      <p className={`${large ? 'text-2xl' : 'text-2xl'} font-bold ${variant === 'brand' ? 'text-brand' : 'text-slate-900'}`}>{value}</p>
    </div>
  )
}

function GraphiqueBarres({ data, maxB, large }) {
  return (
    <Card>
      <SectionHeader title="Bénéfices — 7 derniers jours" />
      <div className={`flex items-end gap-2 lg:gap-4 ${large ? 'h-48' : 'h-32'} mt-4`}>
        {data.ventesByDay.map(([day, val]) => (
          <div key={day} className="flex-1 flex flex-col items-center gap-1.5 group">
            <div className="w-full flex items-end justify-center relative" style={{ height: large ? '160px' : '100px' }}>
              {val.benefice > 0 && (
                <span className="absolute -top-6 text-xs font-semibold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  {fmt(val.benefice)}
                </span>
              )}
              <div className="w-full rounded-t-[6px] transition-all"
                style={{ height: `${Math.max((val.benefice / maxB) * (large ? 160 : 100), val.benefice > 0 ? 4 : 0)}px`, background: val.benefice > 0 ? '#16A34A' : '#E2E8F0' }} />
            </div>
            <span className="text-[10px] lg:text-xs text-slate-400 font-medium text-center">{day.split(' ')[0]}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function StockCard({ data }) {
  return (
    <Card>
      <SectionHeader title="État du stock" />
      <div className="flex gap-4 mb-4 mt-2">
        {[
          { label: 'En stock', value: data.produitsDisponibles, color: 'text-brand' },
          { label: 'Vendus', value: data.produitsVendus, color: 'text-slate-900' },
          { label: 'Total', value: data.totalProduits, color: 'text-slate-900' },
        ].map(s => (
          <div key={s.label} className="flex-1 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
        <div className="h-full bg-brand rounded-full transition-all"
          style={{ width: `${data.totalProduits > 0 ? (data.produitsVendus / data.totalProduits) * 100 : 0}%` }} />
      </div>
      <p className="text-xs text-slate-400 mt-1.5 text-right">
        {data.totalProduits > 0 ? Math.round((data.produitsVendus / data.totalProduits) * 100) : 0}% vendus
      </p>
    </Card>
  )
}

function TopCategories({ data, compact }) {
  if (data.topCategories.length === 0) return null
  return (
    <Card>
      <SectionHeader title="Top catégories" />
      <div className="space-y-2 mt-2">
        {data.topCategories.slice(0, compact ? 5 : 8).map((cat, i) => (
          <div key={cat.id} className="flex items-center gap-3 py-1.5">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500'}`}>
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{cat.nom}</p>
              <p className="text-xs text-slate-400">{cat.ventesCount} vente{cat.ventesCount > 1 ? 's' : ''}</p>
            </div>
            <p className="text-sm font-semibold text-brand shrink-0">{fmt(cat.benefice)}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
