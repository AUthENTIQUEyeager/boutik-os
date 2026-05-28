/**
 * BoutiK - Dashboard Boss / Propriétaire
 */
import { useState, useEffect } from 'react'
import { useApp } from '../store/AppContext'
import { getVentesByBoutique, getCategoriesByBoutique, getProduitsByBoutique } from '../lib/db'
import { Card, Spinner } from '../components/ui'

const formatCFA = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' F'

export default function BossDashboard() {
  const { boutique } = useApp()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [periode, setPeriode] = useState('month') // week | month | all

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

      // Ventes par jour (7 derniers jours)
      const ventesByDay = {}
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const key = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
        ventesByDay[key] = { count: 0, ca: 0, benefice: 0 }
      }
      for (const v of ventes) {
        const d = new Date(v.date)
        if ((now - d) <= 7 * 86400000) {
          const key = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
          if (ventesByDay[key]) {
            ventesByDay[key].count++
            ventesByDay[key].ca += v.prixVente
            ventesByDay[key].benefice += v.benefice
          }
        }
      }

      // Meilleures catégories
      const catStats = categories.map(cat => {
        const catVentes = filtered.filter(v => v.categorieId === cat.id)
        return {
          ...cat,
          ventesCount: catVentes.length,
          ca: catVentes.reduce((s, v) => s + v.prixVente, 0),
          benefice: catVentes.reduce((s, v) => s + v.benefice, 0)
        }
      }).sort((a, b) => b.benefice - a.benefice)

      setData({
        totalCA: filtered.reduce((s, v) => s + v.prixVente, 0),
        totalBenefice: filtered.reduce((s, v) => s + v.benefice, 0),
        totalVentes: filtered.length,
        totalProduits: produits.length,
        produitsVendus: produits.filter(p => p.vendu).length,
        produitsDisponibles: produits.filter(p => !p.vendu).length,
        ventesByDay: Object.entries(ventesByDay),
        topCategories: catStats.slice(0, 5),
        margeGlobale: filtered.length > 0
          ? Math.round((filtered.reduce((s, v) => s + v.benefice, 0) / filtered.reduce((s, v) => s + v.prixVente, 0)) * 100)
          : 0
      })
      setLoading(false)
    }
    load()
  }, [boutique, periode])

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (!data) return null

  const maxBenefice = Math.max(...data.ventesByDay.map(([, v]) => v.benefice), 1)

  return (
    <div className="px-4 py-4 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-ink">Tableau de bord</h1>
          <p className="text-xs text-ink-muted mt-0.5">Vue propriétaire</p>
        </div>
      </div>

      {/* Filtres période */}
      <div className="flex gap-2">
        {[
          { k: 'week', label: '7 jours' },
          { k: 'month', label: '30 jours' },
          { k: 'all', label: 'Tout' }
        ].map(({ k, label }) => (
          <button key={k} onClick={() => setPeriode(k)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${periode === k ? 'bg-ink text-white' : 'bg-paper-soft text-ink-muted'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard label="Chiffre d'affaires" value={formatCFA(data.totalCA)} accent="" />
        <KPICard label="Bénéfice net" value={formatCFA(data.totalBenefice)} accent="text-accent-success" />
        <KPICard label="Nombre de ventes" value={data.totalVentes} />
        <KPICard label="Marge globale" value={`${data.margeGlobale}%`} accent={data.margeGlobale > 30 ? 'text-accent-success' : 'text-ink'} />
      </div>

      {/* Graphique barres 7 jours */}
      <Card>
        <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-4">Bénéfices 7 derniers jours</h3>
        <div className="flex items-end gap-2 h-24">
          {data.ventesByDay.map(([day, val]) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                <div
                  className="w-full bg-ink rounded-t-md transition-all"
                  style={{ height: `${Math.max((val.benefice / maxBenefice) * 80, val.benefice > 0 ? 4 : 0)}px` }}
                />
              </div>
              <span className="text-[9px] text-ink-muted text-center leading-tight">{day.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Stock */}
      <Card>
        <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">État du stock</h3>
        <div className="flex gap-4">
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold text-ink">{data.produitsDisponibles}</p>
            <p className="text-xs text-ink-muted">En stock</p>
          </div>
          <div className="w-px bg-paper-border" />
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold text-ink">{data.produitsVendus}</p>
            <p className="text-xs text-ink-muted">Vendus</p>
          </div>
          <div className="w-px bg-paper-border" />
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold text-ink">{data.totalProduits}</p>
            <p className="text-xs text-ink-muted">Total</p>
          </div>
        </div>
        {/* Barre de progression */}
        <div className="mt-4 bg-paper-soft rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-ink rounded-full transition-all"
            style={{ width: `${data.totalProduits > 0 ? (data.produitsVendus / data.totalProduits) * 100 : 0}%` }}
          />
        </div>
        <p className="text-xs text-ink-muted mt-1.5 text-right">
          {data.totalProduits > 0 ? Math.round((data.produitsVendus / data.totalProduits) * 100) : 0}% vendus
        </p>
      </Card>

      {/* Top catégories */}
      {data.topCategories.length > 0 && (
        <Card>
          <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">Catégories les plus rentables</h3>
          <div className="space-y-3">
            {data.topCategories.map((cat, i) => (
              <div key={cat.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-ink-muted w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{cat.nom}</p>
                  <p className="text-xs text-ink-muted">{cat.ventesCount} vente{cat.ventesCount > 1 ? 's' : ''}</p>
                </div>
                <p className="text-sm font-semibold text-accent-success shrink-0">{formatCFA(cat.benefice)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function KPICard({ label, value, accent = '' }) {
  return (
    <div className="bg-paper-soft rounded-xl p-3">
      <p className="text-xs text-ink-muted mb-1">{label}</p>
      <p className={`text-xl font-bold ${accent || 'text-ink'}`}>{value}</p>
    </div>
  )
}
