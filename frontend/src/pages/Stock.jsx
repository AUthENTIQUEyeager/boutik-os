import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Package, Trash2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import CategorieModal from '../components/modals/CategorieModal';
import { api } from '../lib/api';
import { formatMontant } from '../lib/constants';
import { useApp } from '../store/AppContext';

export default function Stock() {
  const { boutique } = useApp();
  const devise = boutique?.devise || 'FCFA';
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = () => api.getCategories().then(setCategories).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async (payload) => {
    await api.createCategorie(payload);
    await load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette catégorie ? (uniquement possible si le stock est épuisé)')) return;
    try {
      await api.deleteCategorie(id);
      await load();
      if (selected === id) setSelected(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const categoriesFiltrees = useMemo(() => {
    let list = categories;
    if (selected) list = list.filter((c) => c.id === selected);
    if (search) list = list.filter((c) => c.nom.toLowerCase().includes(search.toLowerCase()) || c.prefix.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [categories, selected, search]);

  if (loading) return <div className="pt-20"><Spinner size={32} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-950">Produits & Stock</h1>
        <Button icon={Plus} size="sm" onClick={() => setModalOpen(true)}>Nouvelle catégorie</Button>
      </div>

      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-6">
        {/* Sidebar filtres desktop */}
        <aside className="hidden lg:block">
          <p className="text-sm font-semibold text-slate-500 mb-2">Catégories</p>
          <div className="space-y-1">
            <button
              onClick={() => setSelected(null)}
              className={`w-full text-left px-3 py-2 rounded-btn text-sm ${!selected ? 'bg-brand-soft text-brand font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              Toutes ({categories.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`w-full text-left px-3 py-2 rounded-btn text-sm truncate ${selected === c.id ? 'bg-brand-soft text-brand font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                {c.nom}
              </button>
            ))}
          </div>
        </aside>

        <div>
          <Input icon={Search} placeholder="Rechercher par nom ou ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4 lg:max-w-sm" />

          {categoriesFiltrees.length === 0 ? (
            <EmptyState icon={Package} title="Aucune catégorie" description="Créez votre première catégorie de produits" action={<Button icon={Plus} onClick={() => setModalOpen(true)}>Créer une catégorie</Button>} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoriesFiltrees.map((cat) => (
                <Card key={cat.id}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-950">{cat.nom}</p>
                      <p className="text-xs text-slate-500">{cat.prefix}-XXXX</p>
                    </div>
                    {cat.quantite === 0 ? <Badge variant="danger">Épuisé</Badge> : cat.quantite <= 3 ? <Badge variant="warning">Bas</Badge> : null}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center my-3">
                    <div>
                      <p className="text-lg font-bold text-slate-950">{cat.quantite}</p>
                      <p className="text-xs text-slate-500">Disponible</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-950">{formatMontant(cat.prixVente, devise)}</p>
                      <p className="text-xs text-slate-500">Prix vente</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-brand">{formatMontant(cat.prixVente - cat.prixAchat, devise)}</p>
                      <p className="text-xs text-slate-500">Bénéfice/u</p>
                    </div>
                  </div>
                  {cat.quantite === 0 && (
                    <Button variant="danger" size="sm" icon={Trash2} className="w-full" onClick={() => handleDelete(cat.id)}>
                      Supprimer
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <CategorieModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} />
    </div>
  );
}
