import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export function ProtectedRoute() {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="page-center">
        <img src="/logo.svg" alt="" width={32} height={32} className="spin-pulse" />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}
