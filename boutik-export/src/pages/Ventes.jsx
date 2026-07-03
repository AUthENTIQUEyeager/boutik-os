/**
 * BoutiK — Page Ventes v2
 */
import { useState, useEffect } from 'react'
import { useApp } from '../store/AppContext'
import { getVentesByBoutique } from '../lib/db'
import { Card, Badge, EmptyState, Spinner, SectionHeader } from '../components/ui'
import { ShoppingCart, TrendingUp, Printer } from 'lucide-react'

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' F'

export default function Ventes() {
  const { boutique } = useApp()
  const [ventes, setVentes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState('today')

  useEffect(() => {
    async function load() {
      if (!boutique) return
      const all = await getVentesByBoutique(boutique.id)
      setVentes(all.reverse())
      setLoading(false)
    }
    load()
  }, [boutique])

  const now = new Date()
  const filtered = ventes.filter(v => {
    const d = new Date(v.date)
    if (filtre === 'today') return d.toDateString() === now.toDateString()
    if (filtre === 'week') return (now - d) <= 7 * 86400000
    return true
  })

  const totalCA = filtered.reduce((s, v) => s + v.prixVente, 0)
  const totalBenef = filtered.reduce((s, v) => s + v.benefice, 0)

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div className="px-4 pt-5 pb-4 space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Ventes</h1>
          <p className="text-xs text-slate-500 mt-0.5">{filtered.length} transaction{filtered.length > 1 ? 's' : ''}</p>
        </div>
        {filtered.length > 0 && (
          <button
            onClick={() => printVentes(filtered, boutique)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimer
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-[10px]">
        {[{ k: 'today', l: "Aujourd'hui" }, { k: 'week', l: '7 jours' }, { k: 'all', l: 'Tout' }].map(f => (
          <button
            key={f.k}
            onClick={() => setFiltre(f.k)}
            className={`flex-1 py-1.5 rounded-[8px] text-xs font-medium transition-all ${filtre === f.k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            {f.l}
          </button>
        ))}
      </div>

      {/* Totaux */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-slate-200 rounded-[14px] p-3.5 shadow-card">
            <div className="flex items-center gap-1.5 mb-2">
              <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-xs text-slate-500">Chiffre d'affaires</p>
            </div>
            <p className="text-xl font-bold text-slate-900">{fmt(totalCA)}</p>
          </div>
          <div className="bg-brand-soft border border-brand-border rounded-[14px] p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-brand" />
              <p className="text-xs text-brand">Bénéfice net</p>
            </div>
            <p className="text-xl font-bold text-brand">{fmt(totalBenef)}</p>
          </div>
        </div>
      )}

      {/* Liste */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Aucune vente"
          description={filtre === 'today' ? "Aucune vente enregistrée aujourd'hui" : "Aucune vente sur cette période"}
        />
      ) : (
        <Card padding={false} className="overflow-hidden">
          {filtered.map((v, i) => (
            <div key={v.id} className={`flex items-center justify-between px-4 py-3.5 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate">{v.nomProduit}</p>
                <p className="text-xs text-slate-400 mt-0.5">{fmtDT(v.date)}</p>
              </div>
              <div className="text-right ml-3 shrink-0">
                <p className="text-sm font-semibold text-slate-900">{fmt(v.prixVente)}</p>
                <p className="text-xs text-brand">+{fmt(v.benefice)}</p>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

function fmtDT(iso) {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function printVentes(ventes, boutique) {
  const totalCA = ventes.reduce((s, v) => s + v.prixVente, 0)
  const totalB = ventes.reduce((s, v) => s + v.benefice, 0)
  const fmt2 = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
  const win = window.open('', '_blank')
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ventes</title>
  <style>body{font-family:monospace;font-size:12px;padding:20px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ddd;padding:6px;text-align:left}th{background:#f5f5f5}.total{font-weight:bold;margin-top:10px}</style></head><body>
  <h2>${boutique?.nom} — Ventes</h2><p>${new Date().toLocaleString('fr-FR')}</p>
  <table><tr><th>Produit</th><th>Prix vente</th><th>Bénéfice</th><th>Date</th></tr>
  ${ventes.map(v => `<tr><td>${v.nomProduit}</td><td>${fmt2(v.prixVente)}</td><td>${fmt2(v.benefice)}</td><td>${new Date(v.date).toLocaleString('fr-FR')}</td></tr>`).join('')}
  </table><p class="total">CA: ${fmt2(totalCA)} | Bénéfice: ${fmt2(totalB)}</p></body></html>`)
  win.document.close()
  win.print()
}
