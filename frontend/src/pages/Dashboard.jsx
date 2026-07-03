import { useEffect, useState, useCallback } from 'react';
import { Wallet, ShoppingBag, Package, AlertTriangle, Zap, Plus } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import VenteRapideModal from '../components/modals/VenteRapideModal';
import VenteConfirmModal from '../components/modals/VenteConfirmModal';
import { api } from '../lib/api';
import { syncService } from '../lib/sync';
import { formatMontant, formatDateTime } from '../lib/constants';
import { useApp } from '../store/AppContext';

export default function Dashboard() {
  const { boutique } = useApp();
  const devise = boutique?.devise || 'FCFA';

  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [ventesRecentes, setVentesRecentes] = useState([]);
  const [filtre, setFiltre] = useState('toutes');
  const [loading, setLoading] = useState(true);
  const [venteRapideOpen, setVenteRapideOpen] = useState(false);
  const [categorieToVendre, setCategorieToVendre] = useState(null);

  const load = useCallback(async () => {
    try {
      const [statsData, cats, ventes] = await Promise.all([
        api.getStats(),
        api.getCategories(),
        api.getVentes(),
      ]);
      setStats(statsData);
      setCategories(cats);
      setVentesRecentes(ventes.slice(0, 8));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleVente = async (payload) => {
    await api.createVente(payload);
    await load();
    syncService.syncNow();
  };

  const handleVenteCategorie = async (cat) => {
    const produits = await api.getProduits({ categorieId: cat.id, vendu: 'false' });
    const produit = produits[0];
    if (!produit) return;
    await handleVente({
      produitId: produit.id,
      categorieId: cat.id,
      nomProduit: cat.nom,
      prixVente: cat.prixVente,
      prixAchat: cat.prixAchat,
    });
  };

  const categoriesFiltrees = filtre === 'toutes' ? categories : categories.filter((c) => c.id === filtre);

  if (loading) return <div className="pt-20"><Spinner size={32} /></div>;

  return (
    <div>
      {/* ==== MOBILE ==== */}
      <div className="lg:hidden space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Wallet} label="Bénéfice du jour" value={formatMontant(stats?.beneficeJour, devise)} variant="brand" />
          <StatCard icon={ShoppingBag} label="Ventes du jour" value={stats?.nombreVentesJour ?? 0} />
        </div>

        <Button className="w-full" size="lg" icon={Zap} onClick={() => setVenteRapideOpen(true)}>
          Vente rapide
        </Button>

        {stats?.alertesStock > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 text-warning rounded-btn px-3 py-2 text-sm">
            <AlertTriangle size={16} />
            {stats.alertesStock} catégorie(s) en stock faible
          </div>
        )}

        <CategoryFilterPills categories={categories} filtre={filtre} setFiltre={setFiltre} />

        <div className="grid grid-cols-2 gap-3">
          {categoriesFiltrees.map((cat) => (
            <ProductCard key={cat.id} cat={cat} devise={devise} onVendre={() => setCategorieToVendre(cat)} />
          ))}
        </div>
        {categoriesFiltrees.length === 0 && (
          <EmptyState icon={Package} title="Aucun produit" description="Ajoutez une catégorie de produits depuis la page Stock" />
        )}
      </div>

      {/* ==== DESKTOP ==== */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard icon={Wallet} label="Bénéfice du jour" value={formatMontant(stats?.beneficeJour, devise)} variant="brand" />
          <StatCard icon={ShoppingBag} label="CA du jour" value={formatMontant(stats?.caJour, devise)} />
          <StatCard icon={Package} label="Stock disponible" value={stats?.stockTotal ?? 0} sub={`${stats?.nombreCategories ?? 0} catégories`} />
          <StatCard icon={AlertTriangle} label="Alertes stock" value={stats?.alertesStock ?? 0} variant={stats?.alertesStock > 0 ? 'warning' : 'default'} />
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-slate-950">Produits</h2>
              <Button icon={Zap} size="sm" onClick={() => setVenteRapideOpen(true)}>Vente rapide</Button>
            </div>
            <CategoryFilterPills categories={categories} filtre={filtre} setFiltre={setFiltre} />
            <div className="grid grid-cols-3 gap-4 mt-3">
              {categoriesFiltrees.map((cat) => (
                <ProductCard key={cat.id} cat={cat} devise={devise} onVendre={() => setCategorieToVendre(cat)} />
              ))}
            </div>
            {categoriesFiltrees.length === 0 && (
              <EmptyState icon={Package} title="Aucun produit" description="Ajoutez une catégorie de produits depuis la page Stock" />
            )}
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-950 mb-3">Activité récente</h2>
            <Card padding="p-0">
              {ventesRecentes.length === 0 ? (
                <div className="p-4"><EmptyState icon={ShoppingBag} title="Aucune vente" description="Les ventes récentes apparaîtront ici" /></div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {ventesRecentes.map((v) => (
                    <div key={v.id} className="p-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-950 truncate">{v.nomProduit}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(v.date)}</p>
                      </div>
                      <Badge variant="brand">{formatMontant(v.prixVente, devise)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <VenteRapideModal open={venteRapideOpen} onClose={() => setVenteRapideOpen(false)} onConfirm={handleVente} devise={devise} />
      <VenteConfirmModal open={!!categorieToVendre} onClose={() => setCategorieToVendre(null)} categorie={categorieToVendre} onConfirm={handleVenteCategorie} devise={devise} />
    </div>
  );
}

function CategoryFilterPills({ categories, filtre, setFiltre }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      <button
        onClick={() => setFiltre('toutes')}
        className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium ${filtre === 'toutes' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700'}`}
      >
        Toutes
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => setFiltre(c.id)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium ${filtre === c.id ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700'}`}
        >
          {c.nom}
        </button>
      ))}
    </div>
  );
}

function ProductCard({ cat, devise, onVendre }) {
  const badge = cat.quantite === 0 ? { label: 'Épuisé', variant: 'danger' } : cat.quantite <= 3 ? { label: 'Bas', variant: 'warning' } : null;
  return (
    <Card>
      <div className="flex items-start justify-between mb-2">
        <p className="font-semibold text-slate-950 truncate">{cat.nom}</p>
        {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
      </div>
      <p className="text-lg font-bold text-brand mb-1">{formatMontant(cat.prixVente, devise)}</p>
      <p className="text-xs text-slate-500 mb-3">{cat.quantite} en stock</p>
      <Button size="sm" className="w-full" disabled={cat.quantite === 0} onClick={onVendre} icon={Plus}>
        Vendre
      </Button>
    </Card>
  );
}
