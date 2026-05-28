/**
 * BoutiK - Modal de vente
 */
import { useState } from 'react'
import { enregistrerVente } from '../../lib/db'
import { Button, Badge } from '../ui'

const formatCFA = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' F'

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
      setTimeout(() => onSuccess(), 1200)
    } catch (err) {
      setError(err.message || 'Erreur lors de la vente')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-white rounded-t-2xl w-full max-w-md shadow-modal animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-paper-border rounded-full" />
        </div>

        <div className="px-6 pb-8 pt-4">
          {done ? (
            // État succès
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-accent-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-ink">Vente enregistrée</h3>
              <p className="text-sm text-ink-muted mt-1">
                Bénéfice : <span className="text-accent-success font-medium">{formatCFA(produit.prixVente - produit.prixAchat)}</span>
              </p>
            </div>
          ) : (
            <>
              {/* En-tête */}
              <div className="mb-6">
                <p className="text-xs text-ink-muted mb-1">Confirmer la vente</p>
                <h2 className="text-xl font-bold text-ink">{produit.nom}</h2>
                <p className="text-xs font-mono text-ink-muted mt-0.5">{produit.id}</p>
              </div>

              {/* Détails */}
              <div className="bg-paper-soft rounded-xl p-4 space-y-3 mb-6">
                <Row label="Prix de vente" value={formatCFA(produit.prixVente)} bold />
                <Row label="Prix d'achat" value={formatCFA(produit.prixAchat)} />
                <div className="border-t border-paper-border pt-3">
                  <Row
                    label="Bénéfice"
                    value={formatCFA(produit.prixVente - produit.prixAchat)}
                    accent="success"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                  <p className="text-sm text-accent-danger">{error}</p>
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  onClick={onClose}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  loading={loading}
                  onClick={handleVente}
                >
                  Valider la vente
                </Button>
              </div>

              <p className="text-xs text-ink-muted text-center mt-3">
                Cette action est irréversible
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
      `}</style>
    </div>
  )
}

function Row({ label, value, bold = false, accent }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-ink' : accent === 'success' ? 'font-semibold text-accent-success' : 'text-ink'}`}>
        {value}
      </span>
    </div>
  )
}
