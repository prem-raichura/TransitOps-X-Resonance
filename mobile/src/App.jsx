import { Routes, Route } from 'react-router-dom'

// Screens land here per PLANS/11: Login, MyTrips, TripDetail, Profile

function App() {
  return (
    <Routes>
      <Route
        path="*"
        element={
          <div className="flex min-h-screen items-center justify-center bg-brand-dark px-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-brand">TransitOps Driver</h1>
              <p className="mt-2 text-gray-300">Trips · GPS · Fuel proof</p>
              <p className="mt-4 text-sm text-gray-400">Scaffold ready — build screens per PLANS/11</p>
            </div>
          </div>
        }
      />
    </Routes>
  )
}

export default App
