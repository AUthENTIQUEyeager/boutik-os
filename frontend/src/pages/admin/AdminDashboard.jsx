import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Eye, EyeOff, MessageCircle, Lock, Unlock, LogOut,
  Store, DollarSign, TrendingUp, Smartphone,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import Spinner from '../../components/ui/Spinner';
import { api, setApiToken } from '../../lib/api';
import { formatMontant, waLink } from '../../lib/constants';
import { getAdminToken, adminLogout } from '../../lib/auth';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [boutiques, setBoutiques] = useState([]);
  const [stats, setStats] = useState(null);
  const [pwaStats, setPwaStats] = useState(null);
  const [revealed, setRevealed] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      navigate('/admin/login');
      return;
    }
    setApiToken(token);
    setReady(true);
  }, [navigate]);

  useEffect(() => {
    if (!ready) return;
    Promise.all([api.getAdminBoutiques(), api.getAdminStats(), api.getAdminPwaStats()])
      .then(([b, s, p]) => { setBoutiques(b); setStats(s); setPwaStats(p); })
      .finally(() => setLoading(false));
  }, [ready]);

  const toggleReveal = (id) => setRevealed((r) => ({ ...r, [id]: !r[id] }));

  const handleToggleBlocage = async (b) => {
    if (b.bloquee) await api.debloquerBoutique(b.id);
    else await api.bloquerBoutique(b.id);
    setBoutiques(await api.getAdminBoutiques());
  };

  if (!ready || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Spinner size={32} /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header minimaliste sans sidebar */}
      <header className="bg-slate-950 text-white h-16 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} />
          <span className="font-bold">BoutiK Admin</span>
        </div>
        <Button variant="ghost" size="sm" icon={LogOut} className="text-white hover:bg-slate-900" onClick={adminLogout}>
          Déconnexion
        </Button>
      </header>

      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Store} label="Boutiques" value={stats?.nombreBoutiques ?? 0} />
          <StatCard icon={DollarSign} label="CA total" value={formatMontant(stats?.ca)} />
          <StatCard icon={TrendingUp} label="Bénéfice total" value={formatMontant(stats?.benefice)} variant="brand" />
          <StatCard icon={Smartphone} label="Installations PWA" value={pwaStats?.totalInstalls ?? 0} sub={`${pwaStats?.totalVisits ?? 0} visites`} />
        </div>

        {/* Mini graphique PWA 7 jours */}
        {pwaStats?.dailyData && (
          <Card className="mb-6">
            <p className="font-semibold text-slate-950 mb-3">Visites & installations (7 jours)</p>
            <PwaChart data={pwaStats.dailyData} />
          </Card>
        )}

        <p className="font-semibold text-slate-950 mb-3">Boutiques ({boutiques.length})</p>

        {/* Cards mobile */}
        <div className="lg:hidden space-y-3">
          {boutiques.map((b) => (
            <BoutiqueCard key={b.id} b={b} revealed={revealed[b.id]} onToggleReveal={() => toggleReveal(b.id)} onToggleBlocage={() => handleToggleBlocage(b)} />
          ))}
        </div>

        {/* Tableau desktop */}
        <div className="hidden lg:block bg-white border border-slate-200 rounded-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Boutique</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium text-right">CA</th>
                <th className="px-4 py-3 font-medium text-right">Bénéfice</th>
                <th className="px-4 py-3 font-medium">Abonnement</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {boutiques.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-medium text-slate-950">{b.nom}</td>
                  <td className="px-4 py-3">
                    {revealed[b.id] ? (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700">{b.whatsapp}</span>
                        <a href={waLink(b.whatsapp)} target="_blank" rel="noreferrer"><MessageCircle size={14} className="text-brand" /></a>
                      </div>
                    ) : (
                      <button onClick={() => toggleReveal(b.id)} className="text-slate-500 flex items-center gap-1"><Eye size={14} /> Voir infos</button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{formatMontant(b.ca)}</td>
                  <td className="px-4 py-3 text-right text-brand font-semibold">{formatMontant(b.benefice)}</td>
                  <td className="px-4 py-3">
                    <div className="w-24">
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand" style={{ width: `${Math.min(100, (b.joursRestants / 30) * 100)}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{b.joursRestants}j restants</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={b.bloquee ? 'danger' : 'success'}>{b.bloquee ? 'Bloquée' : 'Active'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="xs" variant={b.bloquee ? 'primary' : 'danger'} icon={b.bloquee ? Unlock : Lock} onClick={() => handleToggleBlocage(b)}>
                      {b.bloquee ? 'Débloquer' : 'Bloquer'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function BoutiqueCard({ b, revealed, onToggleReveal, onToggleBlocage }) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-2">
        <p className="font-semibold text-slate-950">{b.nom}</p>
        <Badge variant={b.bloquee ? 'danger' : 'success'}>{b.bloquee ? 'Bloquée' : 'Active'}</Badge>
      </div>
      <button onClick={onToggleReveal} className="text-sm text-slate-500 flex items-center gap-1 mb-2">
        {revealed ? <EyeOff size={14} /> : <Eye size={14} />} {revealed ? b.whatsapp : 'Voir infos'}
      </button>
      <div className="grid grid-cols-2 gap-2 text-sm mb-2">
        <div><p className="text-slate-500">CA</p><p className="font-semibold">{formatMontant(b.ca)}</p></div>
        <div><p className="text-slate-500">Bénéfice</p><p className="font-semibold text-brand">{formatMontant(b.benefice)}</p></div>
      </div>
      <div className="mb-3">
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-brand" style={{ width: `${Math.min(100, (b.joursRestants / 30) * 100)}%` }} />
        </div>
        <span className="text-xs text-slate-500">{b.joursRestants} jours restants</span>
      </div>
      <div className="flex gap-2">
        {revealed && (
          <a href={waLink(b.whatsapp)} target="_blank" rel="noreferrer" className="flex-1">
            <Button variant="brand_outline" size="sm" icon={MessageCircle} className="w-full">WhatsApp</Button>
          </a>
        )}
        <Button size="sm" variant={b.bloquee ? 'primary' : 'danger'} icon={b.bloquee ? Unlock : Lock} className="flex-1" onClick={onToggleBlocage}>
          {b.bloquee ? 'Débloquer' : 'Bloquer'}
        </Button>
      </div>
    </Card>
  );
}

function PwaChart({ data }) {
  const max = Math.max(...data.map((d) => Math.max(d.visits, d.installs)), 1);
  const width = 700;
  const height = 160;
  const step = width / data.length;

  const points = (key) => data.map((d, i) => `${i * step + step / 2},${height - (d[key] / max) * height}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height + 24}`} className="w-full h-auto">
      <polyline points={points('visits')} fill="none" stroke="#64748B" strokeWidth="2" />
      <polyline points={points('installs')} fill="none" stroke="#16A34A" strokeWidth="2" />
      {data.map((d, i) => (
        <text key={d.date} x={i * step + step / 2} y={height + 16} textAnchor="middle" fontSize="10" fill="#64748B">
          {new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
        </text>
      ))}
    </svg>
  );
}
