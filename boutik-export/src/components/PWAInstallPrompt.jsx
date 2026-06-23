/**
 * BoutiK — Hook + Composant PWA Install Prompt
 * - Android  : détecte beforeinstallprompt, affiche popup native
 * - iOS      : instructions manuelles (Share → Ajouter à l'écran d'accueil)
 * - Anti-spam : ne s'affiche qu'une fois, après 3 visites, jamais si déjà installé
 */
import { useState, useEffect } from 'react'
import { X, Download, Share } from 'lucide-react'

// ─── Hook ────────────────────────────────────────────────────────────────────

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Déjà installé ou déjà refusé → ne rien faire
    const dismissed = localStorage.getItem('pwa_prompt_dismissed')
    const installed = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true
    if (dismissed || installed) return

    // Incrémenter le compteur de visites
    const visits = parseInt(localStorage.getItem('pwa_visits') || '0') + 1
    localStorage.setItem('pwa_visits', visits)

    // iOS : afficher après 3 visites
    const iosDevice = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(iosDevice)
    if (iosDevice && visits >= 3) {
      setTimeout(() => setShowPrompt(true), 3000)
      return
    }

    // Android : intercepter beforeinstallprompt
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      if (visits >= 3) {
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem('pwa_prompt_dismissed', 'installed')
    }
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  function dismiss() {
    localStorage.setItem('pwa_prompt_dismissed', 'dismissed')
    setShowPrompt(false)
  }

  return { showPrompt, isIOS, install, dismiss }
}

// ─── Composant ───────────────────────────────────────────────────────────────

export default function PWAInstallPrompt() {
  const { showPrompt, isIOS, install, dismiss } = usePWAInstall()

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 animate-slide-up">
      <div className="bg-white border border-slate-200 rounded-[16px] shadow-modal p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-brand rounded-[10px] flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-base">B</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Installer BoutiK</p>
              <p className="text-xs text-slate-500">Accès rapide depuis l'écran d'accueil</p>
            </div>
          </div>
          <button onClick={dismiss} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Avantages */}
        <div className="space-y-1.5 mb-4">
          {[
            'Fonctionne sans connexion internet',
            'Accès rapide comme une vraie app',
            'Notifications de stock faible',
          ].map(txt => (
            <div key={txt} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
              <p className="text-xs text-slate-600">{txt}</p>
            </div>
          ))}
        </div>

        {isIOS ? (
          // Instructions iOS
          <div className="bg-slate-50 border border-slate-200 rounded-[10px] p-3 space-y-2">
            <p className="text-xs font-medium text-slate-700">Comment installer sur iPhone :</p>
            <div className="flex items-center gap-2">
              <Share className="w-4 h-4 text-blue-500 shrink-0" />
              <p className="text-xs text-slate-600">Tapez le bouton Partager en bas de Safari</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 shrink-0 border border-slate-300 rounded-sm flex items-center justify-center">
                <span className="text-[8px] text-slate-500">+</span>
              </div>
              <p className="text-xs text-slate-600">Puis "Sur l'écran d'accueil"</p>
            </div>
            <button onClick={dismiss} className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 transition-colors">
              Compris, plus tard
            </button>
          </div>
        ) : (
          // Boutons Android
          <div className="flex gap-2">
            <button onClick={dismiss} className="flex-1 py-2.5 rounded-[10px] border border-slate-200 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors">
              Plus tard
            </button>
            <button
              onClick={install}
              className="flex-1 py-2.5 rounded-[10px] bg-brand text-white text-xs font-semibold hover:bg-brand-light transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Installer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
