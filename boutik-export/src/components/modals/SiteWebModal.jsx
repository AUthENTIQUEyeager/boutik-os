/**
 * BoutiK — Modal "Demander un site web"
 */
import { useApp } from '../../store/AppContext'
import { X, Globe, ShoppingBag, Users, BarChart3, Share2, Star, ArrowRight } from 'lucide-react'
import { Button } from '../ui'

const ATOUTS = [
  {
    icon: ShoppingBag,
    titre: 'Boutique en ligne 24h/24',
    desc: 'Vos clients commandent même quand vous dormez. Votre boutique ne ferme jamais.'
  },
  {
    icon: Users,
    titre: 'Touchez plus de clients',
    desc: 'Soyez visible sur Google et les réseaux sociaux. Attirez des clients de toute la ville.'
  },
  {
    icon: Share2,
    titre: 'Lien WhatsApp partageable',
    desc: 'Partagez votre catalogue en un lien. Vos clients voient vos produits avant de se déplacer.'
  },
  {
    icon: BarChart3,
    titre: 'Synchronisé avec BoutiK',
    desc: 'Vos ventes en ligne s\'enregistrent automatiquement dans votre application.'
  },
  {
    icon: Star,
    titre: 'Image professionnelle',
    desc: 'Un site soigné inspire confiance et distingue votre boutique de la concurrence.'
  },
]

export default function SiteWebModal({ onClose }) {
  const { boutique } = useApp()

  const whatsappMsg = encodeURIComponent(
    `Bonjour, je possède une boutique et j'utilise BoutiK. Je souhaite créer un site web pour mon commerce.\n\nBoutique : ${boutique?.nom}\nContact : ${boutique?.whatsapp}`
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative bg-white rounded-t-[22px] lg:rounded-[22px] w-full max-w-md shadow-modal animate-slide-up lg:my-8 overflow-y-auto"
        style={{ maxHeight: '90vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-white z-10 border-b border-slate-100">
          <div className="w-9 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="px-6 pt-4 pb-8">

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-brand-soft border border-brand-border rounded-[10px] flex items-center justify-center">
                  <Globe className="w-4 h-4 text-brand" />
                </div>
                <span className="text-xs font-semibold text-brand uppercase tracking-wide">Site web</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Développez votre boutique en ligne</h2>
              <p className="text-sm text-slate-500 mt-1">
                Un site web professionnel connecté à BoutiK
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors shrink-0">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Atouts */}
          <div className="space-y-3 mb-6">
            {ATOUTS.map(({ icon: Icon, titre, desc }) => (
              <div key={titre} className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-[12px] p-3.5">
                <div className="w-8 h-8 bg-white border border-slate-200 rounded-[8px] flex items-center justify-center shrink-0 shadow-card">
                  <Icon className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{titre}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Prix indicatif */}
          <div className="bg-brand-soft border border-brand-border rounded-[14px] p-4 mb-6 text-center">
            <p className="text-xs text-brand font-medium mb-1">Tarif sur mesure</p>
            <p className="text-sm text-slate-700">
              Prix adapté à votre budget. Contactez-nous pour un devis gratuit.
            </p>
          </div>

          {/* CTA WhatsApp */}
          <button
            onClick={() => window.open(`https://wa.me/22665189025?text=${whatsappMsg}`, '_blank')}
            className="w-full flex items-center justify-between px-5 py-4 bg-green-600 text-white rounded-[14px] hover:bg-green-700 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-3">
              <WhatsAppIcon />
              <div className="text-left">
                <p className="text-sm font-semibold">Demander mon site web</p>
                <p className="text-xs text-green-200">Réponse sous 24h</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-green-200" />
          </button>

          <button onClick={onClose} className="w-full text-xs text-slate-400 text-center mt-4">
            Pas maintenant
          </button>
        </div>
      </div>
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}
