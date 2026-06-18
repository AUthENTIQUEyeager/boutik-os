/**
 * BoutiK - Routeur principal
 */
import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './store/AppContext'
import Layout from './components/layout/Layout'
import LoginPage from './pages/Login'
import Dashboard from './pages/Dashboard'
import Ventes from './pages/Ventes'
import Stock from './pages/Stock'
import Parametres from './pages/Parametres'
import BossDashboard from './pages/BossDashboard'
import AdminDashboard, { AdminLogin } from './pages/Admin'
import BoutiqueBloquee from './components/BoutiqueBloquee'
import { Spinner } from './components/ui'

function ProtectedRoute({ children }) {
  const { session, boutique, loading } = useApp()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 bg-brand rounded-2xl flex items-center justify-center">
          <span className="text-white font-bold">B</span>
        </div>
        <Spinner />
      </div>
    </div>
  )

  if (!session) return <Navigate to="/login" replace />

  // Boutique bloquée → écran de blocage
  if (boutique?.bloquee) return <BoutiqueBloquee />

  return children
}

function AdminRoute({ children }) {
  const token = localStorage.getItem('boutik_admin_token')
  if (!token) return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route path="/admin" element={
        <AdminRoute><AdminDashboard /></AdminRoute>
      } />

      <Route path="/" element={
        <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
      } />
      <Route path="/ventes" element={
        <ProtectedRoute><Layout><Ventes /></Layout></ProtectedRoute>
      } />
      <Route path="/stock" element={
        <ProtectedRoute><Layout><Stock /></Layout></ProtectedRoute>
      } />
      <Route path="/parametres" element={
        <ProtectedRoute><Layout><Parametres /></Layout></ProtectedRoute>
      } />
      <Route path="/boss" element={
        <ProtectedRoute><Layout><BossDashboard /></Layout></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
