/**
 * BoutiK — Page de connexion
 * Mode 1 : Nouvelle boutique (nom + whatsapp + mot de passe)
 * Mode 2 : Boutique existante (whatsapp + mot de passe + pull complet)
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, loginExistant } from '../lib/auth'
import { useApp } from '../store/AppContext'
import { Button, Input } from '../components/ui'
import { Store, Phone, Lock, ShieldCheck, TrendingUp, WifiOff, Zap, ArrowLeft, Download } from 'lucide-react'

export default function LoginPage() {
  const [mode, setMode] = useState('new') // 'new' | 'existing'

  return mode === 'new'
    ? <NouvellesBoutiqueForm onSwitch={() => setMode('existing')} />
    : <BoutiqueExistanteForm onSwitch={() => setMode('new')} />
}

// ─── FORMULAIRE NOUVELLE BOUTIQUE ────────────────────────────────────────────

function NouvellesBoutiqueForm({ onSwitch }) {
  const [form, setForm] = useState({ nom: '', whatsapp: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const { login: setSession } = useApp()
  const navigate = useNavigate()

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }

  function validate() {
    const errs = {}
    if (!form.nom.trim()) errs.nom = 'Requis'
    if (!form.whatsapp.trim()) errs.whatsapp = 'Requis'
    if (form.password.length < 4) errs.password = 'Minimum 4 caractères'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setGlobalError('')
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const result = await login(form.nom, form.whatsapp, form.password)
      if (result.success) {
        await setSession(result, result.boutique)
        navigate('/')
      } else {
        setGlobalError(result.error)
      }
    } catch {
      setGlobalError('Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">

      {/* Panneau gauche desktop */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-slate-950 flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand rounded-[12px] flex items-center justify-center">
            <span className="text-white text-lg font-bold">B</span>
          </div>
          <span className="text-white text-xl font-bold tracking-tight">BoutiK</span>
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
            La gestion de votre boutique, simplifiée.
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-10">
            Suivez vos ventes, votre stock et vos bénéfices — même sans connexion internet.
          </p>
          <div className="space-y-5">
            <Feature icon={WifiOff} text="Fonctionne sans connexion internet" />
            <Feature icon={Zap} text="Vente en quelques secondes" />
            <Feature icon={TrendingUp} text="Statistiques en temps réel" />
          </div>
        </div>
        <p className="relative z-10 text-xs text-slate-600">BoutiK v1.0 — Pour les commerçants africains</p>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-brand/10 rounded-full blur-3xl" />
      </div>

      {/* Formulaire */}
      <div className="flex-1 flex flex-col">
        <div className="lg:hidden bg-white border-b border-slate-200 px-6 pt-14 pb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 bg-brand rounded-[14px] flex items-center justify-center">
              <span className="text-white text-xl font-bold">B</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-950">BoutiK</h1>
              <p className="text-sm text-slate-500">Gestion de boutique</p>
            </div>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Créer ma boutique</h2>
          <p className="text-sm text-slate-500 mt-1">Première connexion ? C'est ici.</p>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-8 lg:py-12">
          <div className="w-full max-w-sm">
            <div className="hidden lg:block mb-8">
              <h2 className="text-2xl font-semibold text-slate-900">Créer ma boutique</h2>
              <p className="text-sm text-slate-500 mt-1">Première connexion sur BoutiK</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Nom de la boutique" placeholder="Ex: Boutique Aminata" value={form.nom} onChange={set('nom')} error={errors.nom} icon={Store} />
              <Input label="Numéro WhatsApp" placeholder="+226 70 00 00 00" value={form.whatsapp} onChange={set('whatsapp')} error={errors.whatsapp} icon={Phone} type="tel" />
              <Input label="Mot de passe" placeholder="••••••••" value={form.password} onChange={set('password')} error={errors.password} icon={Lock} type="password" />

              {globalError && (
                <div className="bg-red-50 border border-red-200 rounded-[10px] px-4 py-3">
                  <p className="text-sm text-red-700">{globalError}</p>
                </div>
              )}

              <Button type="submit" size="xl" loading={loading} className="w-full mt-2">
                Créer ma boutique
              </Button>
            </form>

            {/* Séparateur */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400">ou</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Bouton boutique existante */}
            <button
              onClick={onSwitch}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] border border-brand text-brand bg-brand-soft hover:bg-brand hover:text-white transition-all text-sm font-semibold"
            >
              <Download className="w-4 h-4" />
              J'ai déjà une boutique
            </button>

            <div className="flex items-center gap-2 justify-center mt-5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-xs text-slate-400">Fonctionne sans connexion internet</p>
            </div>

            <div className="pt-6 text-center">
              <button className="text-xs text-slate-300 hover:text-slate-400 transition-colors" onClick={() => window.location.href = '/admin/login'}>
                Espace administrateur
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── FORMULAIRE BOUTIQUE EXISTANTE ───────────────────────────────────────────

function BoutiqueExistanteForm({ onSwitch }) {
  const [form, setForm] = useState({ whatsapp: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [pulling, setPulling] = useState(false)
  const [pullInfo, setPullInfo] = useState(null)
  const { login: setSession } = useApp()
  const navigate = useNavigate()

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setGlobalError('')
    const errs = {}
    if (!form.whatsapp.trim()) errs.whatsapp = 'Requis'
    if (form.password.length < 4) errs.password = 'Minimum 4 caractères'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setPulling(false)
    setPullInfo(null)

    try {
      setPulling(true)
      const result = await loginExistant(form.whatsapp, form.password)

      if (result.success) {
        if (result.pulled) {
          setPullInfo(result.pulled)
          // Petit délai pour montrer les infos de récupération
          await new Promise(r => setTimeout(r, 1500))
        }
        await setSession(result, result.boutique)
        navigate('/')
      } else {
        setGlobalError(result.error)
        setPulling(false)
      }
    } catch {
      setGlobalError('Une erreur est survenue. Réessayez.')
      setPulling(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">

      {/* Panneau gauche desktop */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-slate-950 flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand rounded-[12px] flex items-center justify-center">
            <span className="text-white text-lg font-bold">B</span>
          </div>
          <span className="text-white text-xl font-bold">BoutiK</span>
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold text-white mb-4">Bon retour sur BoutiK</h2>
          <p className="text-slate-400 leading-relaxed mb-8">
            Connectez-vous pour récupérer toutes vos données : ventes, stock, catégories et bénéfices.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-[14px] p-5 space-y-3">
            <p className="text-sm font-medium text-white">Ce qui sera récupéré :</p>
            {['Historique complet des ventes', 'Stock et catégories de produits', 'Statistiques et bénéfices', 'Paramètres de votre boutique'].map(t => (
              <div key={t} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                <span className="text-xs text-slate-400">{t}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-xs text-slate-600">Nécessite une connexion internet</p>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-brand/10 rounded-full blur-3xl" />
      </div>

      {/* Formulaire */}
      <div className="flex-1 flex flex-col">
        <div className="lg:hidden bg-white border-b border-slate-200 px-6 pt-14 pb-8">
          <button onClick={onSwitch} className="flex items-center gap-1.5 text-sm text-slate-500 mb-5">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <h2 className="text-lg font-semibold text-slate-900">J'ai déjà une boutique</h2>
          <p className="text-sm text-slate-500 mt-1">Récupérez toutes vos données</p>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-8 lg:py-12">
          <div className="w-full max-w-sm">
            <div className="hidden lg:block mb-8">
              <button onClick={onSwitch} className="flex items-center gap-1.5 text-sm text-slate-500 mb-5 hover:text-slate-700 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <h2 className="text-2xl font-semibold text-slate-900">J'ai déjà une boutique</h2>
              <p className="text-sm text-slate-500 mt-1">Connectez-vous pour récupérer vos données</p>
            </div>

            {/* État de récupération */}
            {pulling && (
              <div className="bg-brand-soft border border-brand-border rounded-[12px] px-4 py-3 mb-4">
                {pullInfo ? (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-brand">Données récupérées !</p>
                    <p className="text-xs text-brand/80">{pullInfo.categories} catégories · {pullInfo.produits} produits · {pullInfo.ventes} ventes</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin shrink-0" />
                    <p className="text-sm text-brand">Récupération de vos données...</p>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Numéro WhatsApp" placeholder="+226 70 00 00 00" value={form.whatsapp} onChange={set('whatsapp')} error={errors.whatsapp} icon={Phone} type="tel" />
              <Input label="Mot de passe" placeholder="••••••••" value={form.password} onChange={set('password')} error={errors.password} icon={Lock} type="password" />

              {globalError && (
                <div className="bg-red-50 border border-red-200 rounded-[10px] px-4 py-3">
                  <p className="text-sm text-red-700">{globalError}</p>
                </div>
              )}

              <Button type="submit" size="xl" loading={loading} className="w-full mt-2" icon={Download}>
                Récupérer ma boutique
              </Button>
            </form>

            <p className="text-xs text-slate-400 text-center mt-4 leading-relaxed">
              Toutes vos ventes, votre stock et vos catégories seront récupérés automatiquement.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Feature({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-white/5 border border-white/10 rounded-[10px] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-brand" />
      </div>
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  )
}
