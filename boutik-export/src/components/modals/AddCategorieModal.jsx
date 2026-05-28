/**
 * BoutiK - Modal ajout catégorie
 */
import { useState } from 'react'
import { createCategorie } from '../../lib/db'
import { Button, Input } from '../ui'

export default function AddCategorieModal({ boutiqueId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    nom: '',
    prixAchat: '',
    prixVente: '',
    quantite: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(null)

  const set = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }))
    setErrors(err => ({ ...err, [key]: undefined }))
  }

  function validate() {
    const errs = {}
    if (!form.nom.trim()) errs.nom = 'Nom requis'
    if (!form.prixAchat || isNaN(form.prixAchat) || +form.prixAchat <= 0) errs.prixAchat = 'Prix valide requis'
    if (!form.prixVente || isNaN(form.prixVente) || +form.prixVente <= 0) errs.prixVente = 'Prix valide requis'
    if (+form.prixVente <= +form.prixAchat) errs.prixVente = 'Doit être supérieur au prix d\'achat'
    if (!form.quantite || isNaN(form.quantite) || +form.quantite < 1) errs.quantite = 'Quantité valide requise'
    if (+form.quantite > 500) errs.quantite = 'Maximum 500 produits par catégorie'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const result = await createCategorie(boutiqueId, {
        nom: form.nom.trim(),
        prixAchat: parseInt(form.prixAchat),
        prixVente: parseInt(form.prixVente),
        quantite: parseInt(form.quantite)
      })
      setDone(result)
      setTimeout(() => onSuccess(), 1500)
    } catch (err) {
      setErrors({ global: 'Erreur lors de la création' })
      setLoading(false)
    }
  }

  const benefice = form.prixVente && form.prixAchat
    ? parseInt(form.prixVente) - parseInt(form.prixAchat)
    : null

  const formatCFA = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' F'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl w-full max-w-md shadow-modal" style={{ animation: 'slide-up 0.25s ease-out', maxHeight: '92vh', overflowY: 'auto' }}>
        <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-white">
          <div className="w-10 h-1 bg-paper-border rounded-full" />
        </div>

        <div className="px-6 pb-8 pt-4">
          {done ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-accent-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-ink">Catégorie créée</h3>
              <p className="text-sm text-ink-muted mt-1">
                {done.produits.length} produit{done.produits.length > 1 ? 's' : ''} ajouté{done.produits.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs font-mono text-ink-muted mt-1">
                {done.produits[0]?.id} → {done.produits[done.produits.length - 1]?.id}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-ink">Nouvelle catégorie</h2>
                <p className="text-xs text-ink-muted mt-0.5">Chaque produit recevra un ID unique automatiquement</p>
              </div>

              <Input
                label="Nom de la catégorie"
                placeholder="Ex: Maillots Real Madrid"
                value={form.nom}
                onChange={set('nom')}
                error={errors.nom}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Prix d'achat (F)"
                  placeholder="4000"
                  value={form.prixAchat}
                  onChange={set('prixAchat')}
                  error={errors.prixAchat}
                  type="number"
                  inputMode="numeric"
                  min="1"
                />
                <Input
                  label="Prix de vente (F)"
                  placeholder="6000"
                  value={form.prixVente}
                  onChange={set('prixVente')}
                  error={errors.prixVente}
                  type="number"
                  inputMode="numeric"
                  min="1"
                />
              </div>

              <Input
                label="Quantité en stock"
                placeholder="15"
                value={form.quantite}
                onChange={set('quantite')}
                error={errors.quantite}
                type="number"
                inputMode="numeric"
                min="1"
                max="500"
              />

              {/* Aperçu bénéfice */}
              {benefice !== null && benefice > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-green-700">Bénéfice par unité</span>
                  <span className="text-sm font-semibold text-accent-success">{formatCFA(benefice)}</span>
                </div>
              )}

              {errors.global && (
                <p className="text-sm text-accent-danger">{errors.global}</p>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" size="lg" className="flex-1" onClick={onClose} type="button">
                  Annuler
                </Button>
                <Button size="lg" className="flex-1" loading={loading} type="submit">
                  Créer
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
