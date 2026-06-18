/**
 * BoutiK - Interface Admin système
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Badge, Button, Spinner, Input } from '../components/ui'
import { ShieldOff, ShieldCheck, Clock, TrendingUp, Users, ShoppingCart } from 'lucide-react'

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0) + ' F'
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

// ─── DASHBOARD ADMIN ─────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [boutiques, setBoutiques] = useState([])
  const [globalStats, setGlobalStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('boutik_admin_token')
    if (!token) { navigate('/admin/login', { replace: true }); return }
    loadData(token)
  }, [])

  async function loadData(token) {
    try {
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      const [r1, r2] = await Promise.all([
        fetch(`${API_URL}/api/admin/boutiques`, { headers }),
        fetch(`${API_URL}/api/admin/stats`, { headers })
      ])
      if (r1.status === 401) { localStorage.removeItem('boutik_admin_token'); navigate('/admin/login', { replace: true }); return }
      setBoutiques(await r1.json())
      setGlobalStats(await r2.json())
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  async function handleBloquer(id, estBloquee) {
    const token = localStorage.getItem('boutik_admin_token')
    const route = estBloquee ? 'debloquer' : 'bloquer'
    await fetch(`${API_URL}/api/admin/boutiques/${id}/${route}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    })
    await loadData(token)
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><Spinner size="lg" /></div>

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand rounded-[10px] flex items-center justify-center">
            <span className="text-white text-sm font-bold">B</span>
          </div>
          <span className="font-semibold text-slate-900 text-sm">BoutiK Admin</span>
          <Badge variant="ink" className="text-[10px]">Système</Badge>
        </div>
        <button onClick={() => { localStorage.removeItem('boutik_admin_token'); navigate('/login') }} className="text-xs text-slate-500">
          Quitter
        </button>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-md mx-auto">

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-[10px] px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Stats globales */}
        {globalStats && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200 rounded-[14px] p-3.5 shadow-card">
              <div className="flex items-center gap-1.5 mb-2">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs text-slate-500">Boutiques</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{globalStats.totalBoutiques}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-[14px] p-3.5 shadow-card">
              <div className="flex items-center gap-1.5 mb-2">
                <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs text-slate-500">Ventes totales</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{globalStats.totalVentes}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-[14px] p-3.5 shadow-card">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs text-slate-500">CA global</p>
              </div>
              <p className="text-lg font-bold text-slate-900">{fmt(globalStats.totalCA)}</p>
            </div>
            <div className="bg-brand-soft border border-brand-border rounded-[14px] p-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-brand" />
                <p className="text-xs text-brand">Bénéfice global</p>
              </div>
              <p className="text-lg font-bold text-brand">{fmt(globalStats.totalBenefice)}</p>
            </div>
          </div>
        )}

        {/* Liste boutiques */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Boutiques ({boutiques.length})
          </p>

          {boutiques.length === 0 ? (
            <div className="text-center py-10 text-sm text-slate-500">Aucune boutique enregistrée</div>
          ) : boutiques.map(b => (
            <BoutiqueCard key={b.id} boutique={b} onBloquer={() => handleBloquer(b.id, b.bloquee)} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── CARTE BOUTIQUE ───────────────────────────────────────────────────────────

function BoutiqueCard({ boutique: b, onBloquer }) {
  const joursRestants = getJoursRestants(b.createdAt)
  const expireBientot = joursRestants <= 5 && joursRestants > 0
  const expire = joursRestants <= 0

  return (
    <Card>
      <div className="space-y-3">
        {/* Nom + statut */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{b.nom}</p>
            <p className="text-xs text-slate-400 mt-0.5">{b.whatsapp}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Inscrit le {formatDate(b.createdAt)}
            </p>
          </div>
          <Badge variant={b.bloquee ? 'danger' : 'success'}>
            {b.bloquee ? 'Bloquée' : 'Active'}
          </Badge>
        </div>

        {/* Compte à rebours 30 jours */}
        <div className={`flex items-center gap-2 rounded-[10px] px-3 py-2 ${
          b.bloquee ? 'bg-red-50 border border-red-200' :
          expire ? 'bg-red-50 border border-red-200' :
          expireBientot ? 'bg-amber-50 border border-amber-200' :
          'bg-slate-50 border border-slate-200'
        }`}>
          <Clock className={`w-3.5 h-3.5 shrink-0 ${
            expire || b.bloquee ? 'text-red-500' : expireBientot ? 'text-amber-600' : 'text-slate-400'
          }`} />
          <div className="flex-1">
            <p className={`text-xs font-medium ${
              expire || b.bloquee ? 'text-red-700' : expireBientot ? 'text-amber-700' : 'text-slate-600'
            }`}>
              {b.bloquee
                ? 'Compte suspendu'
                : expire
                ? 'Abonnement expiré'
                : `${joursRestants} jour${joursRestants > 1 ? 's' : ''} restant${joursRestants > 1 ? 's' : ''}`
              }
            </p>
            <div className="w-full bg-slate-200 rounded-full h-1 mt-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  expire || b.bloquee ? 'bg-red-500' : expireBientot ? 'bg-amber-500' : 'bg-brand'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, (joursRestants / 30) * 100))}%` }}
              />
            </div>
          </div>
          <span className={`text-xs font-bold ${
            expire || b.bloquee ? 'text-red-600' : expireBientot ? 'text-amber-600' : 'text-brand'
          }`}>
            {Math.max(0, joursRestants)}/30j
          </span>
        </div>

        {/* Stats boutique */}
        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="Ventes" value={b._count?.ventes || 0} />
          <MiniStat label="Produits" value={b._count?.produits || 0} />
          <MiniStat label="Catégories" value={b._count?.categories || 0} />
        </div>

        {/* Bouton bloquer */}
        <button
          onClick={onBloquer}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-sm font-medium transition-colors ${
            b.bloquee
              ? 'bg-brand-soft border border-brand-border text-brand hover:bg-brand hover:text-white'
              : 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white'
          }`}
        >
          {b.bloquee
            ? <><ShieldCheck className="w-4 h-4" /> Débloquer la boutique</>
            : <><ShieldOff className="w-4 h-4" /> Bloquer la boutique</>
          }
        </button>
      </div>
    </Card>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-[10px] py-2 text-center">
      <p className="text-base font-bold text-slate-900">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  )
}

function getJoursRestants(createdAt) {
  if (!createdAt) return 30
  const inscription = new Date(createdAt)
  const expiration = new Date(inscription.getTime() + 30 * 24 * 60 * 60 * 1000)
  const diff = expiration - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── LOGIN ADMIN ──────────────────────────────────────────────────────────────

export function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Accès refusé'); setLoading(false); return }
      localStorage.setItem('boutik_admin_token', data.token)
      setTimeout(() => navigate('/admin', { replace: true }), 100)
    } catch {
      setError('Impossible de contacter le serveur.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl font-bold">B</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900">Admin BoutiK</h1>
          <p className="text-xs text-slate-500 mt-1">Espace réservé aux administrateurs</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Mot de passe admin" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoFocus />
          {error && <div className="bg-red-50 border border-red-200 rounded-[10px] px-4 py-3"><p className="text-sm text-red-700">{error}</p></div>}
          <Button type="submit" className="w-full" size="lg" loading={loading}>Accéder</Button>
        </form>
        <button onClick={() => navigate('/login')} className="w-full text-xs text-slate-400 text-center">Retour à l'application</button>
      </div>
    </div>
  )
}
