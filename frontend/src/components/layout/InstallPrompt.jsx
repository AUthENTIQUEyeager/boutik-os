import { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { api } from '../../lib/api';

const VISIT_COUNT_KEY = 'boutik_pwa_visits';
const DISMISSED_KEY = 'boutik_pwa_dismissed';

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isIOS() {
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const visits = Number(localStorage.getItem(VISIT_COUNT_KEY) || 0) + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(visits));

    api.trackVisit(isIOS() ? 'ios' : 'android', false).catch(() => {});

    if (visits < 3) return;

    if (isIOS()) {
      setShowBanner(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS()) {
      setShowIosModal(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      api.trackInstall('android').catch(() => {});
    }
    setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-brand text-white rounded-card shadow-lg p-4 z-40 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
          <Download size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Installer BoutiK</p>
          <p className="text-xs text-white/80 mt-0.5">Accédez plus vite à votre boutique depuis l'écran d'accueil.</p>
          <Button variant="secondary" size="xs" className="mt-2 !bg-white !text-brand" onClick={handleInstall}>
            Installer
          </Button>
        </div>
        <button onClick={handleDismiss} className="text-white/80 hover:text-white shrink-0">
          <X size={18} />
        </button>
      </div>

      <Modal open={showIosModal} onClose={() => setShowIosModal(false)} title="Installer BoutiK">
        <div className="space-y-4 text-sm text-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-soft text-brand flex items-center justify-center font-bold shrink-0">1</div>
            <p>Appuyez sur l'icône <Share size={14} className="inline mx-1" /> Partager en bas de Safari</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-soft text-brand flex items-center justify-center font-bold shrink-0">2</div>
            <p>Sélectionnez "Sur l'écran d'accueil"</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-soft text-brand flex items-center justify-center font-bold shrink-0">3</div>
            <p>Appuyez sur "Ajouter" en haut à droite</p>
          </div>
        </div>
      </Modal>
    </>
  );
}
