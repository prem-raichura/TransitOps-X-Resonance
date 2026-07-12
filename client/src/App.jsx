import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Vehicles from './pages/Vehicles';

// Placeholder for modules not yet built (docs 04–09). Keeps sidebar links from 404-ing.
function Placeholder({ title }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400">
      {title} — coming soon
    </div>
  );
}

// Any authenticated role.
const ANY = ['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/fleet"
        element={
          <ProtectedRoute allowedRoles={['FLEET_MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST']}>
            <Layout>
              <Vehicles />
            </Layout>
          </ProtectedRoute>
        }
      />

      {[
        ['/dashboard', 'Dashboard'],
        ['/drivers', 'Drivers'],
        ['/trips', 'Trips'],
        ['/maintenance', 'Maintenance'],
        ['/fuel', 'Fuel & Expenses'],
        ['/analytics', 'Analytics'],
      ].map(([path, title]) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute allowedRoles={ANY}>
              <Layout>
                <Placeholder title={title} />
              </Layout>
            </ProtectedRoute>
          }
        />
      ))}

      <Route path="/" element={<Navigate to="/fleet" replace />} />
      <Route path="*" element={<Navigate to="/fleet" replace />} />
    </Routes>
  );
}
