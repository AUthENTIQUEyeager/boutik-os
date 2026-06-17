/**
 * BoutiK — Dashboard v2
 */
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../store/AppContext'
import { getProduitsByBoutique, getCategoriesByBoutique } from '../lib/db'
import { StatCard, Card, Badge, Button, EmptyState, Spinner, SectionHeader } from '../components/ui'
import SellModal from '../components/modals/SellModal'
import AddCategorieModal from '../components/modals/AddCategorieModal'
import {
  TrendingUp, ShoppingCart, Package, LayoutGrid,
  Plus, AlertTriangle, ChevronRight, ArrowUpRight
} from 'lucide-react'

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' F'

export default function Dashboard() {
  const { boutique, stats, refreshStats } = useApp()
  const [produits, setProduits] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProduit, setSelectedProduit] = useState(null)
  const [showAddCategorie, setShowAddCategorie] = useState(false)
  const [filterCat, setFilterCat] = useState('all')

  const load = useCallback(async () => {
    if (!boutique) return
    const [cats, prods] = await Promise.all([
      getCategoriesByBoutique(boutique.id),
      getProduitsByBoutique(boutique.id)
    ])
    setCategories(cats)
    setProduits(prods)
    setLoading(false)
  }, [boutique])

  useEffect(() => { load() }, [load])

  const disponibles = produits.filter(p => !p.vendu)
  const catsFiltrees = filterCat === 'all'
    ? categories
    : categories.filter(c => c.id === filterCat)

  const catsAvecStock = catsFiltrees.map(cat => ({
    ...cat,
    stockRestant: disponibles.filter(p => p.categorieId === cat.id).length,
    premierProduit: disponibles.find(p => p.categorieId === cat.id)
  }))

  const handleVenteOk = async () => {
    setSelectedProduit(null)
    await load()
    await refreshStats()
  }

  const handleCatOk = async () => {
    setShowAddCategorie(false)
    await load()
    await refreshStats()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  )

  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="px-4 pt-5 pb-4 space-y-6 animate-fade-in">

      {/* ── Greeting ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-lg font-semibold text-slate-900 mt-0.5">
            {greet}, {boutique?.nom?.split(' ')[0] || 'Gérant'}
          </h1>
        </div>
        <Button size="sm" icon={Plus} onClick={() => setShowAddCategorie(true)}>
          Catégorie
        </Button>
      </div>

      {/* ── Stats ── */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Bénéfice jour"
            value={fmt(stats.beneficeJour)}
            sub={`${stats.ventesJour} vente${stats.ventesJour > 1 ? 's' : ''}`}
            icon={TrendingUp}
            variant={stats.beneficeJour > 0 ? 'brand' : 'default'}
          />
          <StatCard
            label="Stock dispo"
            value={stats.stockTotal}
            sub={`${stats.totalCategories} catégorie${stats.totalCategories > 1 ? 's' : ''}`}
            icon={Package}
          />
        </div>
      )}

      {/* ── Alertes stock faible ── */}
      {stats?.produitsFaibleStock?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-[14px] p-3 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <p className="text-xs font-semibold text-amber-800">Stock faible</p>
          </div>
          {stats.produitsFaibleStock.map(cat => (
            <div key={cat.id} className="flex items-center justify-between">
              <span className="text-xs text-amber-700">{cat.nom}</span>
              <Badge variant="warning">{cat.stockRestant} restant{cat.stockRestant > 1 ? 's' : ''}</Badge>
            </div>
          ))}
        </div>
      )}

      {/* ── Filtre catégories ── */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
          <FilterPill active={filterCat === 'all'} onClick={() => setFilterCat('all')}>Tous</FilterPill>
          {categories.map(cat => (
            <FilterPill key={cat.id} active={filterCat === cat.id} onClick={() => setFilterCat(cat.id)}>
              {cat.nom}
            </FilterPill>
          ))}
        </div>
      )}

      {/* ── Grille catégories ── */}
      <div>
        <SectionHeader
          title="Produits"
          action={
            <span className="text-xs text-slate-400">{disponibles.length} en stock</span>
          }
        />
        {catsAvecStock.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Aucun produit"
            description="Ajoutez votre première catégorie pour commencer"
            action={
              <Button size="sm" icon={Plus} onClick={() => setShowAddCategorie(true)}>
                Ajouter une catégorie
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {catsAvecStock.map(cat => (
              <CatCard
                key={cat.id}
                cat={cat}
                onPress={() => cat.premierProduit && setSelectedProduit(cat.premierProduit)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Dernières ventes ── */}
      {stats?.dernieresVentes?.length > 0 && (
        <div>
          <SectionHeader title="Dernières ventes" />
          <Card padding={false} className="overflow-hidden">
            {stats.dernieresVentes.slice(0, 5).map((v, i) => (
              <div key={v.id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{v.nomProduit}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(v.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <p className="text-sm font-semibold text-slate-900">{fmt(v.prixVente)}</p>
                  <p className="text-xs text-brand">+{fmt(v.benefice)}</p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ── Modals ── */}
      {selectedProduit && (
        <SellModal produit={selectedProduit} boutiqueId={boutique.id} onClose={() => setSelectedProduit(null)} onSuccess={handleVenteOk} />
      )}
      {showAddCategorie && (
        <AddCategorieModal boutiqueId={boutique.id} onClose={() => setShowAddCategorie(false)} onSuccess={handleCatOk} />
      )}
    </div>
  )
}

function FilterPill({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all ${
        active ? 'bg-brand text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  )
}

function CatCard({ cat, onPress }) {
  const isLow = cat.stockRestant > 0 && cat.stockRestant <= 3
  const isEmpty = cat.stockRestant === 0

  return (
    <div
      onClick={!isEmpty ? onPress : undefined}
      className={`bg-white border rounded-[14px] p-3.5 shadow-card transition-all ${
        isEmpty
          ? 'border-slate-100 opacity-50'
          : 'border-slate-200 hover:border-brand/40 hover:shadow-card-hover cursor-pointer active:scale-[0.98]'
      }`}
    >
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-1">
          <p className="text-sm font-semibold text-slate-900 leading-tight line-clamp-2">{cat.nom}</p>
          {isLow && <Badge variant="warning">Bas</Badge>}
          {isEmpty && <Badge variant="danger">0</Badge>}
        </div>
        <p className="text-lg font-bold text-slate-950">{fmt(cat.prixVente)}</p>
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-400">{cat.stockRestant} restant{cat.stockRestant > 1 ? 's' : ''}</span>
          <span className="text-xs font-medium text-brand">+{fmt(cat.prixVente - cat.prixAchat)}</span>
        </div>
      </div>
    </div>
  )
}
