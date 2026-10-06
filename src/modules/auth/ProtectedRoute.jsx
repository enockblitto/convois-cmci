import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { FullPageLoader } from '../../shared/ui/Spinner'

export default function ProtectedRoute({ roles, children }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/connexion" replace state={{ from: location.pathname }} />
  if (roles && !roles.includes(profile?.role)) return <Navigate to="/mon-espace" replace />
  return children
}
