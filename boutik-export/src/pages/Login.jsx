/**
 * BoutiK — Page de connexion (desktop split + mobile)
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../lib/auth'
import { useApp } from '../store/AppContext'
import { Button, Input } from '../components/ui'
import { Store, Phone, Lock, ShieldCheck, TrendingUp, WifiOff, Zap } from 'lucide-react'

export default function LoginPage() {
  const [form, setForm] = useState({ nom: '', whatsapp: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const { login: setSession } = useApp()
  const navigate = useNavigate()

  const set = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }))
    setErrors(e => ({ ...e, [key]: undefined }))
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

      {/* ── Panneau gauche desktop uniquement ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-slate-950 flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand rounded-[12px] flex items-center justify-center">
              <span className="text-white text-lg font-bold">B</span>
            </div>
            <span className="text-white text-xl font-bold tracking-tight">BoutiK</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
            La gestion de votre boutique, simplifiée.
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-10">
            Suivez vos ventes, votre stock et vos bénéfices en temps réel — même sans connexion internet.
          </p>

          <div className="space-y-5">
            <Feature icon={WifiOff} title="Fonctionne hors-ligne" desc="Vos ventes s'enregistrent même sans internet" />
            <Feature icon={Zap} title="Vente en quelques secondes" desc="Interface pensée pour aller vite au comptoir" />
            <Feature icon={TrendingUp} title="Statistiques en temps réel" desc="Bénéfices, stock et tendances à portée de main" />
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-600">BoutiK v1.0 — Conçu pour les commerçants africains</p>

        {/* Décoration */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-brand/10 rounded-full blur-3xl" />
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-brand/5 rounded-full blur-3xl" />
      </div>

      {/* ── Formulaire ── */}
      <div className="flex-1 flex flex-col">

        {/* Hero mobile uniquement */}
        <div className="lg:hidden bg-white border-b border-slate-200 px-6 pt-16 pb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-brand rounded-[14px] flex items-center justify-center shadow-brand shadow-md">
              <span className="text-white text-xl font-bold">B</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-950 tracking-tight">BoutiK</h1>
              <p className="text-sm text-slate-500">Gestion de boutique</p>
            </div>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Bienvenue</h2>
          <p className="text-sm text-slate-500 mt-1">Connectez-vous ou créez votre boutique</p>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-8 lg:py-12">
          <div className="w-full max-w-sm">

            <div className="hidden lg:block mb-8">
              <h2 className="text-2xl font-semibold text-slate-900">Bienvenue</h2>
              <p className="text-sm text-slate-500 mt-1">Connectez-vous ou créez votre boutique</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nom de la boutique"
                placeholder="Ex: Boutique Aminata"
                value={form.nom}
                onChange={set('nom')}
                error={errors.nom}
                icon={Store}
                autoComplete="organization"
              />
              <Input
                label="Numéro WhatsApp"
                placeholder="+226 70 00 00 00"
                value={form.whatsapp}
                onChange={set('whatsapp')}
                error={errors.whatsapp}
                icon={Phone}
                type="tel"
              />
              <Input
                label="Mot de passe"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                error={errors.password}
                icon={Lock}
                type="password"
              />

              {globalError && (
                <div className="bg-red-50 border border-red-200 rounded-[10px] px-4 py-3">
                  <p className="text-sm text-red-700">{globalError}</p>
                </div>
              )}

              <Button type="submit" size="xl" loading={loading} className="w-full mt-2">
                Accéder à ma boutique
              </Button>
            </form>

            <div className="flex items-center gap-2 justify-center pt-6">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-xs text-slate-400">Fonctionne sans connexion internet</p>
            </div>

            <div className="pt-8 text-center">
              <button
                className="text-xs text-slate-300 hover:text-slate-400 transition-colors"
                onClick={() => navigate('/admin/login')}
              >
                Espace administrateur
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 text-center border-t border-slate-100 lg:hidden">
          <p className="text-xs text-slate-400">BoutiK v1.0 · Offline-first</p>
        </div>
      </div>
    </div>
  )
}

function Feature({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 bg-white/5 border border-white/10 rounded-[10px] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-brand" />
      </div>
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
    </div>
  )
}
