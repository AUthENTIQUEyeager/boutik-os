/**
 * BoutiK - Interface Admin système (connecté au backend)
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiAdminLogin, apiGetAllBoutiques, apiGetGlobalStats, apiBloquerBoutique, apiDebloquerBoutique } from '../lib/api'
import { Card, Badge, Button, Spinner, Input } from '../components/ui'

const formatCFA = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' F'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [boutiques, setBoutiques] = useState([])
  const [globalStats, setGlobalStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('boutik_admin_token')
    if (!token) {
      navigate('/admin/login')
      return
    }
    loadData()
  }, [])

  async function loadData() {
    try {
      const [boutiquesData, stats] = await Promise.all([
        apiGetAllBoutiques(),
        apiGetGlobalStats()
      ])
      setBoutiques(boutiquesData)
      setGlobalStats(stats)
    } catch (err) {
      if (err.message.includes('refusé') || err.message.includes('invalide')) {
        localStorage.removeItem('boutik_admin_token')
        navigate('/admin/login')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleBloquer(id, estBloquee) {
    try {
      if (estBloquee) {
        await apiDebloquerBoutique(id)
      } else {
        await apiBloquerBoutique(id)
      }
      await loadData()
    } catch (err) {
      setError(err.message)
    }
  }

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
        <button
          onClick={() => { localStorage.removeItem('boutik_admin_token'); navigate('/login') }}
          className="text-xs text-ink-muted"
        >
          Quitter
        </button>
      </div>

      <div className="px-4 py-4 space-y-5 max-w-md mx-auto">
        <h1 className="text-base font-semibold text-ink">Vue globale</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Stats globales */}
        {globalStats && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-paper-border rounded-xl p-3 shadow-card">
              <p className="text-xs text-ink-muted">Total boutiques</p>
              <p className="text-2xl font-bold text-ink">{globalStats.totalBoutiques}</p>
            </div>
            <div className="bg-white border border-paper-border rounded-xl p-3 shadow-card">
              <p className="text-xs text-ink-muted">Ventes totales</p>
              <p className="text-2xl font-bold text-ink">{globalStats.totalVentes}</p>
            </div>
            <div className="bg-white border border-paper-border rounded-xl p-3 shadow-card">
              <p className="text-xs text-ink-muted">CA global</p>
              <p className="text-xl font-bold text-ink">{formatCFA(globalStats.totalCA)}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="text-xs text-green-700">Bénéfice global</p>
              <p className="text-xl font-bold text-green-600">{formatCFA(globalStats.totalBenefice)}</p>
            </div>
          </div>
        )}

        {/* Liste boutiques */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
            Boutiques ({boutiques.length})
          </h2>
          {boutiques.length === 0 ? (
            <div className="text-center py-10 text-sm text-ink-muted">
              Aucune boutique enregistrée
            </div>
          ) : (
            boutiques.map(b => (
              <Card key={b.id}>
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink">{b.nom}</p>
                      <p className="text-xs text-ink-muted">{b.whatsapp}</p>
                      {b.adresse && <p className="text-xs text-ink-muted">{b.adresse}</p>}
                    </div>
                    <Badge variant={b.bloquee ? 'danger' : 'success'}>
                      {b.bloquee ? 'Bloquée' : 'Active'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="bg-paper-soft rounded-lg py-2">
                      <p className="text-base font-bold text-ink">{b._count?.ventes || 0}</p>
                      <p className="text-[10px] text-ink-muted">Ventes</p>
                    </div>
                    <div className="bg-paper-soft rounded-lg py-2">
                      <p className="text-base font-bold text-ink">{b._count?.produits || 0}</p>
                      <p className="text-[10px] text-ink-muted">Produits</p>
                    </div>
                    <div className="bg-paper-soft rounded-lg py-2">
                      <p className="text-base font-bold text-ink">{b._count?.categories || 0}</p>
                      <p className="text-[10px] text-ink-muted">Catégories</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant={b.bloquee ? 'success' : 'danger'}
                      size="sm"
                      className="flex-1"
                      onClick={() => handleBloquer(b.id, b.bloquee)}
                    >
                      {b.bloquee ? 'Débloquer' : 'Bloquer'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── PAGE LOGIN ADMIN ─────────────────────────────────────────────────────────

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
      await apiAdminLogin(password)
      navigate('/admin')
    } catch (err) {
      setError(err.message || 'Accès refusé')
    } finally {
      setLoading(false)
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
            autoFocus
          />
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Accéder
          </Button>
        </form>

        <button
          onClick={() => navigate('/login')}
          className="w-full text-xs text-ink-muted text-center"
        >
          Retour à l'application
        </button>
      </div>
    </div>
  )
}