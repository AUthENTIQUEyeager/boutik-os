import { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { formatMontant } from '../../lib/constants';

export default function VenteRapideModal({ open, onClose, onConfirm, devise }) {
  const [nom, setNom] = useState('');
  const [prixVente, setPrixVente] = useState('');
  const [prixAchat, setPrixAchat] = useState('');
  const [loading, setLoading] = useState(false);

  const benefice = (Number(prixVente) || 0) - (Number(prixAchat) || 0);

  const reset = () => {
    setNom('');
    setPrixVente('');
    setPrixAchat('');
  };

  const handleConfirm = async () => {
    if (!prixVente) return;
    setLoading(true);
    try {
      await onConfirm({ nomProduit: nom || 'Vente rapide', prixVente: Number(prixVente), prixAchat: Number(prixAchat) || 0, type: 'rapide' });
      reset();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Vente rapide">
      <div className="space-y-3">
        <Input label="Nom du produit (optionnel)" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Sachet de riz" />
        <Input label="Prix de vente" type="number" value={prixVente} onChange={(e) => setPrixVente(e.target.value)} required placeholder="0" />
        <Input label="Prix d'achat (optionnel)" type="number" value={prixAchat} onChange={(e) => setPrixAchat(e.target.value)} placeholder="0" />

        {prixVente && (
          <div className="bg-brand-soft border border-brand-border rounded-btn px-3 py-2 flex items-center justify-between">
            <span className="text-sm text-slate-700">Bénéfice</span>
            <span className="font-bold text-brand">{formatMontant(benefice, devise)}</span>
          </div>
        )}

        <Button className="w-full" size="lg" disabled={!prixVente} loading={loading} onClick={handleConfirm}>
          Enregistrer la vente
        </Button>
      </div>
    </Modal>
  );
}
