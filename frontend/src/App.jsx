import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext';
import { getToken } from './lib/auth';
import Layout from './components/layout/Layout';
import Spinner from './components/ui/Spinner';
import InstallPrompt from './components/layout/InstallPrompt';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Ventes from './pages/Ventes';
import Stock from './pages/Stock';
import Clients from './pages/Clients';
import Commandes from './pages/Commandes';
import Depenses from './pages/Depenses';
import Dettes from './pages/Dettes';
import Stats from './pages/Stats';
import Parametres from './pages/Parametres';
import BoutiqueBloquee from './pages/BoutiqueBloquee';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

function PrivateArea() {
  const { loading, bloquee } = useApp();

  if (!getToken()) return <Navigate to="/login" replace />;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }
  if (bloquee) return <BoutiqueBloquee />;

  return (
    <Layout>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="ventes" element={<Ventes />} />
        <Route path="stock" element={<Stock />} />
        <Route path="clients" element={<Clients />} />
        <Route path="commandes" element={<Commandes />} />
        <Route path="depenses" element={<Depenses />} />
        <Route path="dettes" element={<Dettes />} />
        <Route path="stats" element={<Stats />} />
        <Route path="parametres" element={<Parametres />} />
      </Routes>
    </Layout>
  );
}

function InstallPromptGate() {
  if (window.location.pathname.startsWith('/admin')) return null;
  return <InstallPrompt />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/*" element={<PrivateArea />} />
        </Routes>
        <InstallPromptGate />
      </AppProvider>
    </BrowserRouter>
  );
}
