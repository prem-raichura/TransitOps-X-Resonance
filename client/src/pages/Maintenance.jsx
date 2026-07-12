import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { canEdit } from '../lib/rbac'
import { TableSkeleton } from '../components/Skeleton'

const STATUS_STYLE = {
  IN_SHOP: 'bg-orange-500 text-white',
  COMPLETED: 'bg-green-600 text-white',
}
const STATUS_LABEL = { IN_SHOP: 'In Shop', COMPLETED: 'Completed' }

const EMPTY_FORM = { vehicleSlug: '', serviceType: '', cost: '', date: new Date().toISOString().slice(0, 10) }

export default function Maintenance() {
  const { user } = useAuth()
  const editable = canEdit(user.role, 'maintenance') // Fleet Manager only; Financial Analyst views
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [vehicles, setVehicles] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const loadLogs = () =>
    api
      .get('/maintenance')
      .then(({ data }) => setLogs(data))
      .catch(() => setError('Could not load maintenance log'))
      .finally(() => setLoading(false))

  useEffect(() => {
    loadLogs()
    if (editable) {
      api.get('/vehicles').then(({ data }) => setVehicles(data.filter((v) => v.status !== 'RETIRED'))).catch(() => setVehicles([]))
    }
  }, [editable])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const save = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.post('/maintenance', { ...form, cost: Number(form.cost) })
      setForm(EMPTY_FORM)
      await loadLogs()
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const close = async (slug) => {
    setError('')
    setBusy(true)
    try {
      await api.post(`/maintenance/${slug}/close`)
      await loadLogs()
    } catch (err) {
      setError(err.response?.data?.error || 'Close failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,1fr)_2fr]">
      {/* log service record (mockup screen 5, left pane) */}
      {editable && (
        <section className="self-start rounded bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase text-gray-500">Log Service Record</h2>
          <form onSubmit={save}>
            <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Vehicle</label>
            <select
              required
              value={form.vehicleSlug}
              onChange={set('vehicleSlug')}
              className="mb-4 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              <option value="" disabled>
                Select vehicle
              </option>
              {vehicles.map((v) => (
                <option key={v.slug} value={v.slug}>
                  {v.name} — {v.regNo} ({v.status === 'IN_SHOP' ? 'In Shop' : v.status === 'ON_TRIP' ? 'On Trip' : 'Available'})
                </option>
              ))}
            </select>

            <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Service Type</label>
            <input
              required
              value={form.serviceType}
              onChange={set('serviceType')}
              placeholder="Oil Change"
              className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />

            <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Cost</label>
            <input
              required
              type="number"
              min="0"
              value={form.cost}
              onChange={set('cost')}
              placeholder="2500"
              className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />

            <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Date</label>
            <input
              required
              type="date"
              value={form.date}
              onChange={set('date')}
              className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />

            <button
              type="submit"
              disabled={busy}
              className="btn btn-primary btn-full"
            >
              Save
            </button>
          </form>
          <p className="mt-4 text-xs text-gray-500">
            Note: In Shop vehicles are removed from the dispatch pool. Closing a record restores the vehicle to Available
            (unless retired).
          </p>
        </section>
      )}

      {/* service log (right pane) */}
      <section className={`rounded bg-white p-5 shadow-sm ${!editable ? 'lg:col-span-2' : ''}`}>
        <h2 className="mb-4 text-sm font-bold uppercase text-gray-500">Service Log</h2>
        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">✕ {error}</div>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-400">
              <th className="pb-2">Record</th>
              <th className="pb-2">Vehicle</th>
              <th className="pb-2">Service</th>
              <th className="pb-2">Cost</th>
              <th className="pb-2">Date</th>
              <th className="pb-2">Status</th>
              {editable && <th className="pb-2" />}
            </tr>
          </thead>
          <tbody>
            {loading && <TableSkeleton cols={editable ? 7 : 6} rows={5} cellClass="py-2 pr-4" />}
            {!loading && logs.map((log) => (
              <tr key={log.slug} className="border-t border-gray-100">
                <td className="py-2 font-mono text-xs text-gray-500">{log.slug}</td>
                <td className="py-2 font-medium text-gray-700">{log.vehicle.name}</td>
                <td className="py-2 text-gray-600">{log.serviceType}</td>
                <td className="py-2 text-gray-600">{log.cost.toLocaleString()}</td>
                <td className="py-2 text-gray-600">{new Date(log.date).toLocaleDateString()}</td>
                <td className="py-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[log.status]}`}>
                    {STATUS_LABEL[log.status]}
                  </span>
                </td>
                {editable && (
                  <td className="py-2 text-right">
                    {log.status === 'IN_SHOP' && (
                      <button
                        onClick={() => close(log.slug)}
                        disabled={busy}
                        className="btn btn-secondary btn-sm"
                      >
                        Close
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={editable ? 7 : 6} className="py-6 text-center text-gray-400">
                  No maintenance records yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}
