import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { HOME_ROUTE, MATRIX } from './lib/rbac'
import ProtectedRoute from './routes/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Settings from './pages/Settings'
import Dashboard from './pages/Dashboard'
import Vehicles from './pages/Vehicles'
import Drivers from './pages/Drivers'
import Trips from './pages/Trips'
import Maintenance from './pages/Maintenance'
import Fuel from './pages/Fuel'
import Placeholder from './pages/Placeholder'

const rolesFor = (module_) => Object.keys(MATRIX[module_]).filter((role) => MATRIX[module_][role])

function Home() {
  const { user } = useAuth()
  return <Navigate to={user ? HOME_ROUTE[user.role] : '/login'} replace />
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/fleet"
            element={
              <ProtectedRoute allowedRoles={rolesFor('fleet')}>
                <Vehicles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drivers"
            element={
              <ProtectedRoute allowedRoles={rolesFor('drivers')}>
                <Drivers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips"
            element={
              <ProtectedRoute allowedRoles={rolesFor('trips')}>
                <Trips />
              </ProtectedRoute>
            }
          />
          <Route
            path="/maintenance"
            element={
              <ProtectedRoute allowedRoles={rolesFor('maintenance')}>
                <Maintenance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fuel"
            element={
              <ProtectedRoute allowedRoles={rolesFor('fuel')}>
                <Fuel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={rolesFor('analytics')}>
                <Placeholder title="Reports & Analytics" plan="PLANS/09" />
              </ProtectedRoute>
            }
          />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Home />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
