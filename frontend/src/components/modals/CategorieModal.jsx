import { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function CategorieModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState({ nom: '', prixAchat: '', prixVente: '', quantite: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    setError('');
    if (!form.nom || !form.prixVente || !form.quantite) {
      setError('Nom, prix de vente et quantité sont requis');
      return;
    }
    setLoading(true);
    try {
      await onCreate({
        nom: form.nom,
        prixAchat: Number(form.prixAchat) || 0,
        prixVente: Number(form.prixVente),
        quantite: Number(form.quantite),
      });
      setForm({ nom: '', prixAchat: '', prixVente: '', quantite: '' });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle catégorie de produits">
      <div className="space-y-3">
        <Input label="Nom de la catégorie" value={form.nom} onChange={set('nom')} placeholder="Ex: Riz Mania" required />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Prix d'achat" type="number" value={form.prixAchat} onChange={set('prixAchat')} placeholder="0" />
          <Input label="Prix de vente" type="number" value={form.prixVente} onChange={set('prixVente')} placeholder="0" required />
        </div>
        <Input label="Quantité initiale" type="number" value={form.quantite} onChange={set('quantite')} placeholder="0" required />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button className="w-full" size="lg" loading={loading} onClick={handleSubmit}>Créer la catégorie</Button>
      </div>
    </Modal>
  );
}
