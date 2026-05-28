/**
 * BoutiK - Page de connexion
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../lib/auth'
import { useApp } from '../store/AppContext'
import { Button, Input } from '../components/ui'

export default function LoginPage() {
  const [form, setForm] = useState({ nom: '', whatsapp: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const { login: setSession } = useApp()
  const navigate = useNavigate()

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  function validate() {
    const errs = {}
    if (!form.nom.trim()) errs.nom = 'Nom de boutique requis'
    if (!form.whatsapp.trim()) errs.whatsapp = 'Numéro WhatsApp requis'
    if (!form.password.trim()) errs.password = 'Mot de passe requis'
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
    } catch (err) {
      setGlobalError('Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Illustration haute */}
      <div className="bg-paper-soft h-40 flex items-end justify-center pb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-ink rounded-2xl flex items-center justify-center shadow-card">
            <span className="text-white text-xl font-bold">B</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">BoutiK</h1>
            <p className="text-xs text-ink-muted">Gérez votre boutique</p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex-1 px-6 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-ink">Connexion</h2>
          <p className="text-sm text-ink-muted mt-1">
            Entrez vos informations pour accéder à votre boutique
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nom de la boutique"
            placeholder="Ex: Boutique Aminata"
            value={form.nom}
            onChange={set('nom')}
            error={errors.nom}
            autoComplete="organization"
          />
          <Input
            label="Numéro WhatsApp"
            placeholder="Ex: +226 70 00 00 00"
            value={form.whatsapp}
            onChange={set('whatsapp')}
            error={errors.whatsapp}
            type="tel"
            autoComplete="tel"
          />
          <Input
            label="Mot de passe"
            placeholder="Votre mot de passe"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            type="password"
            autoComplete="current-password"
          />

          {globalError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-accent-danger">{globalError}</p>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            loading={loading}
            className="mt-2 w-full"
          >
            Se connecter
          </Button>
        </form>

        <p className="text-xs text-ink-muted text-center mt-6 leading-relaxed">
          Première connexion ? Entrez vos informations pour créer votre compte boutique.
        </p>

        {/* Lien admin discret */}
        <div className="mt-8 text-center">
          <button
            className="text-xs text-paper-border hover:text-ink-muted transition-colors"
            onClick={() => navigate('/admin/login')}
          >
            Espace administrateur
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 text-center">
        <p className="text-xs text-ink-muted">BoutiK v1.0 — Fonctionne hors ligne</p>
      </div>
    </div>
  )
}
