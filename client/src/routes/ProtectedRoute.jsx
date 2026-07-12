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
}
