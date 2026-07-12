import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'
import { getPosition } from '../lib/geo'
import StatusPill from '../components/StatusPill'
import CompletionSlider from '../components/CompletionSlider'
import FuelModal from '../components/FuelModal'

export default function TripDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [error, setError] = useState('')
  const [fuelOpen, setFuelOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = () => api.get(`/driver/trips/${slug}`).then(({ data }) => setTrip(data)).catch(() => setError('Trip not found'))
  useEffect(load, [slug])

  const addExpense = async () => {
    const amount = window.prompt('Expense amount (₹) — e.g. oil change')
    if (!amount) return
    try {
      await api.post(`/driver/trips/${slug}/expense`, { miscCost: Number(amount), note: 'Driver expense' })
      window.alert('Expense added')
    } catch (err) {
      window.alert(err.response?.data?.error || 'Failed')
    }
  }

  const submitCompletion = async () => {
    setError('')
    const endOdometer = window.prompt('Enter final odometer reading')
    if (!endOdometer) return
    setBusy(true)
    try {
      const { lat, lng } = await getPosition() // mandatory GPS
      await api.post(`/driver/trips/${slug}/submit-completion`, { endOdometer: Number(endOdometer), lat, lng })
      await load()
    } catch (err) {
      setError(
        err.message?.includes('permission') || err.message?.includes('Location')
          ? 'Location is required to complete a trip. Enable GPS and try again.'
          : err.response?.data?.error || 'Could not submit',
      )
    } finally {
      setBusy(false)
    }
  }

  if (!trip) return <div className="p-6 text-sm text-gray-500">{error || 'Loading…'}</div>

  const active = trip.status === 'DISPATCHED'
  const pending = trip.status === 'PENDING_COMPLETION'

  return (
    <div className="min-h-screen bg-gray-100 pb-28">
      <header className="flex items-center gap-3 bg-brand-dark px-4 py-3">
        <button onClick={() => navigate('/')} className="text-white">
          ←
        </button>
        <span className="font-mono text-sm text-white">{trip.slug}</span>
        <span className="ml-auto">
          <StatusPill status={trip.status} />
        </span>
      </header>

      <div className="space-y-4 p-4">
        {error && <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        {pending && (
          <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            ⏳ Awaiting dispatcher verification
          </div>
        )}
        {active && trip.rejectionReason && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Rejected: {trip.rejectionReason}. Fix and re-submit below.
          </div>
        )}

        <section className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-lg font-semibold text-gray-800">
            {trip.source} → {trip.destination}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <Info label="Vehicle" value={`${trip.vehicle?.name} (${trip.vehicle?.regNo})`} />
            <Info label="Cargo" value={`${trip.cargoKg} kg`} />
            <Info label="Planned" value={`${trip.plannedKm} km`} />
            <Info label="Start odometer" value={trip.startOdometer ?? '—'} />
          </div>
        </section>

        {active && (
          <section className="grid grid-cols-2 gap-3">
            <button onClick={() => setFuelOpen(true)} className="rounded-lg bg-white py-3 text-sm font-medium shadow-sm">
              ⛽ + Fuel
            </button>
            <button onClick={addExpense} className="rounded-lg bg-white py-3 text-sm font-medium shadow-sm">
              🧾 + Expense
            </button>
          </section>
        )}
      </div>

      {/* completion slider pinned to bottom on active trips */}
      {active && (
        <div className="fixed inset-x-0 bottom-0 border-t bg-white p-4">
          <CompletionSlider disabled={busy} onComplete={submitCompletion} />
          <p className="mt-2 text-center text-xs text-gray-400">GPS captured at completion — required</p>
        </div>
      )}

      {fuelOpen && <FuelModal tripSlug={slug} onClose={() => setFuelOpen(false)} onLogged={load} />}
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase text-gray-400">{label}</p>
      <p className="font-medium text-gray-700">{value}</p>
    </div>
  )
}
