/**
 * BoutiK — Page Paramètres v2
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { updateBoutique } from '../lib/db'
import { Button, Input, Card, Divider } from '../components/ui'
import {
  Store, Phone, MapPin, Globe, ChevronRight,
  RefreshCw, BarChart3, LogOut, MessageCircle, CheckCircle2
} from 'lucide-react'

export default function Parametres() {
  const { boutique, updateBoutique: updateCtx, logout, syncStatus, lastSync, manualSync } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nom: boutique?.nom || '', adresse: boutique?.adresse || '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateBoutique(boutique.id, { nom: form.nom, adresse: form.adresse })
      updateCtx(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const whatsappMsg = encodeURIComponent(`Bonjour, je possède une boutique et j'utilise BoutiK. Je souhaite créer un site web pour mon commerce. Boutique : ${boutique?.nom}`)

  return (
    <div className="px-4 pt-5 pb-4 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Paramètres</h1>
        <p className="text-xs text-slate-500 mt-0.5">Gérez votre boutique</p>
      </div>

      {/* Infos boutique */}
      <Section title="Informations boutique">
        <Card>
          <form onSubmit={handleSave} className="space-y-3">
            <Input label="Nom de la boutique" value={form.nom} onChange={set('nom')} icon={Store} />
            <Input label="Adresse" placeholder="Secteur, Ville" value={form.adresse} onChange={set('adresse')} icon={MapPin} />
            <Input label="WhatsApp" value={boutique?.whatsapp || ''} disabled icon={Phone} className="opacity-60" />
            <Button type="submit" loading={saving} className="w-full" variant={saved ? 'brand_outline' : 'primary'} icon={saved ? CheckCircle2 : undefined}>
              {saved ? 'Enregistré' : 'Sauvegarder'}
            </Button>
          </form>
        </Card>
      </Section>

      {/* Synchronisation */}
      <Section title="Synchronisation">
        <Card>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Statut</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {navigator.onLine ? 'Connecté' : 'Hors ligne'}
                  {lastSync && ` · ${timeAgo(lastSync)}`}
                </p>
              </div>
              <div className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-brand' : 'bg-red-400'}`} />
            </div>
            <Divider />
            <Button variant="secondary" size="sm" className="w-full" onClick={manualSync} icon={RefreshCw}>
              Synchroniser maintenant
            </Button>
          </div>
        </Card>
      </Section>

      {/* Site web */}
      <Section title="Site web">
        <Card>
          {boutique?.siteWeb ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-900">Site associé</p>
                <p className="text-xs text-slate-500 mt-0.5">{boutique.siteWeb}</p>
              </div>
              <Button variant="secondary" className="w-full" icon={Globe} onClick={() => window.open(boutique.siteWeb, '_blank')}>
                Accéder au dashboard
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-900">Aucun site web</p>
                <p className="text-xs text-slate-500 mt-0.5">Vendez en ligne avec un site professionnel</p>
              </div>
              <button
                onClick={() => window.open(`https://wa.me/22670000000?text=${whatsappMsg}`, '_blank')}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-[10px] text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Demander un site web
              </button>
            </div>
          )}
        </Card>
      </Section>

      {/* Liens */}
      <Section title="Outils">
        <Card padding={false}>
          <NavItem icon={BarChart3} label="Tableau de bord avancé" onClick={() => navigate('/boss')} />
        </Card>
      </Section>

      {/* Déconnexion */}
      <Button variant="danger" className="w-full" onClick={async () => { await logout(); navigate('/login') }} icon={LogOut}>
        Se déconnecter
      </Button>

      <p className="text-xs text-slate-400 text-center pb-2">BoutiK v1.0.0 · Offline-first PWA</p>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">{title}</p>
      {children}
    </div>
  )
}

function NavItem({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-700">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300" />
    </button>
  )
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - date) / 1000)
  if (diff < 60) return 'sync à l\'instant'
  if (diff < 3600) return `sync il y a ${Math.floor(diff / 60)} min`
  return `sync il y a ${Math.floor(diff / 3600)}h`
}
