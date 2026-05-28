/**
 * BoutiK - Interface Admin système
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { getAllBoutiques, getVentesByBoutique } from '../lib/db'
import { Card, Badge, Button, Spinner, Input } from '../components/ui'

const formatCFA = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' F'

export default function AdminDashboard() {
  const { session } = useApp()
  const navigate = useNavigate()
  const [boutiques, setBoutiques] = useState([])
  const [statsParBoutique, setStatsParBoutique] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session || session.role !== 'admin') {
      navigate('/admin/login')
      return
    }
    loadData()
  }, [session])

  async function loadData() {
    const all = await getAllBoutiques()
    setBoutiques(all)

    // Charger les stats de chaque boutique
    const stats = {}
    for (const b of all) {
      const ventes = await getVentesByBoutique(b.id)
      const today = new Date().toDateString()
      stats[b.id] = {
        totalVentes: ventes.length,
        ventesAujourdhui: ventes.filter(v => new Date(v.date).toDateString() === today).length,
        totalCA: ventes.reduce((s, v) => s + v.prixVente, 0),
        totalBenefice: ventes.reduce((s, v) => s + v.benefice, 0)
      }
    }
    setStatsParBoutique(stats)
    setLoading(false)
  }

  const totalGlobalCA = Object.values(statsParBoutique).reduce((s, st) => s + st.totalCA, 0)
  const totalGlobalBenef = Object.values(statsParBoutique).reduce((s, st) => s + st.totalBenefice, 0)

  if (loading) return <div className="flex items-center justify-center h-screen"><Spinner size="lg" /></div>

  return (
    <div className="min-h-screen bg-paper-soft">
      <div className="bg-white border-b border-paper-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-ink rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">B</span>
          </div>
          <div>
            <span className="font-semibold text-ink text-sm">BoutiK Admin</span>
            <Badge variant="ink" className="ml-2 text-[10px]">Système</Badge>
          </div>
        </div>
        <button onClick={() => navigate('/login')} className="text-xs text-ink-muted">Quitter</button>
      </div>

      <div className="px-4 py-4 space-y-5 max-w-md mx-auto">
        <h1 className="text-base font-semibold text-ink">Vue globale</h1>

        {/* Stats globales */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-paper-border rounded-xl p-3 shadow-card">
            <p className="text-xs text-ink-muted">Total boutiques</p>
            <p className="text-2xl font-bold text-ink">{boutiques.length}</p>
          </div>
          <div className="bg-white border border-paper-border rounded-xl p-3 shadow-card">
            <p className="text-xs text-ink-muted">CA global</p>
            <p className="text-xl font-bold text-ink">{formatCFA(totalGlobalCA)}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-xs text-green-700">Bénéfice global</p>
            <p className="text-xl font-bold text-accent-success">{formatCFA(totalGlobalBenef)}</p>
          </div>
          <div className="bg-white border border-paper-border rounded-xl p-3 shadow-card">
            <p className="text-xs text-ink-muted">Ventes totales</p>
            <p className="text-2xl font-bold text-ink">
              {Object.values(statsParBoutique).reduce((s, st) => s + st.totalVentes, 0)}
            </p>
          </div>
        </div>

        {/* Liste boutiques */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Boutiques enregistrées</h2>
          {boutiques.length === 0 ? (
            <div className="text-center py-10 text-sm text-ink-muted">Aucune boutique enregistrée</div>
          ) : (
            boutiques.map(b => {
              const st = statsParBoutique[b.id] || {}
              return (
                <Card key={b.id}>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-ink">{b.nom}</p>
                        <p className="text-xs text-ink-muted">{b.whatsapp}</p>
                      </div>
                      <Badge variant={b.bloquee ? 'danger' : 'success'}>
                        {b.bloquee ? 'Bloquée' : 'Active'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <MiniStat label="Ventes" value={st.totalVentes || 0} />
                      <MiniStat label="Aujourd'hui" value={st.ventesAujourdhui || 0} />
                      <MiniStat label="CA" value={formatCFA(st.totalCA || 0)} small />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          const msg = encodeURIComponent(`Notification BoutiK pour ${b.nom}`)
                          alert('Fonctionnalité notifications push — à connecter avec Firebase Cloud Messaging')
                        }}
                      >
                        Notifier
                      </Button>
                      <Button
                        variant={b.bloquee ? 'success' : 'danger'}
                        size="sm"
                        className="flex-1"
                        onClick={() => alert(`Blocage boutique — nécessite le backend`)}
                      >
                        {b.bloquee ? 'Débloquer' : 'Bloquer'}
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>

        {/* Note technique */}
        <div className="bg-paper-soft border border-paper-border rounded-xl p-4">
          <p className="text-xs font-semibold text-ink mb-1">Fonctionnalités à connecter</p>
          <ul className="text-xs text-ink-muted space-y-1">
            <li>· Notifications push via Firebase Cloud Messaging</li>
            <li>· Blocage boutique via API backend</li>
            <li>· Synchronisation inter-boutiques</li>
            <li>· Export CSV des données globales</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value, small }) {
  return (
    <div className="bg-paper-soft rounded-lg py-2 px-1">
      <p className={`font-bold text-ink ${small ? 'text-xs' : 'text-base'}`}>{value}</p>
      <p className="text-[10px] text-ink-muted">{label}</p>
    </div>
  )
}

export function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useApp()
  const navigate = useNavigate()
  const { loginAdmin } = require('../lib/auth')

  async function handleSubmit(e) {
    e.preventDefault()
    const { loginAdmin } = await import('../lib/auth')
    const result = await loginAdmin(password)
    if (result.success) {
      await login({ role: 'admin', boutiqueId: null }, null)
      navigate('/admin')
    } else {
      setError('Accès refusé')
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-ink rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl font-bold">B</span>
          </div>
          <h1 className="text-lg font-bold text-ink">Admin BoutiK</h1>
          <p className="text-xs text-ink-muted mt-1">Espace réservé aux administrateurs</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Mot de passe admin"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mot de passe"
          />
          {error && <p className="text-xs text-accent-danger">{error}</p>}
          <Button type="submit" className="w-full" size="lg">Accéder</Button>
        </form>
        <button onClick={() => navigate('/login')} className="w-full text-xs text-ink-muted text-center">
          Retour à l'application
        </button>
      </div>
    </div>
  )
}
