import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Users, Phone, Mail, Trash2, Edit2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import { api } from '../lib/api';
import { waLink } from '../lib/constants';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nom: '', telephone: '', email: '', adresse: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = () => api.getClients().then(setClients).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ nom: '', telephone: '', email: '', adresse: '', notes: '' });
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ nom: c.nom, telephone: c.telephone || '', email: c.email || '', adresse: c.adresse || '', notes: c.notes || '' });
    setModalOpen(true);
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.nom) return;
    setSaving(true);
    try {
      if (editing) await api.updateClient(editing.id, form);
      else await api.createClient(form);
      await load();
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce client ?')) return;
    await api.deleteClient(id);
    await load();
  };

  const filtered = useMemo(
    () => clients.filter((c) => c.nom.toLowerCase().includes(search.toLowerCase()) || c.telephone?.includes(search)),
    [clients, search]
  );

  if (loading) return <div className="pt-20"><Spinner size={32} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-950">Clients</h1>
        <Button icon={Plus} size="sm" onClick={openCreate}>Nouveau client</Button>
      </div>

      <Input icon={Search} placeholder="Rechercher un client..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4 lg:max-w-sm" />

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="Aucun client" description="Ajoutez vos clients pour suivre leurs achats et dettes" action={<Button icon={Plus} onClick={openCreate}>Ajouter un client</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950 truncate">{c.nom}</p>
                  {c.telephone && <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5"><Phone size={12} />{c.telephone}</p>}
                  {c.email && <p className="text-sm text-slate-500 flex items-center gap-1"><Mail size={12} />{c.email}</p>}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {c.telephone && (
                  <a href={waLink(c.telephone)} target="_blank" rel="noreferrer" className="flex-1">
                    <Button variant="brand_outline" size="sm" className="w-full">WhatsApp</Button>
                  </a>
                )}
                <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(c)} />
                <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(c.id)} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier le client' : 'Nouveau client'}>
        <div className="space-y-3">
          <Input label="Nom" value={form.nom} onChange={set('nom')} required placeholder="Ex: Ali Traoré" />
          <Input label="Téléphone" value={form.telephone} onChange={set('telephone')} placeholder="Ex: 70123456" />
          <Input label="Email" value={form.email} onChange={set('email')} placeholder="Ex: ali@mail.com" />
          <Input label="Adresse" value={form.adresse} onChange={set('adresse')} placeholder="Ex: Secteur 12" />
          <Input label="Notes" value={form.notes} onChange={set('notes')} placeholder="Notes libres" />
          <Button className="w-full" size="lg" loading={saving} onClick={handleSave}>
            {editing ? 'Enregistrer' : 'Créer le client'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
