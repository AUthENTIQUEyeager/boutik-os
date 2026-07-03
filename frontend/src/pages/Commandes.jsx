import { useEffect, useState } from 'react';
import { Plus, ClipboardList, Trash2, Check, X as XIcon } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import { api } from '../lib/api';
import { formatMontant, formatDate } from '../lib/constants';
import { useApp } from '../store/AppContext';

const STATUT_BADGE = {
  en_attente: { label: 'En attente', variant: 'warning' },
  recue: { label: 'Reçue', variant: 'success' },
  annulee: { label: 'Annulée', variant: 'danger' },
};

export default function Commandes() {
  const { boutique } = useApp();
  const devise = boutique?.devise || 'FCFA';
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [fournisseur, setFournisseur] = useState('');
  const [notes, setNotes] = useState('');
  const [lignes, setLignes] = useState([{ nomProduit: '', quantite: '', prixUnitaire: '' }]);
  const [saving, setSaving] = useState(false);

  const load = () => api.getCommandes().then(setCommandes).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const addLigne = () => setLignes((l) => [...l, { nomProduit: '', quantite: '', prixUnitaire: '' }]);
  const updateLigne = (i, key, value) => setLignes((l) => l.map((x, idx) => (idx === i ? { ...x, [key]: value } : x)));
  const removeLigne = (i) => setLignes((l) => l.filter((_, idx) => idx !== i));

  const resetForm = () => {
    setFournisseur('');
    setNotes('');
    setLignes([{ nomProduit: '', quantite: '', prixUnitaire: '' }]);
  };

  const handleCreate = async () => {
    const valid = lignes.filter((l) => l.nomProduit && l.quantite && l.prixUnitaire);
    if (valid.length === 0) return;
    setSaving(true);
    try {
      await api.createCommande({ fournisseur, notes, lignes: valid });
      await load();
      resetForm();
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleStatut = async (id, statut) => {
    await api.updateCommandeStatut(id, statut);
    await load();
  };

  if (loading) return <div className="pt-20"><Spinner size={32} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-950">Commandes fournisseurs</h1>
        <Button icon={Plus} size="sm" onClick={() => setModalOpen(true)}>Nouvelle commande</Button>
      </div>

      {commandes.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Aucune commande" description="Créez une commande pour réapprovisionner votre stock" action={<Button icon={Plus} onClick={() => setModalOpen(true)}>Nouvelle commande</Button>} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {commandes.map((c) => {
            const statut = STATUT_BADGE[c.statut];
            return (
              <Card key={c.id}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-950">{c.fournisseur || 'Fournisseur non précisé'}</p>
                    <p className="text-xs text-slate-500">{formatDate(c.createdAt)}</p>
                  </div>
                  <Badge variant={statut.variant}>{statut.label}</Badge>
                </div>
                <div className="text-sm text-slate-700 space-y-1 mb-2">
                  {c.lignes.map((l) => (
                    <div key={l.id} className="flex justify-between">
                      <span>{l.nomProduit} × {l.quantite}</span>
                      <span>{formatMontant(l.quantite * l.prixUnitaire, devise)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-slate-950 border-t border-slate-100 pt-2 mb-2">
                  <span>Total</span>
                  <span>{formatMontant(c.total, devise)}</span>
                </div>
                {c.statut === 'en_attente' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="primary" icon={Check} className="flex-1" onClick={() => handleStatut(c.id, 'recue')}>Reçue</Button>
                    <Button size="sm" variant="danger" icon={XIcon} className="flex-1" onClick={() => handleStatut(c.id, 'annulee')}>Annuler</Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouvelle commande" maxWidth="max-w-lg">
        <div className="space-y-3">
          <Input label="Fournisseur" value={fournisseur} onChange={(e) => setFournisseur(e.target.value)} placeholder="Ex: Grossiste Ouaga" />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Produits</label>
            <div className="space-y-2">
              {lignes.map((l, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input placeholder="Nom" value={l.nomProduit} onChange={(e) => updateLigne(i, 'nomProduit', e.target.value)} className="flex-1 h-9 rounded-input border border-slate-200 px-2 text-sm" />
                  <input placeholder="Qté" type="number" value={l.quantite} onChange={(e) => updateLigne(i, 'quantite', e.target.value)} className="w-16 h-9 rounded-input border border-slate-200 px-2 text-sm" />
                  <input placeholder="Prix u." type="number" value={l.prixUnitaire} onChange={(e) => updateLigne(i, 'prixUnitaire', e.target.value)} className="w-20 h-9 rounded-input border border-slate-200 px-2 text-sm" />
                  {lignes.length > 1 && (
                    <button onClick={() => removeLigne(i)} className="text-danger shrink-0"><Trash2 size={16} /></button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addLigne} className="text-sm text-brand font-medium mt-2">+ Ajouter un produit</button>
          </div>
          <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes libres" />
          <Button className="w-full" size="lg" loading={saving} onClick={handleCreate}>Créer la commande</Button>
        </div>
      </Modal>
    </div>
  );
}
