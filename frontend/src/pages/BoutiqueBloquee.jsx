import { Lock, MessageCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import { waLink, WHATSAPP_SUPPORT, WHATSAPP_SUPPORT_DISPLAY } from '../lib/constants';
import { logout } from '../lib/auth';

export default function BoutiqueBloquee() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-danger flex items-center justify-center mx-auto mb-4">
          <Lock size={28} />
        </div>
        <h1 className="text-xl font-bold text-slate-950">Accès suspendu</h1>
        <p className="text-sm text-slate-500 mt-2">
          Votre boutique est temporairement bloquée. Contactez le support pour régulariser votre abonnement.
        </p>
        <a href={waLink(WHATSAPP_SUPPORT, "Bonjour, ma boutique BoutiK est bloquée, j'aimerais la débloquer.")} target="_blank" rel="noreferrer" className="block mt-6">
          <Button className="w-full" size="lg" icon={MessageCircle}>
            Contacter le support ({WHATSAPP_SUPPORT_DISPLAY})
          </Button>
        </a>
        <button onClick={logout} className="text-sm text-slate-500 mt-4 underline">
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
