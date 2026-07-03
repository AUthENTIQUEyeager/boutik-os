/**
 * BoutiK — Modal Vente Rapide
 * Enregistre une vente sans produit spécifique (montant libre)
 */
import { useState } from 'react'
import { addToSyncQueue } from '../../lib/db'
import { Button, Input } from '../ui'
import { Zap, X, CheckCircle2, Tag } from 'lucide-react'

const fmt = (n) => n ? new Intl.NumberFormat('fr-FR').format(parseInt(n)) + ' F' : ''

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
}

export default function VenteRapideModal({ boutiqueId, onClose, onSuccess }) {
  const [montant, setMontant] = useState('')
  const [nomProduit, setNomProduit] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleVendre() {
    if (!montant || parseInt(montant) <= 0) {
      setError('Entrez un montant valide')
      return
    }
    setError('')
    setLoading(true)

    try {
      // Enregistrer la vente rapide dans IndexedDB
      const { getDB } = await import('../../lib/db')
      const db = await getDB()

      const vente = {
        id: generateId('VRT'),
        boutiqueId,
        produitId: null,
        categorieId: null,
        nomProduit: nomProduit.trim() || 'Vente rapide',
        prixVente: parseInt(montant),
        prixAchat: 0,
        benefice: parseInt(montant),
        vendeurNom: 'Gérant',
        date: new Date().toISOString(),
        type: 'rapide',
        synced: false
      }

      await db.put('ventes', vente)
      await addToSyncQueue('create', 'vente', vente)

      setDone(true)
      setTimeout(() => onSuccess(), 1000)
    } catch (err) {
      setError('Erreur lors de l\'enregistrement')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-t-[22px] lg:rounded-[22px] w-full max-w-md shadow-modal animate-slide-up lg:my-8">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="px-6 pb-8 pt-3">
          {done ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-brand-soft border border-brand-border rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-brand" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Vente enregistrée</h3>
              <p className="text-2xl font-bold text-brand mt-1">{fmt(montant)}</p>
              {nomProduit && <p className="text-sm text-slate-500 mt-1">{nomProduit}</p>}
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-brand-soft border border-brand-border rounded-[10px] flex items-center justify-center">
                    <Zap className="w-4 h-4 text-brand" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Vente rapide</h2>
                    <p className="text-xs text-slate-500">Enregistrement immédiat</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Montant — champ principal */}
              <div className="mb-4">
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Montant</label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={montant}
                    onChange={e => { setMontant(e.target.value); setError('') }}
                    className="w-full h-16 px-4 pr-16 rounded-[12px] border border-slate-200 text-2xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">FCFA</span>
                </div>
                {montant && parseInt(montant) > 0 && (
                  <p className="text-xs text-brand mt-1.5 font-medium">{fmt(montant)}</p>
                )}
              </div>

              {/* Nom produit optionnel */}
              <Input
                label="Nom du produit (optionnel)"
                placeholder="Ex: Chemise bleue, Pain, Stylo..."
                value={nomProduit}
                onChange={e => setNomProduit(e.target.value)}
                icon={Tag}
                className="mb-5"
              />

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
                <Button size="lg" className="flex-1" loading={loading} onClick={handleVendre} icon={Zap}>
                  Vendre
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
