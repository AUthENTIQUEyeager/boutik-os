/**
 * BoutiK - Page Gestion du stock
 */
import { useState, useEffect } from 'react'
import { useApp } from '../store/AppContext'
import { getCategoriesByBoutique, getProduitsByBoutique, deleteCategorie } from '../lib/db'
import { Card, Badge, EmptyState, Spinner, Button } from '../components/ui'
import AddCategorieModal from '../components/modals/AddCategorieModal'

const formatCFA = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' F'

export default function Stock() {
  const { boutique, refreshStats } = useApp()
  const [categories, setCategories] = useState([])
  const [produits, setProduits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [view, setView] = useState('categories') // categories | produits

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
    if (!confirm('Supprimer cette catégorie et ses produits non vendus ?')) return
    await deleteCategorie(catId)
    await load()
    await refreshStats()
  }

  const disponibles = produits.filter(p => !p.vendu)
  const vendus = produits.filter(p => p.vendu)

  const catsAvecStats = categories.map(cat => {
    const catProduits = produits.filter(p => p.categorieId === cat.id)
    const dispo = catProduits.filter(p => !p.vendu)
    const vendu = catProduits.filter(p => p.vendu)
    return {
      ...cat,
      total: catProduits.length,
      disponible: dispo.length,
      vendu: vendu.length,
      ca: vendu.reduce((s, p) => s + p.prixVente, 0),
      benefice: vendu.reduce((s, p) => s + (p.prixVente - p.prixAchat), 0),
      isLow: dispo.length <= 3 && dispo.length > 0,
      isOut: dispo.length === 0 && catProduits.length > 0
    }
  })

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-ink">Stock</h1>
        <Button size="sm" onClick={() => setShowAdd(true)}>+ Catégorie</Button>
      </div>

      {/* Résumé global */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-paper-soft rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-ink">{disponibles.length}</p>
          <p className="text-[10px] text-ink-muted mt-0.5">En stock</p>
        </div>
        <div className="bg-paper-soft rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-ink">{vendus.length}</p>
          <p className="text-[10px] text-ink-muted mt-0.5">Vendus</p>
        </div>
        <div className="bg-paper-soft rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-ink">{categories.length}</p>
          <p className="text-[10px] text-ink-muted mt-0.5">Catégories</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('categories')}
          className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${view === 'categories' ? 'bg-ink text-white' : 'bg-paper-soft text-ink-muted'}`}
        >
          Catégories
        </button>
        <button
          onClick={() => setView('produits')}
          className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${view === 'produits' ? 'bg-ink text-white' : 'bg-paper-soft text-ink-muted'}`}
        >
          Produits
        </button>
      </div>

      {/* Vue catégories */}
      {view === 'categories' && (
        <div className="space-y-3">
          {catsAvecStats.length === 0 ? (
            <EmptyState
              title="Aucune catégorie"
              description="Commencez par ajouter vos produits"
              action={<Button size="sm" onClick={() => setShowAdd(true)}>Ajouter</Button>}
            />
          ) : (
            catsAvecStats.map(cat => (
              <Card key={cat.id}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{cat.nom}</p>
                      <p className="text-xs font-mono text-ink-muted">{cat.prefix}-XXXX</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {cat.isLow && <Badge variant="warning">Bas</Badge>}
                      {cat.isOut && <Badge variant="danger">Épuisé</Badge>}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-paper-soft rounded-lg py-2">
                      <p className="text-base font-bold text-ink">{cat.disponible}</p>
                      <p className="text-[10px] text-ink-muted">Dispo</p>
                    </div>
                    <div className="bg-paper-soft rounded-lg py-2">
                      <p className="text-base font-bold text-ink">{cat.vendu}</p>
                      <p className="text-[10px] text-ink-muted">Vendus</p>
                    </div>
                    <div className="bg-paper-soft rounded-lg py-2">
                      <p className="text-base font-bold text-ink">{cat.total}</p>
                      <p className="text-[10px] text-ink-muted">Total</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-muted">Achat: {formatCFA(cat.prixAchat)} / Vente: {formatCFA(cat.prixVente)}</span>
                    {cat.benefice > 0 && (
                      <span className="text-accent-success font-medium">+{formatCFA(cat.benefice)}</span>
                    )}
                  </div>

                  {cat.disponible === 0 && (
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="w-full py-2 text-xs text-accent-danger hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Supprimer la catégorie
                    </button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Vue produits */}
      {view === 'produits' && (
        <div className="space-y-2">
          <p className="text-xs text-ink-muted">{disponibles.length} produits disponibles</p>
          {disponibles.length === 0 ? (
            <EmptyState title="Stock épuisé" description="Tous les produits ont été vendus" />
          ) : (
            <Card padding={false} className="overflow-hidden">
              {disponibles.map((p, i) => (
                <div key={p.id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-paper-border' : ''}`}>
                  <div>
                    <p className="text-xs font-mono font-medium text-ink">{p.id}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{p.nom}</p>
                  </div>
                  <p className="text-sm font-semibold text-ink">{formatCFA(p.prixVente)}</p>
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
