import { useEffect, useState, useMemo } from 'react';
import { Plus, Receipt, Trash2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import { api } from '../lib/api';
import { CATEGORIES_DEPENSE, formatMontant, formatDate } from '../lib/constants';
import { useApp } from '../store/AppContext';

const PERIODES = [
  { key: 'aujourdhui', label: "Aujourd'hui" },
  { key: '30j', label: '30 jours' },
  { key: 'tout', label: 'Tout' },
];

export default function Depenses() {
  const { boutique } = useApp();
  const devise = boutique?.devise || 'FCFA';
  const [depenses, setDepenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState('30j');
  const [categorie, setCategorie] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ montant: '', categorie: 'stock', description: '' });
  const [saving, setSaving] = useState(false);

  const load = () => api.getDepenses().then(setDepenses).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleCreate = async () => {
    if (!form.montant) return;
    setSaving(true);
    try {
      await api.createDepense(form);
      await load();
      setForm({ montant: '', categorie: 'stock', description: '' });
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette dépense ?')) return;
    await api.deleteDepense(id);
    await load();
  };

  const filtered = useMemo(() => {
    let list = depenses;
    if (periode !== 'tout') {
      const from = new Date();
      if (periode === 'aujourdhui') from.setHours(0, 0, 0, 0);
      if (periode === '30j') from.setDate(from.getDate() - 30);
      list = list.filter((d) => new Date(d.date) >= from);
    }
    if (categorie) list = list.filter((d) => d.categorie === categorie);
    return list;
  }, [depenses, periode, categorie]);

  const total = filtered.reduce((s, d) => s + d.montant, 0);

  if (loading) return <div className="pt-20"><Spinner size={32} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-950">Dépenses</h1>
        <Button icon={Plus} size="sm" onClick={() => setModalOpen(true)}>Nouvelle dépense</Button>
      </div>

      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-6">
        <aside className="hidden lg:block">
          <p className="text-sm font-semibold text-slate-500 mb-2">Catégories</p>
          <div className="space-y-1">
            <button onClick={() => setCategorie(null)} className={`w-full text-left px-3 py-2 rounded-btn text-sm ${!categorie ? 'bg-brand-soft text-brand font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}>
              Toutes
            </button>
            {CATEGORIES_DEPENSE.map((c) => (
              <button key={c.value} onClick={() => setCategorie(c.value)} className={`w-full text-left px-3 py-2 rounded-btn text-sm ${categorie === c.value ? 'bg-brand-soft text-brand font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}>
                {c.label}
              </button>
            ))}
          </div>
        </aside>

        <div>
          <div className="flex gap-2 mb-4">
            {PERIODES.map((p) => (
              <button key={p.key} onClick={() => setPeriode(p.key)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${periode === p.key ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700'}`}>
                {p.label}
              </button>
            ))}
          </div>

          <Card className="mb-4 lg:max-w-xs">
            <p className="text-sm text-slate-500">Total période</p>
            <p className="text-2xl font-bold text-danger">{formatMontant(total, devise)}</p>
          </Card>

          {filtered.length === 0 ? (
            <EmptyState icon={Receipt} title="Aucune dépense" description="Enregistrez vos dépenses pour suivre vos coûts" />
          ) : (
            <div className="space-y-2">
              {filtered.map((d) => {
                const catLabel = CATEGORIES_DEPENSE.find((c) => c.value === d.categorie)?.label || d.categorie;
                return (
                  <Card key={d.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-950">{catLabel}</p>
                      {d.description && <p className="text-sm text-slate-500 truncate">{d.description}</p>}
                      <p className="text-xs text-slate-500">{formatDate(d.date)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="font-bold text-danger">-{formatMontant(d.montant, devise)}</p>
                      <button onClick={() => handleDelete(d.id)} className="text-slate-400 hover:text-danger"><Trash2 size={16} /></button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouvelle dépense">
        <div className="space-y-3">
          <Input label="Montant" type="number" value={form.montant} onChange={set('montant')} required placeholder="0" />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Catégorie</label>
            <select value={form.categorie} onChange={set('categorie')} className="w-full h-10 rounded-input border border-slate-200 px-3 text-base">
              {CATEGORIES_DEPENSE.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <Input label="Description" value={form.description} onChange={set('description')} placeholder="Ex: Achat sacs de riz" />
          <Button className="w-full" size="lg" loading={saving} onClick={handleCreate}>Enregistrer</Button>
        </div>
      </Modal>
    </div>
  );
}
