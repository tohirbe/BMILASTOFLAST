// Himoyalangan route - token bo'lmasa login sahifasiga yo'naltiradi
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function PrivateRoute({ children, permission }) {
  const { user, loading, hasPermission } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 text-sm">Yuklanmoqda...</span>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (permission && !hasPermission(permission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="card max-w-md text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Ruxsat yo'q</h2>
          <p className="text-slate-500">Bu sahifaga kirishga ruxsatingiz yo'q.</p>
        </div>
      </div>
    )
  }

  return children
}