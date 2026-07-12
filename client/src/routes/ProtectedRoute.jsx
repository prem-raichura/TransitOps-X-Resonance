import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { HOME_ROUTE } from '../lib/rbac'

// Wrap a route element; optionally restrict to roles that can see the module at all
export default function ProtectedRoute({ children, allowedRoles }) {
  const { token, user } = useAuth()

  if (!token || !user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={HOME_ROUTE[user.role] || '/dashboard'} replace />
  }

  return children
}
