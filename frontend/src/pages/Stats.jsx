import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Percent } from 'lucide-react';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Spinner from '../components/ui/Spinner';
import { api } from '../lib/api';
import { formatMontant } from '../lib/constants';
import { useApp } from '../store/AppContext';

const PERIODES = [
  { key: '7j', label: '7 jours' },
  { key: '30j', label: '30 jours' },
  { key: 'tout', label: 'Tout' },
];

export default function Stats() {
  const { boutique } = useApp();
  const devise = boutique?.devise || 'FCFA';
  const [periode, setPeriode] = useState('7j');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getBossStats(periode).then(setData).finally(() => setLoading(false));
  }, [periode]);

  if (loading || !data) return <div className="pt-20"><Spinner size={32} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-950">Statistiques</h1>
        <div className="flex gap-2">
          {PERIODES.map((p) => (
            <button key={p.key} onClick={() => setPeriode(p.key)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${periode === p.key ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={DollarSign} label="Chiffre d'affaires" value={formatMontant(data.ca, devise)} />
        <StatCard icon={TrendingUp} label="Bénéfice net" value={formatMontant(data.benefice, devise)} variant="brand" />
        <StatCard icon={ShoppingBag} label="Nombre de ventes" value={data.nombreVentes} />
        <StatCard icon={Percent} label="Marge" value={`${data.marge}%`} />
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-6">
        <Card>
          <p className="font-semibold text-slate-950 mb-4">Évolution 7 derniers jours</p>
          <BarChart data={data.days7} devise={devise} />
        </Card>

        <div className="mt-4 lg:mt-0">
          <p className="font-semibold text-slate-950 mb-3">Top catégories</p>
          <div className="space-y-2">
            {data.topCategories.length === 0 && <p className="text-sm text-slate-500">Aucune donnée pour cette période</p>}
            {data.topCategories.map((c, i) => (
              <Card key={i} className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-slate-950 truncate">{c.nom}</p>
                  <p className="text-xs text-slate-500">{c.ventes} vente(s)</p>
                </div>
                <p className="font-bold text-brand shrink-0 ml-2">{formatMontant(c.benefice, devise)}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BarChart({ data, devise }) {
  const max = Math.max(...data.map((d) => d.ca), 1);
  const width = 700;
  const height = 220;
  const barWidth = width / data.length - 16;

  return (
    <svg viewBox={`0 0 ${width} ${height + 30}`} className="w-full h-auto">
      {data.map((d, i) => {
        const barHeight = (d.ca / max) * height;
        const x = i * (width / data.length) + 8;
        const y = height - barHeight;
        return (
          <g key={d.date}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx={6} fill="#16A34A" opacity={0.85} />
            <text x={x + barWidth / 2} y={height + 18} textAnchor="middle" fontSize="10" fill="#64748B">
              {new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
