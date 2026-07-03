/**
 * BoutiK — Écran boutique bloquée
 */
import { useApp } from '../store/AppContext'
import { ShieldOff, MessageCircle } from 'lucide-react'

export default function BoutiqueBloquee() {
  const { boutique, logout } = useApp()

  const whatsappMsg = encodeURIComponent(
    `Bonjour, ma boutique "${boutique?.nom}" a été bloquée sur BoutiK. Je souhaite régulariser ma situation. Numéro : ${boutique?.whatsapp}`
  )

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mb-6">
        <ShieldOff className="w-8 h-8 text-red-500" />
      </div>

      <h1 className="text-xl font-bold text-slate-900 mb-2">Accès suspendu</h1>
      <p className="text-sm text-slate-500 leading-relaxed mb-2">
        Votre abonnement BoutiK a pris fin ou votre compte a été suspendu.
      </p>
      <p className="text-sm text-slate-500 leading-relaxed mb-8">
        Contactez-nous pour régulariser votre situation et retrouver l'accès à votre boutique.
      </p>

      <button
        onClick={() => window.open(`https://wa.me/22670000000?text=${whatsappMsg}`, '_blank')}
        className="w-full max-w-xs flex items-center justify-center gap-2 py-3.5 bg-green-600 text-white rounded-[14px] text-sm font-semibold hover:bg-green-700 transition-colors mb-4"
      >
        <MessageCircle className="w-4 h-4" />
        Contacter le support
      </button>

      <button
        onClick={async () => { await logout(); window.location.href = '/login' }}
        className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
      >
        Se déconnecter
      </button>
    </div>
  )
}
