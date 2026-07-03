import { useEffect, useState, useMemo } from 'react';
import { Printer, ShoppingBag } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import RecuModal from '../components/modals/RecuModal';
import { api } from '../lib/api';
import { formatMontant, formatDateTime } from '../lib/constants';
import { useApp } from '../store/AppContext';

const FILTERS = [
  { key: 'aujourdhui', label: "Aujourd'hui" },
  { key: '7j', label: '7 jours' },
  { key: 'tout', label: 'Tout' },
];

export default function Ventes() {
  const { boutique } = useApp();
  const devise = boutique?.devise || 'FCFA';
  const [ventes, setVentes] = useState([]);
  const [filtre, setFiltre] = useState('aujourdhui');
  const [loading, setLoading] = useState(true);
  const [venteRecu, setVenteRecu] = useState(null);

  useEffect(() => {
    api.getVentes().then(setVentes).finally(() => setLoading(false));
  }, []);

  const ventesFiltrees = useMemo(() => {
    if (filtre === 'tout') return ventes;
    const now = new Date();
    const from = new Date();
    if (filtre === 'aujourdhui') from.setHours(0, 0, 0, 0);
    if (filtre === '7j') from.setDate(now.getDate() - 7);
    return ventes.filter((v) => new Date(v.date) >= from);
  }, [ventes, filtre]);

  const totaux = useMemo(() => ({
    ca: ventesFiltrees.reduce((s, v) => s + v.prixVente, 0),
    benefice: ventesFiltrees.reduce((s, v) => s + v.benefice, 0),
  }), [ventesFiltrees]);

  if (loading) return <div className="pt-20"><Spinner size={32} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-950">Historique des ventes</h1>
        <Button variant="secondary" size="sm" icon={Printer} onClick={() => window.print()} className="no-print">
          Imprimer
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltre(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${filtre === f.key ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 lg:max-w-md">
        <Card><p className="text-sm text-slate-500">Chiffre d'affaires</p><p className="text-xl font-bold text-slate-950">{formatMontant(totaux.ca, devise)}</p></Card>
        <Card><p className="text-sm text-slate-500">Bénéfice</p><p className="text-xl font-bold text-brand">{formatMontant(totaux.benefice, devise)}</p></Card>
      </div>

      <div id="print-area">
        {ventesFiltrees.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="Aucune vente" description="Les ventes de cette période apparaîtront ici" />
        ) : (
          <>
            {/* Liste mobile */}
            <div className="lg:hidden space-y-2">
              {ventesFiltrees.map((v) => (
                <Card key={v.id} className="flex items-center justify-between" onClick={() => setVenteRecu(v)}>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-950 truncate">{v.nomProduit}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(v.date)} · {v.vendeurNom}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="font-bold text-slate-950">{formatMontant(v.prixVente, devise)}</p>
                    <Badge variant="brand">+{formatMontant(v.benefice, devise)}</Badge>
                  </div>
                </Card>
              ))}
            </div>

            {/* Tableau desktop */}
            <div className="hidden lg:block bg-white border border-slate-200 rounded-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Produit</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Vendeur</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium text-right">Prix vente</th>
                    <th className="px-4 py-3 font-medium text-right">Bénéfice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ventesFiltrees.map((v) => (
                    <tr key={v.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setVenteRecu(v)}>
                      <td className="px-4 py-3 font-medium text-slate-950">{v.nomProduit}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDateTime(v.date)}</td>
                      <td className="px-4 py-3 text-slate-500">{v.vendeurNom}</td>
                      <td className="px-4 py-3"><Badge>{v.type}</Badge></td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-950">{formatMontant(v.prixVente, devise)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-brand">{formatMontant(v.benefice, devise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <RecuModal open={!!venteRecu} onClose={() => setVenteRecu(null)} vente={venteRecu} boutique={boutique} />
    </div>
  );
}
