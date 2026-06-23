/**
 * BoutiK — Page Dettes clients
 */
import { useState, useEffect } from 'react'
import { useApp } from '../store/AppContext'
import {
  creerDette, getDettes, ajouterPaiement,
  supprimerDette, getPaiementsDette
} from '../lib/db-extras'
import { Card, Badge, Button, Input, EmptyState, Spinner } from '../components/ui'
import { Plus, X, CreditCard, ChevronDown, ChevronUp, Trash2, CheckCircle2 } from 'lucide-react'

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0) + ' F'
const fmtDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

export default function Dettes() {
  const { boutique } = useApp()
  const [dettes, setDettes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filtre, setFiltre] = useState('tous') // tous | en_cours | paye

  async function load() {
    if (!boutique) return
    const data = await getDettes(boutique.id)
    setDettes(data.reverse())
    setLoading(false)
  }

  useEffect(() => { load() }, [boutique])

  const filtered = dettes.filter(d => filtre === 'tous' || d.statut === filtre)
  const totalDu = dettes.filter(d => d.statut === 'en_cours').reduce((s, d) => s + d.solde, 0)

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <>
      {/* ── MOBILE ── */}
      <div className="lg:hidden p-4 space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Dettes clients</h1>
            <p className="text-xs text-slate-500 mt-0.5">{dettes.filter(d => d.statut === 'en_cours').length} en cours · {fmt(totalDu)} dû</p>
          </div>
          <Button size="sm" icon={Plus} onClick={() => setShowForm(true)}>Nouvelle</Button>
        </div>

        <FiltrePills filtre={filtre} setFiltre={setFiltre} />

        {filtered.length === 0 ? (
          <EmptyState icon={CreditCard} title="Aucune dette" description="Enregistrez les ventes à crédit de vos clients" action={<Button size="sm" icon={Plus} onClick={() => setShowForm(true)}>Ajouter</Button>} />
        ) : (
          <div className="space-y-3">
            {filtered.map(d => <DetteCard key={d.id} dette={d} onRefresh={load} />)}
          </div>
        )}
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden lg:block animate-fade-in">
        <div className="bg-white border-b border-slate-200 px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Dettes clients</h1>
              <p className="text-xs text-slate-500 mt-0.5">{dettes.filter(d => d.statut === 'en_cours').length} dettes en cours</p>
            </div>
            <Button size="md" icon={Plus} onClick={() => setShowForm(true)}>Nouvelle dette</Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <StatBlock label="Total dû" value={fmt(totalDu)} accent />
            <StatBlock label="Dettes en cours" value={dettes.filter(d => d.statut === 'en_cours').length} />
            <StatBlock label="Dettes soldées" value={dettes.filter(d => d.statut === 'paye').length} />
          </div>
        </div>

        <div className="p-8 space-y-5">
          <FiltrePills filtre={filtre} setFiltre={setFiltre} />
          {filtered.length === 0 ? (
            <EmptyState icon={CreditCard} title="Aucune dette" description="Enregistrez les ventes à crédit de vos clients" action={<Button size="sm" icon={Plus} onClick={() => setShowForm(true)}>Ajouter</Button>} />
          ) : (
            <Card padding={false} className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {['Client', 'Téléphone', 'Montant total', 'Payé', 'Solde restant', 'Date', 'Statut', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d, i) => <DetteRow key={d.id} dette={d} i={i} onRefresh={load} />)}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </div>

      {showForm && <NouvelleDetteModal boutiqueId={boutique.id} onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); load() }} />}
    </>
  )
}

// ─── Desktop table row ────────────────────────────────────────────────────────

function DetteRow({ dette: d, i, onRefresh }) {
  const [showPay, setShowPay] = useState(false)
  const [montant, setMontant] = useState('')
  const [loading, setLoading] = useState(false)

  async function payer() {
    if (!montant || +montant <= 0) return
    setLoading(true)
    await ajouterPaiement(d.id, parseInt(montant))
    setMontant('')
    setShowPay(false)
    onRefresh()
    setLoading(false)
  }

  return (
    <tr className={`hover:bg-slate-50 transition-colors ${i > 0 ? 'border-t border-slate-100' : ''}`}>
      <td className="px-4 py-3 text-sm font-medium text-slate-900">{d.nomClient}</td>
      <td className="px-4 py-3 text-sm text-slate-500">{d.telephone || '—'}</td>
      <td className="px-4 py-3 text-sm text-slate-700">{fmt(d.montantTotal)}</td>
      <td className="px-4 py-3 text-sm text-slate-700">{fmt(d.montantPaye)}</td>
      <td className="px-4 py-3 text-sm font-semibold text-red-600">{fmt(d.solde)}</td>
      <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(d.createdAt)}</td>
      <td className="px-4 py-3"><Badge variant={d.statut === 'paye' ? 'success' : 'warning'}>{d.statut === 'paye' ? 'Soldé' : 'En cours'}</Badge></td>
      <td className="px-4 py-3">
        {d.statut === 'en_cours' && (
          showPay ? (
            <div className="flex items-center gap-2">
              <input type="number" inputMode="numeric" value={montant} onChange={e => setMontant(e.target.value)}
                placeholder="Montant" className="w-24 h-7 px-2 rounded-[6px] border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-brand" />
              <Button size="xs" loading={loading} onClick={payer}>OK</Button>
              <button onClick={() => setShowPay(false)} className="text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <Button size="xs" variant="brand_outline" onClick={() => setShowPay(true)}>Paiement</Button>
          )
        )}
      </td>
    </tr>
  )
}

// ─── Mobile card ─────────────────────────────────────────────────────────────

function DetteCard({ dette: d, onRefresh }) {
  const [open, setOpen] = useState(false)
  const [montant, setMontant] = useState('')
  const [loading, setLoading] = useState(false)
  const [paiements, setPaiements] = useState([])

  async function toggle() {
    if (!open) {
      const p = await getPaiementsDette(d.id)
      setPaiements(p.reverse())
    }
    setOpen(!open)
  }

  async function payer() {
    if (!montant || +montant <= 0) return
    setLoading(true)
    await ajouterPaiement(d.id, parseInt(montant))
    setMontant('')
    onRefresh()
    setLoading(false)
  }

  return (
    <Card padding={false}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{d.nomClient}</p>
            {d.telephone && <p className="text-xs text-slate-400 mt-0.5">{d.telephone}</p>}
            <p className="text-xs text-slate-400 mt-0.5">{fmtDate(d.createdAt)}</p>
          </div>
          <Badge variant={d.statut === 'paye' ? 'success' : 'warning'}>{d.statut === 'paye' ? 'Soldé' : 'En cours'}</Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-slate-50 rounded-[10px] p-2 text-center">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-sm font-bold text-slate-900">{fmt(d.montantTotal)}</p>
          </div>
          <div className="bg-slate-50 rounded-[10px] p-2 text-center">
            <p className="text-xs text-slate-500">Payé</p>
            <p className="text-sm font-bold text-brand">{fmt(d.montantPaye)}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-[10px] p-2 text-center">
            <p className="text-xs text-red-600">Reste</p>
            <p className="text-sm font-bold text-red-600">{fmt(d.solde)}</p>
          </div>
        </div>

        {d.statut === 'en_cours' && (
          <div className="flex gap-2 mb-3">
            <input type="number" inputMode="numeric" value={montant} onChange={e => setMontant(e.target.value)}
              placeholder="Montant reçu..." className="flex-1 h-9 px-3 rounded-[8px] border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
            <Button size="sm" loading={loading} onClick={payer}>Encaisser</Button>
          </div>
        )}

        <button onClick={toggle} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Historique des paiements
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-2">
          {paiements.length === 0 ? (
            <p className="text-xs text-slate-400">Aucun paiement enregistré</p>
          ) : paiements.map(p => (
            <div key={p.id} className="flex items-center justify-between text-xs">
              <span className="text-slate-500">{fmtDate(p.date)}</span>
              <span className="font-semibold text-brand">+{fmt(p.montant)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FiltrePills({ filtre, setFiltre }) {
  return (
    <div className="flex gap-2 bg-slate-100 p-1 rounded-[10px] max-w-xs">
      {[{ k: 'tous', l: 'Toutes' }, { k: 'en_cours', l: 'En cours' }, { k: 'paye', l: 'Soldées' }].map(f => (
        <button key={f.k} onClick={() => setFiltre(f.k)}
          className={`flex-1 py-1.5 rounded-[8px] text-xs font-medium transition-all ${filtre === f.k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
          {f.l}
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

// ─── Modal nouvelle dette ──────────────────────────────────────────────────────

function NouvelleDetteModal({ boutiqueId, onClose, onSuccess }) {
  const [form, setForm] = useState({ nomClient: '', telephone: '', montantTotal: '', description: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.nomClient.trim()) errs.nomClient = 'Requis'
    if (!form.montantTotal || +form.montantTotal <= 0) errs.montantTotal = 'Montant valide requis'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    await creerDette(boutiqueId, { ...form, montantTotal: parseInt(form.montantTotal) })
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
              <h2 className="text-lg font-bold text-slate-900">Nouvelle dette</h2>
              <p className="text-xs text-slate-500 mt-0.5">Vente à crédit client</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100"><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nom du client" placeholder="Ex: Amadou Traoré" value={form.nomClient} onChange={set('nomClient')} error={errors.nomClient} />
            <Input label="Téléphone (optionnel)" placeholder="+226 70 00 00 00" value={form.telephone} onChange={set('telephone')} type="tel" />
            <Input label="Montant total dû (F)" placeholder="5000" value={form.montantTotal} onChange={set('montantTotal')} error={errors.montantTotal} type="number" inputMode="numeric" />
            <Input label="Description (optionnel)" placeholder="Ex: 2 chemises bleues" value={form.description} onChange={set('description')} />
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
