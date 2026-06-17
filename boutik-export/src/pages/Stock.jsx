/**
 * BoutiK — Page Stock v2
 */
import { useState, useEffect } from 'react'
import { useApp } from '../store/AppContext'
import { getCategoriesByBoutique, getProduitsByBoutique, deleteCategorie } from '../lib/db'
import { Card, Badge, EmptyState, Spinner, Button, SectionHeader } from '../components/ui'
import AddCategorieModal from '../components/modals/AddCategorieModal'
import { Package, Plus, Layers, AlertTriangle } from 'lucide-react'

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' F'

export default function Stock() {
  const { boutique, refreshStats } = useApp()
  const [categories, setCategories] = useState([])
  const [produits, setProduits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [view, setView] = useState('categories')

  async function load() {
    if (!boutique) return
    const [cats, prods] = await Promise.all([
      getCategoriesByBoutique(boutique.id),
      getProduitsByBoutique(boutique.id)
    ])
    setCategories(cats)
    setProduits(prods)
    setLoading(false)
  }

  useEffect(() => { load() }, [boutique])

  async function handleDelete(catId) {
    if (!confirm('Supprimer cette catégorie ?')) return
    await deleteCategorie(catId)
    await load()
    await refreshStats()
  }

  const disponibles = produits.filter(p => !p.vendu)
  const vendus = produits.filter(p => p.vendu)

  const catsStats = categories.map(cat => {
    const catP = produits.filter(p => p.categorieId === cat.id)
    const dispo = catP.filter(p => !p.vendu)
    const vendu = catP.filter(p => p.vendu)
    return {
      ...cat,
      total: catP.length,
      disponible: dispo.length,
      vendu: vendu.length,
      benefice: vendu.reduce((s, p) => s + (p.prixVente - p.prixAchat), 0),
      isLow: dispo.length <= 3 && dispo.length > 0,
      isOut: dispo.length === 0 && catP.length > 0
    }
  })

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div className="px-4 pt-5 pb-4 space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Stock</h1>
          <p className="text-xs text-slate-500 mt-0.5">{disponibles.length} produits disponibles</p>
        </div>
        <Button size="sm" icon={Plus} onClick={() => setShowAdd(true)}>Catégorie</Button>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'En stock', value: disponibles.length, color: 'text-brand' },
          { label: 'Vendus', value: vendus.length, color: 'text-slate-900' },
          { label: 'Catégories', value: categories.length, color: 'text-slate-900' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-[14px] p-3 text-center shadow-card">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-[10px]">
        {[{ k: 'categories', l: 'Catégories' }, { k: 'produits', l: 'Produits' }].map(t => (
          <button
            key={t.k}
            onClick={() => setView(t.k)}
            className={`flex-1 py-1.5 rounded-[8px] text-xs font-medium transition-all ${view === t.k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {/* Vue catégories */}
      {view === 'categories' && (
        <div className="space-y-3">
          {catsStats.length === 0 ? (
            <EmptyState icon={Layers} title="Aucune catégorie" description="Commencez par ajouter vos produits" action={<Button size="sm" icon={Plus} onClick={() => setShowAdd(true)}>Ajouter</Button>} />
          ) : catsStats.map(cat => (
            <Card key={cat.id}>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{cat.nom}</p>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">{cat.prefix}-XXXX</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {cat.isLow && (
                      <Badge variant="warning">
                        <AlertTriangle className="w-2.5 h-2.5" /> Bas
                      </Badge>
                    )}
                    {cat.isOut && <Badge variant="danger">Épuisé</Badge>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Dispo', value: cat.disponible, color: 'text-brand' },
                    { label: 'Vendus', value: cat.vendu, color: 'text-slate-900' },
                    { label: 'Total', value: cat.total, color: 'text-slate-900' },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 rounded-[10px] py-2 text-center">
                      <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-slate-500">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-3">
                  <span className="text-slate-400">{fmt(cat.prixAchat)} → {fmt(cat.prixVente)}</span>
                  {cat.benefice > 0 && <span className="font-medium text-brand">+{fmt(cat.benefice)}</span>}
                </div>

                {cat.isOut && (
                  <button onClick={() => handleDelete(cat.id)} className="w-full py-2 text-xs text-red-500 hover:bg-red-50 rounded-[8px] transition-colors">
                    Supprimer la catégorie
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Vue produits */}
      {view === 'produits' && (
        <div className="space-y-2">
          {disponibles.length === 0 ? (
            <EmptyState icon={Package} title="Stock épuisé" description="Tous les produits ont été vendus" />
          ) : (
            <Card padding={false} className="overflow-hidden">
              {disponibles.map((p, i) => (
                <div key={p.id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                  <div>
                    <p className="text-xs font-mono font-medium text-slate-700">{p.id}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{p.nom}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{fmt(p.prixVente)}</p>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {showAdd && (
        <AddCategorieModal
          boutiqueId={boutique.id}
          onClose={() => setShowAdd(false)}
          onSuccess={async () => { setShowAdd(false); await load(); await refreshStats() }}
        />
      )}
    </div>
  )
}
