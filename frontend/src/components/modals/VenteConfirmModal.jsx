import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { formatMontant } from '../../lib/constants';
import { TrendingUp } from 'lucide-react';

export default function VenteConfirmModal({ open, onClose, categorie, onConfirm, devise }) {
  const [loading, setLoading] = useState(false);
  if (!categorie) return null;

  const benefice = categorie.prixVente - categorie.prixAchat;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(categorie);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Vendre : ${categorie.nom}`}>
      <div className="space-y-3">
        <div className="bg-slate-50 rounded-card p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Prix de vente</span>
            <span className="font-semibold text-slate-950">{formatMontant(categorie.prixVente, devise)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Prix d'achat</span>
            <span className="font-semibold text-slate-950">{formatMontant(categorie.prixAchat, devise)}</span>
          </div>
          <div className="h-px bg-slate-200 my-1" />
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
              <TrendingUp size={14} className="text-brand" /> Bénéfice
            </span>
            <span className="font-bold text-brand text-lg">{formatMontant(benefice, devise)}</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 text-center">Cette vente est définitive et ne peut pas être annulée.</p>
        <Button className="w-full" size="lg" loading={loading} onClick={handleConfirm}>
          Confirmer la vente
        </Button>
      </div>
    </Modal>
  );
}
