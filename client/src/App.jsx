import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { HOME_ROUTE, MATRIX } from './lib/rbac'
import ProtectedRoute from './routes/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Settings from './pages/Settings'
import Drivers from './pages/Drivers'
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
          <Route path="/dashboard" element={<Placeholder title="Dashboard" plan="PLANS/08" />} />
          <Route
            path="/fleet"
            element={
              <ProtectedRoute allowedRoles={rolesFor('fleet')}>
                <Placeholder title="Vehicle Registry" plan="PLANS/03" />
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
                <Placeholder title="Trip Dispatcher" plan="PLANS/05" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/maintenance"
            element={
              <ProtectedRoute allowedRoles={rolesFor('maintenance')}>
                <Placeholder title="Maintenance" plan="PLANS/06" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fuel"
            element={
              <ProtectedRoute allowedRoles={rolesFor('fuel')}>
                <Placeholder title="Fuel & Expense Management" plan="PLANS/07" />
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
        </Route>
        <Route path="*" element={<Home />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
