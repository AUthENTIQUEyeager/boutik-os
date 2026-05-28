/**
 * BoutiK - Page Paramètres
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { updateBoutique } from '../lib/db'
import { Button, Input, Card, Divider } from '../components/ui'

export default function Parametres() {
  const { boutique, updateBoutique: updateCtx, logout, syncStatus, lastSync, manualSync } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nom: boutique?.nom || '',
    adresse: boutique?.adresse || '',
    whatsapp: boutique?.whatsapp || ''
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateBoutique(boutique.id, {
        nom: form.nom,
        adresse: form.adresse
      })
      updateCtx(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const hasSite = boutique?.siteWeb
  const whatsappMsg = encodeURIComponent(
    `Bonjour, je possède une boutique et j'utilise BoutiK. Je souhaite créer un site web pour mon commerce. Boutique : ${boutique?.nom}`
  )

  return (
    <div className="px-4 py-4 space-y-5">
      <h1 className="text-base font-semibold text-ink">Paramètres</h1>

      {/* Infos boutique */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Informations boutique</h2>
        <Card>
          <form onSubmit={handleSave} className="space-y-3">
            <Input label="Nom de la boutique" value={form.nom} onChange={set('nom')} />
            <Input label="Adresse" placeholder="Ex: Quartier Secteur 15, Bobo-Dioulasso" value={form.adresse} onChange={set('adresse')} />
            <Input label="Numéro WhatsApp" value={form.whatsapp} disabled className="opacity-60" />
            <Button type="submit" loading={saving} className="w-full" variant={saved ? 'success' : 'primary'}>
              {saved ? 'Enregistré' : 'Sauvegarder'}
            </Button>
          </form>
        </Card>
      </section>

      {/* Synchronisation */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Synchronisation</h2>
        <Card>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Statut</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  {navigator.onLine ? 'Connecté' : 'Hors ligne'}
                  {lastSync && ` · Sync ${timeAgo(lastSync)}`}
                </p>
              </div>
              <div className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-accent-success' : 'bg-accent-danger'}`} />
            </div>
            <Divider />
            <Button variant="secondary" size="sm" className="w-full" onClick={manualSync}>
              Synchroniser maintenant
            </Button>
          </div>
        </Card>
      </section>

      {/* Impression */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Impression</h2>
        <Card>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/ventes')}
              className="w-full flex items-center justify-between py-2 text-sm text-ink hover:text-ink-light transition-colors"
            >
              <span>Imprimer liste des ventes</span>
              <ChevronRight />
            </button>
          </div>
        </Card>
      </section>

      {/* Gestion site web */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Site web</h2>
        <Card>
          {hasSite ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-ink">Site associé</p>
                <p className="text-xs text-ink-muted mt-0.5">{boutique.siteWeb}</p>
              </div>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => window.open(boutique.siteWeb, '_blank')}
              >
                Accéder au dashboard du site
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-ink">Aucun site associé</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  Créez un site web pour votre boutique et vendez en ligne
                </p>
              </div>
              <button
                onClick={() => window.open(`https://wa.me/22670000000?text=${whatsappMsg}`, '_blank')}
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <WhatsAppIcon />
                Demander un site web
              </button>
            </div>
          )}
        </Card>
      </section>

      {/* Espace boss */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Tableau de bord propriétaire</h2>
        <Card>
          <button
            onClick={() => navigate('/boss')}
            className="w-full flex items-center justify-between py-1 text-sm text-ink"
          >
            <span>Statistiques avancées</span>
            <ChevronRight />
          </button>
        </Card>
      </section>

      {/* Déconnexion */}
      <section>
        <Button variant="danger" className="w-full" onClick={handleLogout}>
          Se déconnecter
        </Button>
      </section>

      <div className="text-center pb-4">
        <p className="text-xs text-ink-muted">BoutiK v1.0.0 · Offline-first PWA</p>
      </div>
    </div>
  )
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - date) / 1000)
  if (diff < 60) return 'à l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  return `il y a ${Math.floor(diff / 3600)}h`
}

function ChevronRight() {
  return (
    <svg className="w-4 h-4 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}
