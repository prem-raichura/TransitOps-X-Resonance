import { Routes, Route } from 'react-router-dom'

// Pages land here module by module (PLANS/02 onward):
// Login, Dashboard, Vehicles, Drivers, Trips, Maintenance, Fuel, Analytics, Settings

function App() {
  return (
    <Routes>
      <Route
        path="*"
        element={
          <div className="flex min-h-screen items-center justify-center bg-brand-dark">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-brand">TransitOps</h1>
              <p className="mt-2 text-gray-300">Smart Transport Operations Platform</p>
              <p className="mt-4 text-sm text-gray-400">Scaffold ready — build modules per PLANS/</p>
            </div>
          </div>
        }
      />
    </Routes>
  )
}

export default App
