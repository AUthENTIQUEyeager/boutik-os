/**
 * BoutiK — Modal de vente v2
 */
import { useState } from 'react'
import { enregistrerVente } from '../../lib/db'
import { Button } from '../ui'
import { CheckCircle2, X, Tag, TrendingUp } from 'lucide-react'

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' F'

export default function SellModal({ produit, boutiqueId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleVente() {
    setLoading(true)
    setError('')
    try {
      await enregistrerVente(boutiqueId, produit.id)
      setDone(true)
      setTimeout(() => onSuccess(), 1000)
    } catch (err) {
      setError(err.message || 'Erreur lors de la vente')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-t-[22px] lg:rounded-[22px] w-full max-w-md shadow-modal animate-slide-up lg:my-8">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="px-6 pb-8 pt-2">
          {done ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-brand-soft border border-brand-border rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-brand" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Vente enregistrée</h3>
              <p className="text-sm text-slate-500 mt-1">
                Bénéfice : <span className="text-brand font-semibold">{fmt(produit.prixVente - produit.prixAchat)}</span>
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Confirmer la vente</p>
                  <h2 className="text-xl font-bold text-slate-900">{produit.nom}</h2>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{produit.id}</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Détails prix */}
              <div className="bg-slate-50 border border-slate-200 rounded-[14px] p-4 space-y-3 mb-6">
                <Row icon={Tag} label="Prix de vente" value={fmt(produit.prixVente)} bold />
                <Row label="Prix d'achat" value={fmt(produit.prixAchat)} />
                <div className="border-t border-slate-200 pt-3">
                  <Row icon={TrendingUp} label="Bénéfice" value={fmt(produit.prixVente - produit.prixAchat)} accent />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-[10px] px-4 py-3 mb-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="secondary" size="lg" className="flex-1" onClick={onClose} disabled={loading}>
                  Annuler
                </Button>
                <Button size="lg" className="flex-1" loading={loading} onClick={handleVente}>
                  Valider la vente
                </Button>
              </div>

              <p className="text-xs text-slate-400 text-center mt-3">Action irréversible</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, bold, accent, icon: Icon }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <span className={`text-sm ${bold ? 'font-bold text-slate-900' : accent ? 'font-semibold text-brand' : 'text-slate-700'}`}>
        {value}
      </span>
    </div>
  )
}
