<<<<<<< HEAD
// No token -> /login. Optional allowedRoles -> 403 for wrong role.
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <div className="p-8 text-red-600">403 — You don't have access to this page.</div>;
  }
  return children;
=======
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
>>>>>>> 6db0e718af9c7de375e68fbaa07109db74c7cb65
}
