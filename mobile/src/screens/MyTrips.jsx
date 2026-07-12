import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useDriverAuth } from '../context/DriverAuthContext'
import { getPosition } from '../lib/geo'
import LocationToggle from '../components/LocationToggle'
import StatusPill from '../components/StatusPill'

const isActive = (s) => s === 'DISPATCHED' || s === 'PENDING_COMPLETION'

export default function MyTrips() {
  const { driver, logout } = useDriverAuth()
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [error, setError] = useState('')
  const pingRef = useRef(null)

  const load = () => {
    api.get('/driver/trips').then(({ data }) => setTrips(data)).catch(() => setError('Could not load trips'))
    api.get('/driver/me').then(({ data }) => setLocationEnabled(data.locationEnabled)).catch(() => {})
  }

  useEffect(load, [])

  // While sharing ON, ping location every 30s (doc 12). Server ignores pings when off.
  useEffect(() => {
    clearInterval(pingRef.current)
    if (!locationEnabled) return
    const ping = async () => {
      try {
        const { lat, lng } = await getPosition()
        await api.post('/driver/location', { lat, lng })
      } catch {
        // ignore transient GPS failures
      }
    }
    ping()
    pingRef.current = setInterval(ping, 30000)
    return () => clearInterval(pingRef.current)
  }, [locationEnabled])

  const active = trips.filter((t) => isActive(t.status))
  const history = trips.filter((t) => !isActive(t.status))

  return (
    <div className="min-h-screen bg-gray-100 pb-6">
      <header className="flex items-center justify-between bg-brand-dark px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-white">{driver?.name}</p>
          <p className="text-xs text-gray-400">My Trips</p>
        </div>
        <div className="flex items-center gap-2">
          <LocationToggle enabled={locationEnabled} onChange={setLocationEnabled} />
          <button onClick={() => navigate('/profile')} className="text-lg text-white">
            ☰
          </button>
        </div>
      </header>

      <div className="px-4 pt-4">
        {error && <div className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <h2 className="mb-2 text-xs font-bold uppercase text-gray-500">Active</h2>
        {active.length === 0 && <p className="mb-4 text-sm text-gray-400">No active trip assigned.</p>}
        {active.map((t) => (
          <TripCard key={t.slug} trip={t} highlight />
        ))}

        <h2 className="mb-2 mt-6 text-xs font-bold uppercase text-gray-500">History</h2>
        {history.length === 0 && <p className="text-sm text-gray-400">No past trips.</p>}
        {history.map((t) => (
          <TripCard key={t.slug} trip={t} />
        ))}
      </div>
    </div>
  )
}

function TripCard({ trip, highlight }) {
  return (
    <Link
      to={`/trips/${trip.slug}`}
      className={`mb-3 block rounded-lg bg-white p-4 shadow-sm ${highlight ? 'border-l-4 border-brand' : ''}`}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-xs text-gray-400">{trip.slug}</span>
        <StatusPill status={trip.status} />
      </div>
      <p className="text-sm font-medium text-gray-800">
        {trip.source} → {trip.destination}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        {trip.vehicle?.name} · {trip.cargoKg} kg · {trip.plannedKm} km
      </p>
      {trip.status === 'DISPATCHED' && trip.rejectionReason && (
        <p className="mt-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700">Rejected: {trip.rejectionReason}</p>
      )}
    </Link>
  )
}
