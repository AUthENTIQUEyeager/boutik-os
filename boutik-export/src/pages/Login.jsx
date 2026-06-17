/**
 * BoutiK — Page de connexion v2
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../lib/auth'
import { useApp } from '../store/AppContext'
import { Button, Input } from '../components/ui'
import { Store, Phone, Lock, ShieldCheck } from 'lucide-react'

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
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Hero */}
      <div className="bg-white border-b border-slate-200 px-6 pt-16 pb-10">
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
        <p className="text-sm text-slate-500 mt-1">
          Connectez-vous ou créez votre boutique
        </p>
      </div>

      {/* Formulaire */}
      <div className="flex-1 px-6 py-8 space-y-4">
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

        {/* Trust */}
        <div className="flex items-center gap-2 justify-center pt-2">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <p className="text-xs text-slate-400">Fonctionne sans connexion internet</p>
        </div>

        {/* Admin link */}
        <div className="pt-8 text-center">
          <button
            className="text-xs text-slate-300 hover:text-slate-400 transition-colors"
            onClick={() => navigate('/admin/login')}
          >
            Espace administrateur
          </button>
        </div>
      </div>

      <div className="px-6 py-4 text-center border-t border-slate-100">
        <p className="text-xs text-slate-400">BoutiK v1.0 · Offline-first</p>
      </div>
    </div>
  )
}
