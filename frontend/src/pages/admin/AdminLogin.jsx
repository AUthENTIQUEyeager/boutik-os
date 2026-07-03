import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { adminLogin } from '../../lib/auth';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminLogin(password);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-3 border border-slate-700">
            <ShieldCheck size={26} />
          </div>
          <h1 className="text-2xl font-bold text-white">Administration</h1>
          <p className="text-sm text-slate-500 mt-1">Accès réservé</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-card shadow-soft p-5 space-y-3">
          <Input label="Mot de passe admin" icon={Lock} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
          {error && <p className="text-sm text-danger bg-red-50 rounded-btn px-3 py-2">{error}</p>}
          <Button type="submit" className="w-full" size="lg" loading={loading} icon={ArrowRight}>
            Se connecter
          </Button>
        </form>
      </div>
    </div>
  );
}
