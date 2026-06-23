/**
 * BoutiK — Page Dépenses
 */
import { useState, useEffect } from 'react'
import { useApp } from '../store/AppContext'
import { creerDepense, getDepenses, supprimerDepense, CATEGORIES_DEPENSES } from '../lib/db-extras'
import { Card, Badge, Button, Input, EmptyState, Spinner } from '../components/ui'
import { Plus, X, Wallet, Trash2, ChevronDown } from 'lucide-react'

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0) + ' F'
const fmtDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
const fmtDT = (iso) => new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

const CAT_COLORS = {
  stock:       'bg-blue-50 text-blue-700 border-blue-200',
  transport:   'bg-purple-50 text-purple-700 border-purple-200',
  loyer:       'bg-orange-50 text-orange-700 border-orange-200',
  electricite: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  salaire:     'bg-green-50 text-green-700 border-green-200',
  autre:       'bg-slate-100 text-slate-600 border-slate-200',
}

export default function Depenses() {
  const { boutique } = useApp()
  const [depenses, setDepenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filtreCat, setFiltreCat] = useState('all')
  const [filtrePeriode, setFiltrePeriode] = useState('month')

  async function load() {
    if (!boutique) return
    const data = await getDepenses(boutique.id)
    setDepenses(data.reverse())
    setLoading(false)
  }

  useEffect(() => { load() }, [boutique])

  async function handleDelete(id) {
    if (!confirm('Supprimer cette dépense ?')) return
    await supprimerDepense(id)
    load()
  }

  const now = new Date()
  const filtered = depenses.filter(d => {
    const dd = new Date(d.date)
    const matchPeriode = filtrePeriode === 'all' ? true
      : filtrePeriode === 'today' ? dd.toDateString() === now.toDateString()
      : filtrePeriode === 'week' ? (now - dd) <= 7 * 86400000
      : dd.getMonth() === now.getMonth() && dd.getFullYear() === now.getFullYear()
    const matchCat = filtreCat === 'all' || d.categorie === filtreCat
    return matchPeriode && matchCat
  })

  const totalFiltered = filtered.reduce((s, d) => s + d.montant, 0)
  const totalMois = depenses.filter(d => {
    const dd = new Date(d.date)
    return dd.getMonth() === now.getMonth() && dd.getFullYear() === now.getFullYear()
  }).reduce((s, d) => s + d.montant, 0)
  const totalGlobal = depenses.reduce((s, d) => s + d.montant, 0)

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <>
      {/* ── MOBILE ── */}
      <div className="lg:hidden p-4 space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Dépenses</h1>
            <p className="text-xs text-slate-500 mt-0.5">{depenses.length} entrées · {fmt(totalMois)} ce mois</p>
          </div>
          <Button size="sm" icon={Plus} onClick={() => setShowForm(true)}>Ajouter</Button>
        </div>

        <PeriodePills filtrePeriode={filtrePeriode} setFiltrePeriode={setFiltrePeriode} />
        <CatPills filtreCat={filtreCat} setFiltreCat={setFiltreCat} />

        {filtered.length === 0 ? (
          <EmptyState icon={Wallet} title="Aucune dépense" description="Suivez vos charges et dépenses" action={<Button size="sm" icon={Plus} onClick={() => setShowForm(true)}>Ajouter</Button>} />
        ) : (
          <>
            <div className="bg-red-50 border border-red-200 rounded-[14px] px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-red-600">Total affiché</span>
              <span className="text-lg font-bold text-red-700">{fmt(totalFiltered)}</span>
            </div>
            <div className="space-y-2">
              {filtered.map(d => <DepenseRow key={d.id} depense={d} onDelete={() => handleDelete(d.id)} />)}
            </div>
          </>
        )}
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden lg:block animate-fade-in">
        <div className="bg-white border-b border-slate-200 px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Dépenses</h1>
              <p className="text-xs text-slate-500 mt-0.5">Suivez vos charges et coûts d'exploitation</p>
            </div>
            <Button size="md" icon={Plus} onClick={() => setShowForm(true)}>Nouvelle dépense</Button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <StatBlock label="Ce mois" value={fmt(totalMois)} accent />
            <StatBlock label="Total global" value={fmt(totalGlobal)} />
            <StatBlock label="Nombre ce mois" value={depenses.filter(d => { const dd = new Date(d.date); return dd.getMonth() === now.getMonth() }).length} />
            <StatBlock label="Dépenses aujourd'hui" value={fmt(depenses.filter(d => new Date(d.date).toDateString() === now.toDateString()).reduce((s, d) => s + d.montant, 0))} />
          </div>
        </div>

        <div className="flex">
          {/* Sidebar filtres */}
          <aside className="w-56 shrink-0 border-r border-slate-200 bg-white p-5 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Période</p>
            <nav className="space-y-0.5 mb-5">
              {[{ k: 'today', l: "Aujourd'hui" }, { k: 'week', l: '7 derniers jours' }, { k: 'month', l: 'Ce mois' }, { k: 'all', l: 'Tout' }].map(f => (
                <button key={f.k} onClick={() => setFiltrePeriode(f.k)}
                  className={`w-full flex items-center px-3 py-2 rounded-[8px] text-sm text-left transition-colors ${filtrePeriode === f.k ? 'bg-brand-soft text-brand font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
                  {f.l}
                </button>
              ))}
            </nav>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Catégorie</p>
            <nav className="space-y-0.5">
              <button onClick={() => setFiltreCat('all')}
                className={`w-full flex items-center px-3 py-2 rounded-[8px] text-sm text-left transition-colors ${filtreCat === 'all' ? 'bg-brand-soft text-brand font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
                Toutes
              </button>
              {CATEGORIES_DEPENSES.map(c => (
                <button key={c.value} onClick={() => setFiltreCat(c.value)}
                  className={`w-full flex items-center px-3 py-2 rounded-[8px] text-sm text-left transition-colors ${filtreCat === c.value ? 'bg-brand-soft text-brand font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
                  {c.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Table */}
          <div className="flex-1 p-8 min-w-0 space-y-4">
            {filtered.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">{filtered.length} dépense{filtered.length > 1 ? 's' : ''}</p>
                <div className="bg-red-50 border border-red-200 rounded-[10px] px-4 py-2 flex items-center gap-3">
                  <span className="text-xs text-red-600">Total</span>
                  <span className="text-base font-bold text-red-700">{fmt(totalFiltered)}</span>
                </div>
              </div>
            )}

            {filtered.length === 0 ? (
              <EmptyState icon={Wallet} title="Aucune dépense" description="Ajustez les filtres ou ajoutez une dépense" action={<Button size="sm" icon={Plus} onClick={() => setShowForm(true)}>Ajouter</Button>} />
            ) : (
              <Card padding={false} className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      {['Date', 'Catégorie', 'Description', 'Montant', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((d, i) => (
                      <tr key={d.id} className={`hover:bg-slate-50 transition-colors ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                        <td className="px-4 py-3 text-sm text-slate-500">{fmtDT(d.date)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${CAT_COLORS[d.categorie] || CAT_COLORS.autre}`}>
                            {CATEGORIES_DEPENSES.find(c => c.value === d.categorie)?.label || d.categorie}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">{d.description || '—'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-red-600">{fmt(d.montant)}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleDelete(d.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        </div>
      </div>

      {showForm && <NouvelleDepenseModal boutiqueId={boutique.id} onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); load() }} />}
    </>
  )
}

function DepenseRow({ depense: d, onDelete }) {
  return (
    <div className="bg-white border border-slate-200 rounded-[12px] px-4 py-3 flex items-center justify-between shadow-card">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${CAT_COLORS[d.categorie] || CAT_COLORS.autre}`}>
            {CATEGORIES_DEPENSES.find(c => c.value === d.categorie)?.label || d.categorie}
          </span>
        </div>
        <p className="text-xs text-slate-500">{d.description || fmtDate(d.date)}</p>
      </div>
      <div className="flex items-center gap-3 ml-3 shrink-0">
        <p className="text-sm font-bold text-red-600">{fmt(d.montant)}</p>
        <button onClick={onDelete} className="text-slate-300 hover:text-red-400 p-1 rounded transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

function PeriodePills({ filtrePeriode, setFiltrePeriode }) {
  return (
    <div className="flex gap-2 bg-slate-100 p-1 rounded-[10px]">
      {[{ k: 'today', l: "Auj." }, { k: 'week', l: '7j' }, { k: 'month', l: 'Mois' }, { k: 'all', l: 'Tout' }].map(f => (
        <button key={f.k} onClick={() => setFiltrePeriode(f.k)}
          className={`flex-1 py-1.5 rounded-[8px] text-xs font-medium transition-all ${filtrePeriode === f.k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
          {f.l}
        </button>
      ))}
    </div>
  )
}

function CatPills({ filtreCat, setFiltreCat }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <button onClick={() => setFiltreCat('all')} className={`shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-medium border transition-all ${filtreCat === 'all' ? 'bg-brand text-white border-brand' : 'bg-white border-slate-200 text-slate-500'}`}>Toutes</button>
      {CATEGORIES_DEPENSES.map(c => (
        <button key={c.value} onClick={() => setFiltreCat(c.value)}
          className={`shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-medium border transition-all ${filtreCat === c.value ? 'bg-brand text-white border-brand' : 'bg-white border-slate-200 text-slate-500'}`}>
          {c.label}
        </button>
      ))}
    </div>
  )
}

function StatBlock({ label, value, accent }) {
  return (
    <div className={`rounded-[14px] p-4 border ${accent ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 shadow-card'}`}>
      <p className={`text-xs mb-1 ${accent ? 'text-red-600' : 'text-slate-500'}`}>{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-red-700' : 'text-slate-900'}`}>{value}</p>
    </div>
  )
}

function NouvelleDepenseModal({ boutiqueId, onClose, onSuccess }) {
  const [form, setForm] = useState({ montant: '', categorie: 'stock', description: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.montant || +form.montant <= 0) { setError('Montant valide requis'); return }
    setLoading(true)
    await creerDepense(boutiqueId, { ...form, montant: parseInt(form.montant) })
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-[22px] lg:rounded-[22px] w-full max-w-md shadow-modal animate-slide-up lg:my-8">
        <div className="flex justify-center pt-3 pb-2 lg:hidden"><div className="w-9 h-1 bg-slate-200 rounded-full" /></div>
        <div className="px-6 pt-4 pb-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Nouvelle dépense</h2>
              <p className="text-xs text-slate-500 mt-0.5">Enregistrez une charge</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100"><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Montant (F)" placeholder="Ex: 5000" value={form.montant} onChange={set('montant')} type="number" inputMode="numeric" />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Catégorie</label>
              <select value={form.categorie} onChange={set('categorie')}
                className="h-10 px-3 rounded-[10px] border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
                {CATEGORIES_DEPENSES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <Input label="Description (optionnel)" placeholder="Ex: Achat tissu wax" value={form.description} onChange={set('description')} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" size="lg" className="flex-1" type="button" onClick={onClose}>Annuler</Button>
              <Button size="lg" className="flex-1" loading={loading} type="submit">Enregistrer</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
