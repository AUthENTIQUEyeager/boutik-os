/**
 * BoutiK - Page d'accueil / Dashboard
 */
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../store/AppContext'
import { getProduitsByBoutique, getCategoriesByBoutique } from '../lib/db'
import { StatCard, Card, Badge, Button, EmptyState, Spinner } from '../components/ui'
import SellModal from '../components/modals/SellModal'
import AddCategorieModal from '../components/modals/AddCategorieModal'
import { formatCFA as _formatCFA } from '../lib/utils'
const formatCFA = _formatCFA

export default function Dashboard() {
  const { boutique, stats, refreshStats } = useApp()
  const [produits, setProduits] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProduit, setSelectedProduit] = useState(null)
  const [showAddCategorie, setShowAddCategorie] = useState(false)
  const [filter, setFilter] = useState('all') // all | cat_id

  const load = useCallback(async () => {
    if (!boutique) return
    try {
      const [cats, prods] = await Promise.all([
        getCategoriesByBoutique(boutique.id),
        getProduitsByBoutique(boutique.id)
      ])
      setCategories(cats)
      setProduits(prods)
    } finally {
      setLoading(false)
    }
  }, [boutique])

  useEffect(() => { load() }, [load])

  const handleVenteComplete = async () => {
    setSelectedProduit(null)
    await load()
    await refreshStats()
  }

  const handleCategorieAdded = async () => {
    setShowAddCategorie(false)
    await load()
    await refreshStats()
  }

  const produitsDisponibles = produits.filter(p => !p.vendu)
  const produitsFiltres = filter === 'all'
    ? produitsDisponibles
    : produitsDisponibles.filter(p => p.categorieId === filter)

  // Grouper par catégorie pour afficher les cartes
  const categoriesAvecStock = categories.map(cat => ({
    ...cat,
    stockRestant: produitsDisponibles.filter(p => p.categorieId === cat.id).length,
    premierProduit: produitsDisponibles.find(p => p.categorieId === cat.id)
  })).filter(c => c.stockRestant > 0 || categories.length > 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Bonjour */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-base font-semibold text-ink">
            {getGreeting()}, {boutique?.nom?.split(' ')[0] || 'Gérant'}
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddCategorie(true)}>
          + Catégorie
        </Button>
      </div>

      {/* Stats du jour */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Bénéfice du jour"
            value={formatCFA(stats.beneficeJour)}
            sub={`${stats.ventesJour} vente${stats.ventesJour > 1 ? 's' : ''}`}
            variant={stats.beneficeJour > 0 ? 'success' : 'default'}
          />
          <StatCard
            label="Stock disponible"
            value={stats.stockTotal}
            sub={`${stats.totalCategories} catégorie${stats.totalCategories > 1 ? 's' : ''}`}
          />
        </div>
      )}

      {/* Alertes stock faible */}
      {stats?.produitsFaibleStock?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
          <p className="text-xs font-semibold text-amber-800">Stock faible</p>
          {stats.produitsFaibleStock.map(cat => (
            <div key={cat.id} className="flex items-center justify-between">
              <span className="text-xs text-amber-700">{cat.nom}</span>
              <Badge variant="warning">{cat.stockRestant} restant{cat.stockRestant > 1 ? 's' : ''}</Badge>
            </div>
          ))}
        </div>
      )}

      {/* Filtre catégories */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setFilter('all')}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === 'all' ? 'bg-ink text-white' : 'bg-paper-soft text-ink-muted'}`}
          >
            Tous
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === cat.id ? 'bg-ink text-white' : 'bg-paper-soft text-ink-muted'}`}
            >
              {cat.nom}
            </button>
          ))}
        </div>
      )}

      {/* Produits - vue catégories */}
      {filter === 'all' ? (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Catégories</h2>
          {categoriesAvecStock.length === 0 ? (
            <EmptyState
              title="Aucun produit"
              description="Ajoutez votre première catégorie de produits"
              action={
                <Button size="sm" onClick={() => setShowAddCategorie(true)}>
                  Ajouter une catégorie
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {categoriesAvecStock.map(cat => (
                <CategorieCard
                  key={cat.id}
                  categorie={cat}
                  onVente={() => cat.premierProduit && setSelectedProduit(cat.premierProduit)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
            {produitsFiltres.length} produit{produitsFiltres.length > 1 ? 's' : ''} disponible{produitsFiltres.length > 1 ? 's' : ''}
          </h2>
          {produitsFiltres.length === 0 ? (
            <EmptyState title="Stock épuisé" description="Tous les produits de cette catégorie ont été vendus" />
          ) : (
            <div className="space-y-2">
              {produitsFiltres.map(p => (
                <ProduitRow key={p.id} produit={p} onSelect={() => setSelectedProduit(p)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dernières ventes */}
      {stats?.dernieresVentes?.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Dernières ventes</h2>
          <Card padding={false} className="overflow-hidden">
            {stats.dernieresVentes.slice(0, 5).map((v, i) => (
              <div key={v.id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-paper-border' : ''}`}>
                <div>
                  <p className="text-sm font-medium text-ink">{v.nomProduit}</p>
                  <p className="text-xs text-ink-muted">{formatDate(v.date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-ink">{formatCFA(v.prixVente)}</p>
                  <p className="text-xs text-accent-success">+{formatCFA(v.benefice)}</p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Modals */}
      {selectedProduit && (
        <SellModal
          produit={selectedProduit}
          boutiqueId={boutique.id}
          onClose={() => setSelectedProduit(null)}
          onSuccess={handleVenteComplete}
        />
      )}
      {showAddCategorie && (
        <AddCategorieModal
          boutiqueId={boutique.id}
          onClose={() => setShowAddCategorie(false)}
          onSuccess={handleCategorieAdded}
        />
      )}
    </div>
  )
}

function CategorieCard({ categorie, onVente }) {
  const isLow = categorie.stockRestant <= 3
  return (
    <Card
      onClick={onVente}
      className={`relative ${!categorie.premierProduit ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <p className="text-sm font-semibold text-ink leading-tight line-clamp-2">{categorie.nom}</p>
          {isLow && <Badge variant="warning" className="shrink-0 ml-1">Bas</Badge>}
        </div>
        <p className="text-lg font-bold text-ink">{formatCFA(categorie.prixVente)}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-muted">{categorie.stockRestant} en stock</span>
          <span className="text-xs text-accent-success">+{formatCFA(categorie.prixVente - categorie.prixAchat)}</span>
        </div>
      </div>
    </Card>
  )
}

function ProduitRow({ produit, onSelect }) {
  return (
    <div
      onClick={onSelect}
      className="bg-white border border-paper-border rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-ink/20 transition-colors active:scale-[0.99]"
    >
      <div>
        <p className="text-sm font-medium text-ink">{produit.id}</p>
        <p className="text-xs text-ink-muted">{produit.nom}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-ink">{formatCFA(produit.prixVente)}</p>
        <p className="text-xs text-ink-muted">Vendre</p>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

function formatDate(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
