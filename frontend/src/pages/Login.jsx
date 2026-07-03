import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Phone, Lock, MapPin, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { login, register } from '../lib/auth';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ nom: '', whatsapp: '', password: '', adresse: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.whatsapp, form.password);
      } else {
        await register(form.nom, form.whatsapp, form.password, form.adresse);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand text-white flex items-center justify-center font-bold text-2xl mb-3">
            B
          </div>
          <h1 className="text-2xl font-bold text-slate-950">BoutiK</h1>
          <p className="text-sm text-slate-500 mt-1">Gestion commerciale simplifiée</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-card shadow-soft p-5">
          <div className="flex bg-slate-50 rounded-btn p-1 mb-5">
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-btn text-sm font-semibold transition-colors ${
                mode === 'register' ? 'bg-white shadow-soft text-brand' : 'text-slate-500'
              }`}
            >
              Créer ma boutique
            </button>
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-btn text-sm font-semibold transition-colors ${
                mode === 'login' ? 'bg-white shadow-soft text-brand' : 'text-slate-500'
              }`}
            >
              J'ai déjà une boutique
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <>
                <Input label="Nom de la boutique" icon={Store} value={form.nom} onChange={set('nom')} required placeholder="Ex: Boutique Aïcha" />
                <Input label="Adresse (optionnel)" icon={MapPin} value={form.adresse} onChange={set('adresse')} placeholder="Ex: Bobo-Dioulasso, Secteur 5" />
              </>
            )}
            <Input label="Numéro WhatsApp" icon={Phone} value={form.whatsapp} onChange={set('whatsapp')} required placeholder="Ex: 70123456" />
            <Input label="Mot de passe" icon={Lock} type="password" value={form.password} onChange={set('password')} required placeholder="••••••••" />

            {error && <p className="text-sm text-danger bg-red-50 rounded-btn px-3 py-2">{error}</p>}

            <Button type="submit" className="w-full mt-2" size="lg" loading={loading} icon={ArrowRight}>
              {mode === 'login' ? 'Se connecter' : 'Créer ma boutique'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
