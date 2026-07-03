import { useEffect, useState } from 'react';
import { Plus, Wallet, ChevronDown, MessageCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import { api } from '../lib/api';
import { formatMontant, formatDate, waLink } from '../lib/constants';
import { useApp } from '../store/AppContext';

export default function Dettes() {
  const { boutique } = useApp();
  const devise = boutique?.devise || 'FCFA';
  const [dettes, setDettes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(null);
  const [form, setForm] = useState({ nomClient: '', telephone: '', montantTotal: '', description: '' });
  const [montantPaiement, setMontantPaiement] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.getDettes().then(setDettes).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleCreate = async () => {
    if (!form.nomClient || !form.montantTotal) return;
    setSaving(true);
    try {
      await api.createDette(form);
      await load();
      setForm({ nomClient: '', telephone: '', montantTotal: '', description: '' });
      setCreateOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handlePaiement = async () => {
    if (!montantPaiement || !payOpen) return;
    setSaving(true);
    try {
      await api.addPaiementDette(payOpen.id, Number(montantPaiement));
      await load();
      setMontantPaiement('');
      setPayOpen(null);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="pt-20"><Spinner size={32} /></div>;

  const enCours = dettes.filter((d) => d.statut === 'en_cours');
  const totalDu = enCours.reduce((s, d) => s + d.solde, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-950">Dettes clients</h1>
        <Button icon={Plus} size="sm" onClick={() => setCreateOpen(true)}>Nouvelle dette</Button>
      </div>

      <Card className="mb-4 lg:max-w-xs">
        <p className="text-sm text-slate-500">Total dû ({enCours.length} en cours)</p>
        <p className="text-2xl font-bold text-danger">{formatMontant(totalDu, devise)}</p>
      </Card>

      {dettes.length === 0 ? (
        <EmptyState icon={Wallet} title="Aucune dette" description="Les dettes clients apparaîtront ici" action={<Button icon={Plus} onClick={() => setCreateOpen(true)}>Ajouter une dette</Button>} />
      ) : (
        <>
          {/* Cards mobile */}
          <div className="lg:hidden space-y-2">
            {dettes.map((d) => (
              <Card key={d.id}>
                <div className="flex items-start justify-between" onClick={() => setExpanded(expanded === d.id ? null : d.id)}>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-950 truncate">{d.nomClient}</p>
                    <p className="text-xs text-slate-500">{formatDate(d.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2 flex items-center gap-1">
                    <div>
                      <p className="font-bold text-slate-950">{formatMontant(d.solde, devise)}</p>
                      <Badge variant={d.statut === 'paye' ? 'success' : 'warning'}>{d.statut === 'paye' ? 'Payé' : 'En cours'}</Badge>
                    </div>
                    <ChevronDown size={16} className={`transition-transform ${expanded === d.id ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                {expanded === d.id && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    <p className="text-sm text-slate-500">Total: {formatMontant(d.montantTotal, devise)} · Payé: {formatMontant(d.montantPaye, devise)}</p>
                    {d.paiements?.length > 0 && (
                      <div className="text-xs text-slate-500 space-y-1">
                        {d.paiements.map((p) => <p key={p.id}>{formatDate(p.date)} : +{formatMontant(p.montant, devise)}</p>)}
                      </div>
                    )}
                    <div className="flex gap-2">
                      {d.statut === 'en_cours' && <Button size="sm" className="flex-1" onClick={() => setPayOpen(d)}>Encaisser</Button>}
                      {d.telephone && <a href={waLink(d.telephone)} target="_blank" rel="noreferrer" className="flex-1"><Button size="sm" variant="brand_outline" icon={MessageCircle} className="w-full">WhatsApp</Button></a>}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Tableau desktop */}
          <div className="hidden lg:block bg-white border border-slate-200 rounded-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium text-right">Payé</th>
                  <th className="px-4 py-3 font-medium text-right">Solde</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dettes.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3 font-medium text-slate-950">{d.nomClient}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(d.createdAt)}</td>
                    <td className="px-4 py-3 text-right">{formatMontant(d.montantTotal, devise)}</td>
                    <td className="px-4 py-3 text-right">{formatMontant(d.montantPaye, devise)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatMontant(d.solde, devise)}</td>
                    <td className="px-4 py-3"><Badge variant={d.statut === 'paye' ? 'success' : 'warning'}>{d.statut === 'paye' ? 'Payé' : 'En cours'}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      {d.statut === 'en_cours' && <Button size="xs" onClick={() => setPayOpen(d)}>Encaisser</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nouvelle dette">
        <div className="space-y-3">
          <Input label="Nom du client" value={form.nomClient} onChange={set('nomClient')} required placeholder="Ex: Ali Traoré" />
          <Input label="Téléphone (optionnel)" value={form.telephone} onChange={set('telephone')} placeholder="Ex: 70123456" />
          <Input label="Montant total" type="number" value={form.montantTotal} onChange={set('montantTotal')} required placeholder="0" />
          <Input label="Description" value={form.description} onChange={set('description')} placeholder="Ex: 2 sacs de riz à crédit" />
          <Button className="w-full" size="lg" loading={saving} onClick={handleCreate}>Créer la dette</Button>
        </div>
      </Modal>

      <Modal open={!!payOpen} onClose={() => setPayOpen(null)} title="Encaisser un paiement">
        {payOpen && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Solde restant : <span className="font-bold text-slate-950">{formatMontant(payOpen.solde, devise)}</span></p>
            <Input label="Montant reçu" type="number" value={montantPaiement} onChange={(e) => setMontantPaiement(e.target.value)} required placeholder="0" />
            <Button className="w-full" size="lg" loading={saving} onClick={handlePaiement}>Enregistrer le paiement</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
