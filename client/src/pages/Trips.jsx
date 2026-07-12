import { useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { canEdit } from '../lib/rbac'
import Skeleton from '../components/Skeleton'

const STATUS_BADGE = {
  DRAFT: 'bg-gray-100 text-gray-600',
  DISPATCHED: 'bg-blue-100 text-blue-700',
  PENDING_COMPLETION: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

const STEPS = ['DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED']
const STEP_LABEL = { DRAFT: 'Draft', DISPATCHED: 'Dispatched', COMPLETED: 'Completed', CANCELLED: 'Cancelled' }

const EMPTY_FORM = { source: '', destination: '', vehicleSlug: '', driverSlug: '', cargoKg: '', plannedKm: '' }

export default function Trips() {
  const { user } = useAuth()
  const editable = canEdit(user.role, 'trips') // DISPATCHER full, SAFETY_OFFICER view-only

  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [completeFor, setCompleteFor] = useState(null) // trip pending Complete modal
  const [approveFor, setApproveFor] = useState(null) // trip pending Verify & Approve modal

  const loadTrips = () =>
    api
      .get('/trips')
      .then(({ data }) => setTrips(data))
      .catch(() => setError('Could not load trips'))
      .finally(() => setLoading(false))

  useEffect(() => {
    loadTrips()
    if (editable) {
      api.get('/vehicles/available').then(({ data }) => setVehicles(data)).catch(() => setVehicles([]))
      api.get('/drivers/available').then(({ data }) => setDrivers(data)).catch(() => setDrivers([]))
    }
  }, [editable])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const selectedVehicle = useMemo(() => vehicles.find((v) => v.slug === form.vehicleSlug), [vehicles, form.vehicleSlug])
  const cargo = Number(form.cargoKg) || 0
  const capacity = selectedVehicle?.capacityKg
  const overCapacity = capacity != null && cargo > capacity
  const canDispatch =
    editable && form.source && form.destination && form.vehicleSlug && form.driverSlug && form.cargoKg && !overCapacity

  // Dispatch button: create DRAFT then dispatch it
  const dispatch = async () => {
    setError('')
    setBusy(true)
    try {
      const { data: trip } = await api.post('/trips', form)
      await api.post(`/trips/${trip.slug}/dispatch`)
      setForm(EMPTY_FORM)
      await loadTrips()
    } catch (err) {
      setError(err.response?.data?.error || 'Dispatch failed')
    } finally {
      setBusy(false)
    }
  }

  const act = async (fn) => {
    setError('')
    setBusy(true)
    try {
      await fn()
      await loadTrips()
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  const cancelTrip = (slug) => act(() => api.post(`/trips/${slug}/cancel`))
  const reject = (slug) => {
    const reason = window.prompt('Reason for rejecting this completion:')
    if (!reason) return
    act(() => api.post(`/trips/${slug}/reject-completion`, { reason }))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* LEFT — Create Trip */}
      {editable ? (
        <section className="rounded bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase text-gray-500">Create Trip</h2>

          {/* lifecycle stepper */}
          <div className="mb-5 flex items-center gap-2 text-xs text-gray-500">
            {STEPS.map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-brand' : 'bg-gray-300'}`} />
                  {STEP_LABEL[s]}
                </span>
                {i < STEPS.length - 1 && <span className="text-gray-300">›</span>}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Source">
              <input value={form.source} onChange={set('source')} className={inputCls} placeholder="Gandhinagar Depot" />
            </Field>
            <Field label="Destination">
              <input value={form.destination} onChange={set('destination')} className={inputCls} placeholder="Ahmedabad Hub" />
            </Field>

            <Field label="Vehicle">
              <select value={form.vehicleSlug} onChange={set('vehicleSlug')} className={inputCls}>
                <option value="">Select vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.slug} value={v.slug}>
                    {v.name} — {v.capacityKg} kg capacity
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Driver">
              <select value={form.driverSlug} onChange={set('driverSlug')} className={inputCls}>
                <option value="">Select driver</option>
                {drivers.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Cargo Weight (kg)">
              <input type="number" value={form.cargoKg} onChange={set('cargoKg')} className={inputCls} placeholder="450" />
            </Field>
            <Field label="Planned Distance (km)">
              <input type="number" value={form.plannedKm} onChange={set('plannedKm')} className={inputCls} placeholder="38" />
            </Field>
          </div>

          {/* live capacity check (Rule 5) */}
          {overCapacity && (
            <div className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              <div>Vehicle Capacity: {capacity} kg</div>
              <div>Cargo Weight: {cargo} kg</div>
              <div className="font-semibold">✕ Capacity exceeded by {cargo - capacity} kg — dispatch blocked</div>
            </div>
          )}

          {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={dispatch}
              disabled={!canDispatch || busy}
              className="btn btn-primary"
            >
              {busy ? 'Dispatching…' : 'Dispatch'}
            </button>
            <button
              onClick={() => setForm(EMPTY_FORM)}
              className="btn btn-secondary"
            >
              Clear
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded bg-white p-5 text-sm text-gray-500 shadow-sm">
          View-only access — you can monitor the live board but not create or dispatch trips.
        </section>
      )}

      {/* RIGHT — Live Board */}
      <section className="rounded bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold uppercase text-gray-500">Live Board</h2>
        {!editable && error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        <div className="space-y-3">
          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20 rounded-full" />
                </div>
                <Skeleton className="mt-2 h-3.5 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </div>
            ))}
          {!loading && trips.length === 0 && <p className="text-sm text-gray-400">No trips yet.</p>}
          {trips.map((t) => (
            <div
              key={t.slug}
              className={`rounded border p-3 ${t.status === 'PENDING_COMPLETION' ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">{t.slug.toUpperCase()}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[t.status]}`}>
                  {t.status.replace('_', ' ')}
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-600">
                {t.source} → {t.destination}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {t.vehicle?.name} · {t.driver?.name} · {t.cargoKg} kg
              </div>

              {t.status === 'PENDING_COMPLETION' && (
                <div className="mt-2 text-xs text-amber-700">
                  Awaiting verification — driver odometer {t.endOdometer}
                  {t.completionSubmittedAt && ` · submitted ${new Date(t.completionSubmittedAt).toLocaleString()}`}
                </div>
              )}

              {editable && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {t.status === 'DRAFT' && (
                    <>
                      <ActBtn onClick={() => act(() => api.post(`/trips/${t.slug}/dispatch`))} disabled={busy}>Dispatch</ActBtn>
                      <ActBtn variant="ghost" onClick={() => cancelTrip(t.slug)} disabled={busy}>Cancel</ActBtn>
                    </>
                  )}
                  {t.status === 'DISPATCHED' && (
                    <>
                      <ActBtn onClick={() => setCompleteFor(t)} disabled={busy}>Complete</ActBtn>
                      <ActBtn variant="ghost" onClick={() => cancelTrip(t.slug)} disabled={busy}>Cancel</ActBtn>
                    </>
                  )}
                  {t.status === 'PENDING_COMPLETION' && (
                    <>
                      <ActBtn onClick={() => setApproveFor(t)} disabled={busy}>Verify &amp; Approve</ActBtn>
                      <ActBtn variant="danger" onClick={() => reject(t.slug)} disabled={busy}>Reject</ActBtn>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {completeFor && (
        <CompleteModal
          trip={completeFor}
          busy={busy}
          onClose={() => setCompleteFor(null)}
          onSubmit={(body) =>
            act(() => api.post(`/trips/${completeFor.slug}/complete`, body)).then(() => setCompleteFor(null))
          }
        />
      )}

      {approveFor && (
        <ApproveModal
          trip={approveFor}
          busy={busy}
          onClose={() => setApproveFor(null)}
          onApprove={() =>
            act(() => api.post(`/trips/${approveFor.slug}/approve-completion`)).then(() => setApproveFor(null))
          }
        />
      )}
    </div>
  )
}

const inputCls = 'w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase text-gray-500">{label}</span>
      {children}
    </label>
  )
}

function ActBtn({ children, onClick, disabled, variant }) {
  const styles =
    variant === 'ghost'
      ? 'btn btn-secondary btn-sm'
      : variant === 'danger'
        ? 'btn btn-danger btn-sm'
        : 'btn btn-primary btn-sm'
  return (
    <button onClick={onClick} disabled={disabled} className={styles}>
      {children}
    </button>
  )
}

function CompleteModal({ trip, busy, onClose, onSubmit }) {
  const [body, setBody] = useState({ endOdometer: '', fuelLiters: '', fuelCost: '', revenue: '' })
  const set = (key) => (e) => setBody({ ...body, [key]: e.target.value })
  const submit = () => {
    const payload = {}
    for (const k of ['endOdometer', 'fuelLiters', 'fuelCost', 'revenue']) if (body[k] !== '') payload[k] = Number(body[k])
    onSubmit(payload)
  }
  return (
    <Modal title={`Complete ${trip.slug.toUpperCase()}`} onClose={onClose}>
      <div className="space-y-3">
        <Field label="End Odometer (km)">
          <input type="number" value={body.endOdometer} onChange={set('endOdometer')} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fuel Liters">
            <input type="number" value={body.fuelLiters} onChange={set('fuelLiters')} className={inputCls} />
          </Field>
          <Field label="Fuel Cost">
            <input type="number" value={body.fuelCost} onChange={set('fuelCost')} className={inputCls} />
          </Field>
        </div>
        <Field label="Revenue">
          <input type="number" value={body.revenue} onChange={set('revenue')} className={inputCls} />
        </Field>
      </div>
      <ModalActions>
        <ActBtn variant="ghost" onClick={onClose} disabled={busy}>Cancel</ActBtn>
        <ActBtn onClick={submit} disabled={busy || body.endOdometer === ''}>Complete Trip</ActBtn>
      </ModalActions>
    </Modal>
  )
}

function ApproveModal({ trip, busy, onClose, onApprove }) {
  return (
    <Modal title={`Verify ${trip.slug.toUpperCase()}`} onClose={onClose}>
      <div className="space-y-2 text-sm text-gray-700">
        <div>Driver end odometer: <span className="font-semibold">{trip.endOdometer}</span></div>
        <div>Submitted: {trip.completionSubmittedAt ? new Date(trip.completionSubmittedAt).toLocaleString() : '—'}</div>
        <div>
          Completion GPS:{' '}
          {trip.completedLat != null ? `${trip.completedLat.toFixed(5)}, ${trip.completedLng.toFixed(5)}` : '—'}
        </div>
      </div>
      <ModalActions>
        <ActBtn variant="ghost" onClick={onClose} disabled={busy}>Close</ActBtn>
        <ActBtn onClick={onApprove} disabled={busy}>Verify &amp; Approve</ActBtn>
      </ModalActions>
    </Modal>
  )
}

function Modal({ title, children, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded bg-white p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-base font-semibold text-gray-800">{title}</h3>
        {children}
      </div>
    </div>
  )
}

function ModalActions({ children }) {
  return <div className="mt-5 flex justify-end gap-3">{children}</div>
}
