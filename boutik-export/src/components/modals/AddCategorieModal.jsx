/**
 * BoutiK — Modal ajout catégorie v2
 */
import { useState } from 'react'
import { createCategorie } from '../../lib/db'
import { Button, Input } from '../ui'
import { X, CheckCircle2, Layers } from 'lucide-react'

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' F'

export default function AddCategorieModal({ boutiqueId, onClose, onSuccess }) {
  const [form, setForm] = useState({ nom: '', prixAchat: '', prixVente: '', quantite: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(null)

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    setErrors(err => ({ ...err, [k]: undefined }))
  }

  function validate() {
    const errs = {}
    if (!form.nom.trim()) errs.nom = 'Requis'
    if (!form.prixAchat || +form.prixAchat <= 0) errs.prixAchat = 'Requis'
    if (!form.prixVente || +form.prixVente <= 0) errs.prixVente = 'Requis'
    if (+form.prixVente <= +form.prixAchat) errs.prixVente = 'Doit être > prix d\'achat'
    if (!form.quantite || +form.quantite < 1) errs.quantite = 'Requis'
    if (+form.quantite > 500) errs.quantite = 'Max 500'
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
      setTimeout(() => onSuccess(), 1200)
    } catch {
      setErrors({ global: 'Erreur lors de la création' })
      setLoading(false)
    }
  }

  const benefice = form.prixVente && form.prixAchat ? parseInt(form.prixVente) - parseInt(form.prixAchat) : null

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-t-[22px] lg:rounded-[22px] w-full max-w-md shadow-modal animate-slide-up lg:my-8 overflow-y-auto" style={{ maxHeight: '92vh' }}>
        <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-white z-10">
          <div className="w-9 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="px-6 pb-8 pt-2">
          {done ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-brand-soft border border-brand-border rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-brand" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Catégorie créée</h3>
              <p className="text-sm text-slate-500 mt-1">{done.produits.length} produit{done.produits.length > 1 ? 's' : ''} ajouté{done.produits.length > 1 ? 's' : ''}</p>
              <p className="text-xs font-mono text-slate-400 mt-1">
                {done.produits[0]?.id} → {done.produits[done.produits.length - 1]?.id}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Nouvelle catégorie</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Chaque produit reçoit un ID unique</p>
                </div>
                <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <Input label="Nom du produit" placeholder="Ex: Maillots Real Madrid" value={form.nom} onChange={set('nom')} error={errors.nom} icon={Layers} />

              <div className="grid grid-cols-2 gap-3">
                <Input label="Prix d'achat (F)" placeholder="4000" value={form.prixAchat} onChange={set('prixAchat')} error={errors.prixAchat} type="number" inputMode="numeric" />
                <Input label="Prix de vente (F)" placeholder="6000" value={form.prixVente} onChange={set('prixVente')} error={errors.prixVente} type="number" inputMode="numeric" />
              </div>

              <Input label="Quantité" placeholder="15" value={form.quantite} onChange={set('quantite')} error={errors.quantite} type="number" inputMode="numeric" min="1" max="500" />

              {benefice !== null && benefice > 0 && (
                <div className="bg-brand-soft border border-brand-border rounded-[10px] px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-brand font-medium">Bénéfice par unité</span>
                  <span className="text-sm font-bold text-brand">{fmt(benefice)}</span>
                </div>
              )}

              {errors.global && <p className="text-sm text-red-600">{errors.global}</p>}

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" size="lg" className="flex-1" onClick={onClose} type="button">Annuler</Button>
                <Button size="lg" className="flex-1" loading={loading} type="submit">Créer</Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
