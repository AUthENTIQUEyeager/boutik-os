/**
 * BoutiK — Dashboard
 * Mobile : flux vertical simple
 * Desktop : vraie disposition SaaS — bandeau stats pleine largeur,
 * zone produits principale + colonne activité fixe à droite
 */
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../store/AppContext'
import { getProduitsByBoutique, getCategoriesByBoutique } from '../lib/db'
import { StatCard, Card, Badge, Button, EmptyState, Spinner, SectionHeader } from '../components/ui'
import SellModal from '../components/modals/SellModal'
import AddCategorieModal from '../components/modals/AddCategorieModal'
import VenteRapideModal from '../components/modals/VenteRapideModal'
import { TrendingUp, Package, Plus, AlertTriangle, Zap, ArrowUpRight } from 'lucide-react'

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' F'

export default function Dashboard() {
  const { boutique, stats, refreshStats } = useApp()
  const [produits, setProduits] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProduit, setSelectedProduit] = useState(null)
  const [showAddCategorie, setShowAddCategorie] = useState(false)
  const [showVenteRapide, setShowVenteRapide] = useState(false)
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
  const catsFiltrees = filterCat === 'all' ? categories : categories.filter(c => c.id === filterCat)
  const catsAvecStock = catsFiltrees.map(cat => ({
    ...cat,
    stockRestant: disponibles.filter(p => p.categorieId === cat.id).length,
    premierProduit: disponibles.find(p => p.categorieId === cat.id)
  }))

  const handleVenteOk = async () => {
    setSelectedProduit(null)
    setShowVenteRapide(false)
    await load()
    await refreshStats()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <>
      {/* ════════════════ MOBILE ════════════════ */}
      <div className="lg:hidden p-4 space-y-6 animate-fade-in">
        <MobileHeader greet={greet} boutique={boutique} onVenteRapide={() => setShowVenteRapide(true)} onAddCat={() => setShowAddCategorie(true)} />

        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Bénéfice du jour" value={fmt(stats.beneficeJour)} sub={`${stats.ventesJour} vente${stats.ventesJour > 1 ? 's' : ''}`} icon={TrendingUp} variant={stats.beneficeJour > 0 ? 'brand' : 'default'} />
            <StatCard label="Stock disponible" value={stats.stockTotal} sub={`${stats.totalCategories} catégorie${stats.totalCategories > 1 ? 's' : ''}`} icon={Package} />
          </div>
        )}

        <AlertesStock stats={stats} compact />

        <FilterBar categories={categories} filterCat={filterCat} setFilterCat={setFilterCat} />

        <ProduitsGrid catsAvecStock={catsAvecStock} cols="grid-cols-2" onAddCat={() => setShowAddCategorie(true)} onSelect={setSelectedProduit} disponibles={disponibles} />

        <DernieresVentes stats={stats} limit={5} />
      </div>

      {/* ════════════════ DESKTOP ════════════════ */}
      <div className="hidden lg:block animate-fade-in">

        {/* Bandeau supérieur pleine largeur */}
        <div className="bg-white border-b border-slate-200 px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-slate-500 font-medium">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <h1 className="text-2xl font-semibold text-slate-900 mt-0.5">
                {greet}, {boutique?.nom?.split(' ')[0] || 'Gérant'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowVenteRapide(true)}
                className="flex items-center gap-2 h-10 px-4 rounded-[10px] border border-brand text-brand bg-brand-soft hover:bg-brand hover:text-white transition-all text-sm font-semibold"
              >
                <Zap className="w-4 h-4" />
                Vente rapide
              </button>
              <Button size="md" icon={Plus} onClick={() => setShowAddCategorie(true)}>Nouvelle catégorie</Button>
            </div>
          </div>

          {/* Stats — 4 colonnes pleine largeur */}
          {stats && (
            <div className="grid grid-cols-4 gap-4">
              <StatCard label="Bénéfice du jour" value={fmt(stats.beneficeJour)} sub={`${stats.ventesJour} vente${stats.ventesJour > 1 ? 's' : ''}`} icon={TrendingUp} variant={stats.beneficeJour > 0 ? 'brand' : 'default'} />
              <StatCard label="Stock disponible" value={stats.stockTotal} sub={`${stats.totalCategories} catégorie${stats.totalCategories > 1 ? 's' : ''}`} icon={Package} />
              <StatCard label="Bénéfice total" value={fmt(stats.beneficeTotal || 0)} sub="Depuis le début" icon={TrendingUp} variant="brand" />
              <StatCard label="Total ventes" value={stats.ventesTotal || 0} sub="Toutes périodes" icon={Package} />
            </div>
          )}
        </div>

        {/* Corps : zone principale (produits) + colonne fixe (activité) */}
        <div className="flex">

          {/* Zone principale produits */}
          <div className="flex-1 p-8 space-y-5 min-w-0">
            <AlertesStock stats={stats} />

            <div className="flex items-center justify-between">
              <SectionHeader title="Produits" />
              <span className="text-xs text-slate-400">{disponibles.length} unités en stock</span>
            </div>

            <FilterBar categories={categories} filterCat={filterCat} setFilterCat={setFilterCat} />

            <ProduitsGrid catsAvecStock={catsAvecStock} cols="grid-cols-4 xl:grid-cols-5" onAddCat={() => setShowAddCategorie(true)} onSelect={setSelectedProduit} disponibles={disponibles} />
          </div>

          {/* Colonne latérale fixe — activité récente */}
          <aside className="w-80 shrink-0 border-l border-slate-200 bg-white p-6 space-y-5 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Activité récente</p>
              {stats?.dernieresVentes?.length > 0 ? (
                <div className="space-y-1">
                  {stats.dernieresVentes.slice(0, 12).map(v => (
                    <div key={v.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{v.nomProduit}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(v.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right ml-2 shrink-0">
                        <p className="text-sm font-semibold text-slate-900">{fmt(v.prixVente)}</p>
                        <p className="text-xs text-brand">+{fmt(v.benefice)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Aucune vente pour le moment</p>
              )}
            </div>

            {stats?.produitsFaibleStock?.length > 0 && (
              <div className="pt-5 border-t border-slate-100">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Stock faible
                </p>
                <div className="space-y-2">
                  {stats.produitsFaibleStock.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-[8px] px-3 py-2">
                      <span className="text-xs text-amber-700 truncate">{cat.nom}</span>
                      <Badge variant="warning">{cat.stockRestant}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Modals */}
      {selectedProduit && (
        <SellModal produit={selectedProduit} boutiqueId={boutique.id} onClose={() => setSelectedProduit(null)} onSuccess={handleVenteOk} />
      )}
      {showAddCategorie && (
        <AddCategorieModal boutiqueId={boutique.id} onClose={() => setShowAddCategorie(false)} onSuccess={async () => { setShowAddCategorie(false); await load(); await refreshStats() }} />
      )}
      {showVenteRapide && (
        <VenteRapideModal boutiqueId={boutique.id} onClose={() => setShowVenteRapide(false)} onSuccess={handleVenteOk} />
      )}
    </>
  )
}

// ─── Sous-composants partagés ────────────────────────────────────────────────

function MobileHeader({ greet, boutique, onVenteRapide, onAddCat }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-slate-500 font-medium">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="text-xl font-semibold text-slate-900 mt-0.5">
          {greet}, {boutique?.nom?.split(' ')[0] || 'Gérant'}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onVenteRapide} className="flex items-center gap-1.5 h-9 px-3 rounded-[10px] border border-brand text-brand bg-brand-soft text-xs font-semibold">
          <Zap className="w-3.5 h-3.5" />
          Vente
        </button>
        <Button size="sm" icon={Plus} onClick={onAddCat}>+</Button>
      </div>
    </div>
  )
}

function AlertesStock({ stats, compact }) {
  if (!stats?.produitsFaibleStock?.length) return null
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-[14px] p-3 lg:p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        <p className="text-xs font-semibold text-amber-800">Stock faible</p>
      </div>
      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-3'} gap-2`}>
        {stats.produitsFaibleStock.map(cat => (
          <div key={cat.id} className="flex items-center justify-between bg-amber-100/50 rounded-[8px] px-3 py-1.5">
            <span className="text-xs text-amber-700">{cat.nom}</span>
            <Badge variant="warning">{cat.stockRestant} restant{cat.stockRestant > 1 ? 's' : ''}</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

function FilterBar({ categories, filterCat, setFilterCat }) {
  if (!categories.length) return null
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <FilterPill active={filterCat === 'all'} onClick={() => setFilterCat('all')}>Tous</FilterPill>
      {categories.map(cat => (
        <FilterPill key={cat.id} active={filterCat === cat.id} onClick={() => setFilterCat(cat.id)}>
          {cat.nom}
        </FilterPill>
      ))}
    </div>
  )
}

function ProduitsGrid({ catsAvecStock, cols, onAddCat, onSelect }) {
  if (catsAvecStock.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Aucun produit"
        description="Ajoutez votre première catégorie"
        action={<Button size="sm" icon={Plus} onClick={onAddCat}>Ajouter</Button>}
      />
    )
  }
  return (
    <div className={`grid ${cols} gap-3 lg:gap-4`}>
      {catsAvecStock.map(cat => (
        <CatCard key={cat.id} cat={cat} onPress={() => cat.premierProduit && onSelect(cat.premierProduit)} />
      ))}
    </div>
  )
}

function DernieresVentes({ stats, limit }) {
  if (!stats?.dernieresVentes?.length) return null
  return (
    <div>
      <SectionHeader title="Dernières ventes" />
      <Card padding={false} className="overflow-hidden">
        {stats.dernieresVentes.slice(0, limit).map((v, i) => (
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
      className={`bg-white border rounded-[14px] p-3.5 shadow-card transition-all flex flex-col ${
        isEmpty ? 'border-slate-100 opacity-50' : 'border-slate-200 hover:border-brand/40 hover:shadow-card-hover cursor-pointer active:scale-[0.98]'
      }`}
    >
      <div className="flex items-start justify-between gap-1 mb-2">
        <p className="text-sm font-semibold text-slate-900 leading-tight line-clamp-2">{cat.nom}</p>
        {isLow && <Badge variant="warning">Bas</Badge>}
        {isEmpty && <Badge variant="danger">0</Badge>}
      </div>
      <p className="text-lg font-bold text-slate-950 mb-auto">{fmt(cat.prixVente)}</p>
      <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">{cat.stockRestant} restant{cat.stockRestant > 1 ? 's' : ''}</span>
          <span className="text-xs font-medium text-brand">+{fmt(cat.prixVente - cat.prixAchat)}</span>
        </div>
        {!isEmpty && (
          <div className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-brand-soft border border-brand-border rounded-[8px]">
            <span className="text-xs font-semibold text-brand">Vendre</span>
          </div>
        )}
      </div>
    </div>
  )
}
