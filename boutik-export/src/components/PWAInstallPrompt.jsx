/**
 * BoutiK — PWA Install Prompt v2
 * Android : bouton immédiat dès détection beforeinstallprompt
 * iOS     : encart instructions à partir de la 3e visite dans Safari
 * Une fois installé : tout est masqué définitivement
 */
import { useState, useEffect, useCallback } from 'react'
import { X, Download, Share, Smartphone, Wifi, Zap, ArrowDown } from 'lucide-react'
import {
  isInstalled, isIOS, isAndroid, isStandalone,
  recordVisit, recordInstall, recordDismissed,
  wasDismissed, getBrowserVisits, reportVisitToServer
} from '../lib/pwa-tracking'

// ─── Hook principal ───────────────────────────────────────────────────────────

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showAndroid, setShowAndroid] = useState(false)
  const [showIOS, setShowIOS] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Déjà installé → ne rien faire
    if (isStandalone()) {
      setInstalled(true)
      return
    }

    // Enregistrer la visite
    const visits = recordVisit()
    reportVisitToServer()

    // Déjà refusé définitivement
    if (wasDismissed()) return

    // iOS dans Safari (pas standalone)
    if (isIOS() && !isStandalone()) {
      if (visits >= 3) {
        setTimeout(() => setShowIOS(true), 2000)
      }
      return
    }

    // Android : intercepter beforeinstallprompt
    if (isAndroid() || (!isIOS())) {
      const handler = (e) => {
        e.preventDefault()
        setDeferredPrompt(e)
        // Afficher immédiatement sur Android
        setTimeout(() => setShowAndroid(true), 1500)
      }
      window.addEventListener('beforeinstallprompt', handler)

      // Détecter si déjà installé via appinstalled
      window.addEventListener('appinstalled', () => {
        recordInstall('android')
        setInstalled(true)
        setShowAndroid(false)
        setDeferredPrompt(null)
      })

      return () => window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const installAndroid = useCallback(async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      recordInstall('android')
      setInstalled(true)
    }
    setShowAndroid(false)
    setDeferredPrompt(null)
  }, [deferredPrompt])

  const dismissAndroid = useCallback(() => {
    recordDismissed()
    setShowAndroid(false)
  }, [])

  const dismissIOS = useCallback(() => {
    recordDismissed()
    setShowIOS(false)
  }, [])

  return {
    showAndroid, showIOS, installed,
    installAndroid, dismissAndroid, dismissIOS,
    canInstall: !!deferredPrompt
  }
}

// ─── Composant Android ────────────────────────────────────────────────────────

export function AndroidInstallBanner({ onInstall, onDismiss }) {
  return (
    <div className="fixed bottom-20 md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:w-96 z-50 animate-slide-up">
      <div className="bg-white border border-slate-200 rounded-[18px] shadow-modal overflow-hidden">

        {/* Header vert */}
        <div className="bg-brand px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-[10px] flex items-center justify-center">
              <span className="text-white font-bold text-base">B</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Installer BoutiK</p>
              <p className="text-xs text-white/80">Application gratuite</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>

        <div className="px-5 py-4">
          {/* Avantages */}
          <div className="space-y-2.5 mb-5">
            {[
              { icon: Wifi,       text: 'Fonctionne sans connexion internet' },
              { icon: Zap,        text: 'Accès instantané depuis votre écran d\'accueil' },
              { icon: Smartphone, text: 'Expérience identique à une application native' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-brand-soft border border-brand-border rounded-[8px] flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-brand" />
                </div>
                <p className="text-xs text-slate-600 leading-snug">{text}</p>
              </div>
            ))}
          </div>

          {/* Boutons */}
          <div className="flex gap-2">
            <button
              onClick={onDismiss}
              className="flex-1 py-2.5 rounded-[10px] border border-slate-200 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Plus tard
            </button>
            <button
              onClick={onInstall}
              className="flex-1 py-2.5 rounded-[10px] bg-brand text-white text-xs font-bold hover:bg-brand-light transition-colors flex items-center justify-center gap-1.5 shadow-brand shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Installer maintenant
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Composant iOS ────────────────────────────────────────────────────────────

export function IOSInstallBanner({ onDismiss }) {
  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 animate-slide-up">
      <div className="bg-white border border-slate-200 rounded-[18px] shadow-modal overflow-hidden">

        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand rounded-[10px] flex items-center justify-center">
              <span className="text-white font-bold text-base">B</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Installer BoutiK</p>
              <p className="text-xs text-white/60">Sur votre iPhone</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-slate-700 mb-3">3 étapes pour installer :</p>

          <div className="space-y-3 mb-5">
            <Step num="1" icon={<Share className="w-4 h-4 text-blue-500" />}
              text='Appuyez sur le bouton Partager' sub="En bas de votre écran Safari" />
            <Step num="2" icon={<span className="text-sm">⊕</span>}
              text={"Appuyez sur \"Sur l'écran d'accueil\""} sub="Faites défiler vers le bas" />
            <Step num="3" icon={<span className="text-sm font-bold text-blue-500">✓</span>}
              text='Appuyez sur "Ajouter"' sub="BoutiK apparaît sur votre écran" />
          </div>

          {/* Flèche indicatrice vers le bas (vers la barre Safari) */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-[8px] px-3 py-2">
              <ArrowDown className="w-3.5 h-3.5 text-blue-500 animate-bounce" />
              <span className="text-xs text-blue-600 font-medium">Le bouton Partager est en bas</span>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="w-full py-2.5 rounded-[10px] border border-slate-200 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
          >
            Compris, j'installerai plus tard
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Composant principal (utilisé dans App.jsx) ───────────────────────────────

export default function PWAInstallPrompt() {
  const { showAndroid, showIOS, installed, installAndroid, dismissAndroid, dismissIOS, canInstall } = usePWAInstall()

  // Déjà installé → rien
  if (installed || isStandalone()) return null

  if (showAndroid && canInstall) {
    return <AndroidInstallBanner onInstall={installAndroid} onDismiss={dismissAndroid} />
  }

  if (showIOS) {
    return <IOSInstallBanner onDismiss={dismissIOS} />
  }

  return null
}

// ─── Sous-composant ───────────────────────────────────────────────────────────

function Step({ num, icon, text, sub }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-slate-500 mt-0.5">
        {num}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <p className="text-sm font-medium text-slate-800">{text}</p>
        </div>
        <p className="text-xs text-slate-400 mt-0.5 ml-6">{sub}</p>
      </div>
    </div>
  )
}
