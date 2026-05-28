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
import { Spinner } from './components/ui'

function ProtectedRoute({ children }) {
  const { session, loading } = useApp()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 bg-ink rounded-2xl flex items-center justify-center">
          <span className="text-white font-bold">B</span>
        </div>
        <Spinner />
      </div>
    </div>
  )
  if (!session) return <Navigate to="/login" replace />
  if (session.role === 'admin') return <Navigate to="/admin" replace />
  return children
}

function AdminRoute({ children }) {
  const { session } = useApp()
  if (!session || session.role !== 'admin') return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Routes admin */}
      <Route path="/admin" element={
        <AdminRoute><AdminDashboard /></AdminRoute>
      } />

      {/* Routes protégées avec layout */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/ventes" element={
        <ProtectedRoute>
          <Layout><Ventes /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/stock" element={
        <ProtectedRoute>
          <Layout><Stock /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/parametres" element={
        <ProtectedRoute>
          <Layout><Parametres /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/boss" element={
        <ProtectedRoute>
          <Layout><BossDashboard /></Layout>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
