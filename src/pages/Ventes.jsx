/**
 * BoutiK - Page Historique des ventes
 */
import { useState, useEffect } from 'react'
import { useApp } from '../store/AppContext'
import { getVentesByBoutique } from '../lib/db'
import { Card, Badge, EmptyState, Spinner } from '../components/ui'

const formatCFA = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' F'

export default function Ventes() {
  const { boutique, stats } = useApp()
  const [ventes, setVentes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState('today') // today | week | all

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
    if (filtre === 'week') {
      const diff = (now - d) / (1000 * 60 * 60 * 24)
      return diff <= 7
    }
    return true
  })

  const totalBenefice = filtered.reduce((s, v) => s + v.benefice, 0)
  const totalCA = filtered.reduce((s, v) => s + v.prixVente, 0)

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-ink">Ventes</h1>
        <span className="text-xs text-ink-muted">{filtered.length} vente{filtered.length > 1 ? 's' : ''}</span>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        {[
          { key: 'today', label: "Aujourd'hui" },
          { key: 'week', label: '7 jours' },
          { key: 'all', label: 'Tout' }
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFiltre(f.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${filtre === f.key ? 'bg-ink text-white' : 'bg-paper-soft text-ink-muted'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Totaux */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-paper-soft rounded-xl p-3">
            <p className="text-xs text-ink-muted mb-1">Chiffre d'affaires</p>
            <p className="text-lg font-bold text-ink">{formatCFA(totalCA)}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-xs text-green-700 mb-1">Bénéfice net</p>
            <p className="text-lg font-bold text-accent-success">{formatCFA(totalBenefice)}</p>
          </div>
        </div>
      )}

      {/* Liste des ventes */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Aucune vente"
          description={filtre === 'today' ? "Aucune vente enregistrée aujourd'hui" : "Aucune vente sur cette période"}
        />
      ) : (
        <Card padding={false} className="overflow-hidden">
          {filtered.map((v, i) => (
            <div
              key={v.id}
              className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-paper-border' : ''}`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink truncate">{v.nomProduit}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-ink-muted">{formatDateTime(v.date)}</span>
                  {v.vendeur && v.vendeur !== 'Gérant' && (
                    <Badge variant="default" className="text-[10px]">{v.vendeur}</Badge>
                  )}
                </div>
              </div>
              <div className="text-right ml-3 shrink-0">
                <p className="text-sm font-semibold text-ink">{formatCFA(v.prixVente)}</p>
                <p className="text-xs text-accent-success">+{formatCFA(v.benefice)}</p>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Bouton imprimer */}
      {filtered.length > 0 && (
        <button
          onClick={() => printVentes(filtered, boutique)}
          className="w-full py-3 border border-paper-border rounded-xl text-sm text-ink-muted hover:bg-paper-soft transition-colors"
        >
          Imprimer la liste
        </button>
      )}
    </div>
  )
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

function printVentes(ventes, boutique) {
  const total = ventes.reduce((s, v) => s + v.prixVente, 0)
  const benefice = ventes.reduce((s, v) => s + v.benefice, 0)
  const formatCFA = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'

  const win = window.open('', '_blank')
  win.document.write(`
    <!DOCTYPE html><html><head>
    <meta charset="UTF-8"><title>Ventes - ${boutique?.nom}</title>
    <style>
      body { font-family: monospace; font-size: 12px; padding: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
      th { background: #f5f5f5; }
      .total { font-weight: bold; margin-top: 10px; }
    </style></head><body>
    <h2>${boutique?.nom || 'BoutiK'} — Liste des ventes</h2>
    <p>Imprimé le ${new Date().toLocaleString('fr-FR')}</p>
    <table>
      <tr><th>Produit</th><th>Prix vente</th><th>Bénéfice</th><th>Date</th></tr>
      ${ventes.map(v => `<tr>
        <td>${v.nomProduit}</td>
        <td>${formatCFA(v.prixVente)}</td>
        <td>${formatCFA(v.benefice)}</td>
        <td>${new Date(v.date).toLocaleString('fr-FR')}</td>
      </tr>`).join('')}
    </table>
    <p class="total">Total CA : ${formatCFA(total)} | Bénéfice : ${formatCFA(benefice)}</p>
    </body></html>
  `)
  win.document.close()
  win.print()
}
