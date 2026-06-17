/**
 * BoutiK — Dashboard Boss v2
 */
import { useState, useEffect } from 'react'
import { useApp } from '../store/AppContext'
import { getVentesByBoutique, getCategoriesByBoutique, getProduitsByBoutique } from '../lib/db'
import { Card, Spinner, SectionHeader } from '../components/ui'
import { TrendingUp, ShoppingCart, Package, Percent, Trophy, ArrowLeft } from 'lucide-react'
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
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const key = d.toLocaleDateString('fr-FR', { weekday: 'short' })
        ventesByDay[key] = { count: 0, benefice: 0 }
      }
      for (const v of ventes) {
        const d = new Date(v.date)
        if ((now - d) <= 7 * 86400000) {
          const key = d.toLocaleDateString('fr-FR', { weekday: 'short' })
          if (ventesByDay[key]) { ventesByDay[key].count++; ventesByDay[key].benefice += v.benefice }
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
        topCategories: topCats.slice(0, 5),
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

  return (
    <div className="px-4 pt-5 pb-4 space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/parametres')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Tableau de bord</h1>
          <p className="text-xs text-slate-500">Vue propriétaire</p>
        </div>
      </div>

      {/* Période */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-[10px]">
        {[{ k: 'week', l: '7 jours' }, { k: 'month', l: '30 jours' }, { k: 'all', l: 'Tout' }].map(p => (
          <button key={p.k} onClick={() => setPeriode(p.k)}
            className={`flex-1 py-1.5 rounded-[8px] text-xs font-medium transition-all ${periode === p.k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            {p.l}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Chiffre d'affaires", value: fmt(data.totalCA), icon: ShoppingCart },
          { label: 'Bénéfice net', value: fmt(data.totalBenefice), icon: TrendingUp, variant: 'brand' },
          { label: 'Ventes', value: data.totalVentes, icon: Package },
          { label: 'Marge', value: `${data.marge}%`, icon: Percent, variant: data.marge >= 30 ? 'brand' : 'default' },
        ].map(k => (
          <div key={k.label} className={`bg-white border rounded-[14px] p-4 shadow-card ${k.variant === 'brand' ? 'border-brand-border bg-brand-soft' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500">{k.label}</p>
              <k.icon className={`w-4 h-4 ${k.variant === 'brand' ? 'text-brand' : 'text-slate-300'}`} />
            </div>
            <p className={`text-xl font-bold ${k.variant === 'brand' ? 'text-brand' : 'text-slate-900'}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Graphique barres 7 jours */}
      <Card>
        <SectionHeader title="Bénéfices — 7 derniers jours" />
        <div className="flex items-end gap-2 h-28 mt-2">
          {data.ventesByDay.map(([day, val]) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex items-end justify-center" style={{ height: '88px' }}>
                <div
                  className="w-full rounded-t-[6px] transition-all"
                  style={{
                    height: `${Math.max((val.benefice / maxB) * 88, val.benefice > 0 ? 4 : 0)}px`,
                    background: val.benefice > 0 ? '#16A34A' : '#E2E8F0'
                  }}
                />
              </div>
              <span className="text-[9px] text-slate-400 font-medium">{day}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Stock */}
      <Card>
        <SectionHeader title="État du stock" />
        <div className="flex gap-4 mb-3">
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold text-brand">{data.produitsDisponibles}</p>
            <p className="text-xs text-slate-500">En stock</p>
          </div>
          <div className="w-px bg-slate-100" />
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold text-slate-900">{data.produitsVendus}</p>
            <p className="text-xs text-slate-500">Vendus</p>
          </div>
          <div className="w-px bg-slate-100" />
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold text-slate-900">{data.totalProduits}</p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
        </div>
        <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all"
            style={{ width: `${data.totalProduits > 0 ? (data.produitsVendus / data.totalProduits) * 100 : 0}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1.5 text-right">
          {data.totalProduits > 0 ? Math.round((data.produitsVendus / data.totalProduits) * 100) : 0}% vendus
        </p>
      </Card>

      {/* Top catégories */}
      {data.topCategories.length > 0 && (
        <Card>
          <SectionHeader title="Top catégories" />
          <div className="space-y-3 mt-1">
            {data.topCategories.map((cat, i) => (
              <div key={cat.id} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500'}`}>
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
      )}
    </div>
  )
}
