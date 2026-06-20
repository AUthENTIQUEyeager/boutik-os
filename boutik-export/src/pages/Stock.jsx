/**
 * BoutiK — Stock
 * Mobile : onglets + listes empilées
 * Desktop : bandeau stats pleine largeur + table dense type ERP, sidebar filtres
 */
import { useState, useEffect } from 'react'
import { useApp } from '../store/AppContext'
import { getCategoriesByBoutique, getProduitsByBoutique, deleteCategorie } from '../lib/db'
import { Card, Badge, EmptyState, Spinner, Button, SectionHeader } from '../components/ui'
import AddCategorieModal from '../components/modals/AddCategorieModal'
import { Package, Plus, Layers, AlertTriangle, Search, Trash2 } from 'lucide-react'

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' F'

export default function Stock() {
  const { boutique, refreshStats } = useApp()
  const [categories, setCategories] = useState([])
  const [produits, setProduits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [view, setView] = useState('categories')
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('all')

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
      ...cat, total: catP.length, disponible: dispo.length, vendu: vendu.length,
      benefice: vendu.reduce((s, p) => s + (p.prixVente - p.prixAchat), 0),
      isLow: dispo.length <= 3 && dispo.length > 0,
      isOut: dispo.length === 0 && catP.length > 0
    }
  })

  const resume = [
    { label: 'En stock', value: disponibles.length, color: 'text-brand' },
    { label: 'Vendus', value: vendus.length, color: 'text-slate-900' },
    { label: 'Catégories', value: categories.length, color: 'text-slate-900' },
    { label: 'Total produits', value: produits.length, color: 'text-slate-900' },
    { label: 'Taux vente', value: produits.length > 0 ? Math.round((vendus.length / produits.length) * 100) + '%' : '0%', color: 'text-brand' },
    { label: 'Stock faible', value: catsStats.filter(c => c.isLow).length, color: 'text-amber-600' },
  ]

  // Produits filtrés desktop (table)
  const produitsFiltres = disponibles.filter(p => {
    const matchCat = activeCat === 'all' || p.categorieId === activeCat
    const matchSearch = !search || p.nom.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <>
      {/* ════════════════ MOBILE ════════════════ */}
      <div className="lg:hidden p-4 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Stock</h1>
            <p className="text-xs text-slate-500 mt-0.5">{disponibles.length} produits disponibles</p>
          </div>
          <Button size="sm" icon={Plus} onClick={() => setShowAdd(true)}>Catégorie</Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {resume.slice(0, 3).map(s => <ResumeCard key={s.label} {...s} />)}
        </div>

        <div className="flex gap-2 bg-slate-100 p-1 rounded-[10px]">
          {[{ k: 'categories', l: 'Catégories' }, { k: 'produits', l: 'Produits' }].map(t => (
            <button key={t.k} onClick={() => setView(t.k)}
              className={`flex-1 py-1.5 rounded-[8px] text-xs font-medium transition-all ${view === t.k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
              {t.l}
            </button>
          ))}
        </div>

        {view === 'categories' ? (
          <CategoriesGrid catsStats={catsStats} cols="grid-cols-1" onAdd={() => setShowAdd(true)} onDelete={handleDelete} />
        ) : (
          <ProduitsListMobile produits={disponibles} />
        )}
      </div>

      {/* ════════════════ DESKTOP ════════════════ */}
      <div className="hidden lg:block animate-fade-in">

        {/* Bandeau supérieur */}
        <div className="bg-white border-b border-slate-200 px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Stock</h1>
              <p className="text-xs text-slate-500 mt-0.5">{disponibles.length} produits disponibles sur {produits.length}</p>
            </div>
            <Button size="md" icon={Plus} onClick={() => setShowAdd(true)}>Nouvelle catégorie</Button>
          </div>

          <div className="grid grid-cols-6 gap-4">
            {resume.map(s => <ResumeCard key={s.label} {...s} large />)}
          </div>
        </div>

        <div className="flex">
          {/* Sidebar catégories */}
          <aside className="w-64 shrink-0 border-r border-slate-200 bg-white p-5 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Catégories</p>
            <nav className="space-y-0.5">
              <CatNavItem label="Toutes" count={disponibles.length} active={activeCat === 'all'} onClick={() => setActiveCat('all')} />
              {categories.map(cat => {
                const count = disponibles.filter(p => p.categorieId === cat.id).length
                return <CatNavItem key={cat.id} label={cat.nom} count={count} active={activeCat === cat.id} onClick={() => setActiveCat(cat.id)} />
              })}
            </nav>

            {catsStats.some(c => c.isLow || c.isOut) && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Attention
                </p>
                <div className="space-y-1.5">
                  {catsStats.filter(c => c.isLow || c.isOut).map(c => (
                    <div key={c.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-[6px] bg-amber-50">
                      <span className="text-amber-700 truncate">{c.nom}</span>
                      <Badge variant={c.isOut ? 'danger' : 'warning'}>{c.disponible}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Zone principale : table produits */}
          <div className="flex-1 p-8 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <SectionHeader title={activeCat === 'all' ? 'Tous les produits' : categories.find(c => c.id === activeCat)?.nom || 'Produits'} />
              <div className="relative w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un produit ou un ID..."
                  className="w-full h-9 pl-9 pr-3 rounded-[8px] border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>
            </div>

            {produitsFiltres.length === 0 ? (
              <EmptyState icon={Package} title="Aucun produit" description="Aucun résultat pour cette recherche" />
            ) : (
              <Card padding={false} className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">ID Produit</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Nom</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Prix achat</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Prix vente</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Marge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produitsFiltres.map((p, i) => (
                      <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                        <td className="px-4 py-3"><span className="text-xs font-mono font-medium text-slate-700">{p.id}</span></td>
                        <td className="px-4 py-3"><span className="text-sm text-slate-700">{p.nom}</span></td>
                        <td className="px-4 py-3 text-right text-sm text-slate-500">{fmt(p.prixAchat)}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{fmt(p.prixVente)}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-brand">+{fmt(p.prixVente - p.prixAchat)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}

            {/* Gestion des catégories vides */}
            {catsStats.some(c => c.isOut) && (
              <div className="mt-8">
                <SectionHeader title="Catégories épuisées" />
                <div className="grid grid-cols-3 gap-3">
                  {catsStats.filter(c => c.isOut).map(cat => (
                    <Card key={cat.id} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">{cat.nom}</span>
                      <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-[6px] transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAdd && (
        <AddCategorieModal boutiqueId={boutique.id} onClose={() => setShowAdd(false)}
          onSuccess={async () => { setShowAdd(false); await load(); await refreshStats() }} />
      )}
    </>
  )
}

function ResumeCard({ label, value, color, large }) {
  return (
    <div className="bg-white border border-slate-200 rounded-[14px] p-3 text-center shadow-card">
      <p className={`${large ? 'text-2xl' : 'text-xl'} font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}

function CatNavItem({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-sm transition-colors ${
        active ? 'bg-brand-soft text-brand font-medium' : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <span className="truncate">{label}</span>
      <span className={`text-xs ${active ? 'text-brand' : 'text-slate-400'}`}>{count}</span>
    </button>
  )
}

function CategoriesGrid({ catsStats, cols, onAdd, onDelete }) {
  if (catsStats.length === 0) {
    return <EmptyState icon={Layers} title="Aucune catégorie" description="Commencez par ajouter vos produits" action={<Button size="sm" icon={Plus} onClick={onAdd}>Ajouter</Button>} />
  }
  return (
    <div className={`grid ${cols} gap-4`}>
      {catsStats.map(cat => (
        <Card key={cat.id}>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{cat.nom}</p>
                <p className="text-xs font-mono text-slate-400 mt-0.5">{cat.prefix}-XXXX</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {cat.isLow && <Badge variant="warning"><AlertTriangle className="w-2.5 h-2.5" /> Bas</Badge>}
                {cat.isOut && <Badge variant="danger">Épuisé</Badge>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[{ label: 'Dispo', value: cat.disponible, color: 'text-brand' }, { label: 'Vendus', value: cat.vendu, color: 'text-slate-900' }, { label: 'Total', value: cat.total, color: 'text-slate-900' }].map(s => (
                <div key={s.label} className="bg-slate-50 rounded-[10px] py-2 text-center">
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2">
              <span className="text-slate-400">{fmt(cat.prixAchat)} → {fmt(cat.prixVente)}</span>
              {cat.benefice > 0 && <span className="font-medium text-brand">+{fmt(cat.benefice)}</span>}
            </div>
            {cat.isOut && (
              <button onClick={() => onDelete(cat.id)} className="w-full py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-[8px] transition-colors">
                Supprimer
              </button>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}

function ProduitsListMobile({ produits }) {
  if (produits.length === 0) return <EmptyState icon={Package} title="Stock épuisé" description="Tous les produits ont été vendus" />
  return (
    <Card padding={false} className="overflow-hidden">
      {produits.map((p, i) => (
        <div key={p.id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
          <div>
            <p className="text-xs font-mono font-medium text-slate-700">{p.id}</p>
            <p className="text-xs text-slate-400 mt-0.5">{p.nom}</p>
          </div>
          <p className="text-sm font-semibold text-slate-900">{fmt(p.prixVente)}</p>
        </div>
      ))}
    </Card>
  )
}
