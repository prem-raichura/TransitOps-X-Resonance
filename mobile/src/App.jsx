import { Navigate, Route, Routes } from 'react-router-dom'
import { DriverAuthProvider, useDriverAuth } from './context/DriverAuthContext'
import Login from './screens/Login'
import MyTrips from './screens/MyTrips'
import TripDetail from './screens/TripDetail'
import Profile from './screens/Profile'

function Protected({ children }) {
  const { token } = useDriverAuth()
  return token ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <DriverAuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <Protected>
              <MyTrips />
            </Protected>
          }
        />
        <Route
          path="/trips/:slug"
          element={
            <Protected>
              <TripDetail />
            </Protected>
          }
        />
        <Route
          path="/profile"
          element={
            <Protected>
              <Profile />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DriverAuthProvider>
  )
}

export default App
