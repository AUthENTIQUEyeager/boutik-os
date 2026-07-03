import { Printer, MessageCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { formatMontant, formatDateTime, waLink } from '../../lib/constants';

export default function RecuModal({ open, onClose, vente, boutique }) {
  if (!vente) return null;
  const devise = boutique?.devise || 'FCFA';

  const handlePrint = () => window.print();

  const texteWhatsapp = `Reçu ${boutique?.nom || 'BoutiK'}\nProduit: ${vente.nomProduit}\nMontant: ${formatMontant(vente.prixVente, devise)}\nDate: ${formatDateTime(vente.date)}\nN°: ${vente.numeroRecu || vente.id}`;

  return (
    <Modal open={open} onClose={onClose} title="Reçu de vente">
      <div id="print-area">
        <div className="text-center mb-4">
          {boutique?.logo && <img src={boutique.logo} alt="Logo" className="w-14 h-14 rounded-lg mx-auto mb-2 object-cover" />}
          <p className="font-bold text-lg text-slate-950">{boutique?.nom}</p>
          {boutique?.adresse && <p className="text-xs text-slate-500">{boutique.adresse}</p>}
        </div>

        <div className="border-t border-b border-dashed border-slate-300 py-3 my-3 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Reçu N°</span><span>{vente.numeroRecu || vente.id.slice(0, 8)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Date</span><span>{formatDateTime(vente.date)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Vendeur</span><span>{vente.vendeurNom}</span></div>
        </div>

        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-700">{vente.nomProduit}</span>
          <span className="font-medium">{formatMontant(vente.prixVente, devise)}</span>
        </div>

        <div className="flex justify-between font-bold text-slate-950 border-t border-slate-200 mt-3 pt-3">
          <span>Total</span>
          <span>{formatMontant(vente.prixVente, devise)}</span>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">Merci pour votre achat !</p>
      </div>

      <div className="flex gap-2 mt-4 no-print">
        <Button className="flex-1" icon={Printer} onClick={handlePrint}>Imprimer</Button>
        <a href={waLink('', texteWhatsapp)} target="_blank" rel="noreferrer" className="flex-1">
          <Button variant="brand_outline" icon={MessageCircle} className="w-full">Partager</Button>
        </a>
      </div>
    </Modal>
  );
}
