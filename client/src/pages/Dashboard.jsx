import { useEffect, useState } from 'react'
import api from '../api/client'
import Skeleton, { TableSkeleton } from '../components/Skeleton'

const TYPE_OPTIONS = [
  ['', 'Vehicle Type: All'],
  ['VAN', 'Van'],
  ['TRUCK', 'Truck'],
  ['MINI', 'Mini'],
]
const STATUS_OPTIONS = [
  ['', 'Status: All'],
  ['AVAILABLE', 'Available'],
  ['ON_TRIP', 'On Trip'],
  ['IN_SHOP', 'In Shop'],
  ['RETIRED', 'Retired'],
]

const TRIP_STATUS_STYLE = {
  DRAFT: 'bg-gray-100 text-gray-600',
  DISPATCHED: 'bg-blue-100 text-blue-700',
  PENDING_COMPLETION: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}
const TRIP_STATUS_LABEL = {
  DRAFT: 'Draft',
  DISPATCHED: 'On Trip',
  PENDING_COMPLETION: 'Pending Completion',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const VEHICLE_BAR_STYLE = {
  AVAILABLE: 'bg-green-500',
  ON_TRIP: 'bg-blue-500',
  IN_SHOP: 'bg-orange-500',
  RETIRED: 'bg-red-500',
}
const VEHICLE_BAR_LABEL = { AVAILABLE: 'Available', ON_TRIP: 'On Trip', IN_SHOP: 'In Shop', RETIRED: 'Retired' }
const VEHICLE_STATUSES = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']

const POLL_MS = 15000

const selCls = 'rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none'

export default function Dashboard() {
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [region, setRegion] = useState('')
  const [regions, setRegions] = useState([])
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const load = () => {
    const params = {}
    if (type) params.type = type
    if (status) params.status = status
    if (region) params.region = region
    api
      .get('/dashboard', { params })
      .then(({ data }) => setData(data))
      .catch(() => setError('Could not load dashboard'))
  }

  useEffect(load, [type, status, region])

  // region options come from vehicle records — no fixed enum in the schema
  useEffect(() => {
    api
      .get('/vehicles')
      .then(({ data }) => setRegions([...new Set(data.map((v) => v.region).filter(Boolean))].sort()))
      .catch(() => setRegions([]))
  }, [])

  // poll + refetch on window focus so status flips (dispatch/complete) show up live
  useEffect(() => {
    const interval = setInterval(load, POLL_MS)
    window.addEventListener('focus', load)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', load)
    }
  }, [type, status, region])

  const loading = !data && !error
  const kpis = data?.kpis
  const breakdown = data?.vehicleStatusBreakdown
  const breakdownTotal = breakdown ? VEHICLE_STATUSES.reduce((sum, s) => sum + breakdown[s], 0) : 0

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-gray-800">Dashboard</h1>

      {/* filter row */}
      <div className="mb-4 flex flex-wrap gap-3">
        <select value={type} onChange={(e) => setType(e.target.value)} className={selCls}>
          {TYPE_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selCls}>
          {STATUS_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select value={region} onChange={(e) => setRegion(e.target.value)} className={selCls}>
          <option value="">Region: All</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {loading && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="rounded bg-white p-4 shadow-sm">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="mt-2 h-7 w-12" />
            </div>
          ))}
        </div>
      )}

      {kpis && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <KpiCard title="Active Vehicles" value={kpis.activeVehicles} />
          <KpiCard title="Available Vehicles" value={kpis.availableVehicles} />
          <KpiCard title="Vehicles In Maintenance" value={kpis.inMaintenance} />
          <KpiCard title="Active Trips" value={kpis.activeTrips} />
          <KpiCard title="Pending Trips" value={kpis.pendingTrips} />
          <KpiCard title="Drivers On Duty" value={kpis.driversOnDuty} />
          <KpiCard title="Fleet Utilization" value={`${kpis.fleetUtilization}%`} highlight />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* recent trips */}
        <section className="rounded bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase text-gray-500">Recent Trips</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-400">
                <th className="pb-2">Trip</th>
                <th className="pb-2">Vehicle</th>
                <th className="pb-2">Driver</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">ETA</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeleton cols={5} rows={4} cellClass="py-2 pr-4" />}
              {data?.recentTrips.map((t) => (
                <tr key={t.id} className="border-t border-gray-100">
                  <td className="py-2 font-medium text-gray-700">{t.id.toUpperCase()}</td>
                  <td className="py-2 text-gray-600">{t.vehicle}</td>
                  <td className="py-2 text-gray-600">{t.driver}</td>
                  <td className="py-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TRIP_STATUS_STYLE[t.status]}`}>
                      {TRIP_STATUS_LABEL[t.status]}
                    </span>
                  </td>
                  <td className="py-2 text-gray-600">{t.eta != null ? (t.eta === 0 ? 'Arriving' : `${t.eta} min`) : '—'}</td>
                </tr>
              ))}
              {data && data.recentTrips.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400">
                    No trips yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* vehicle status breakdown */}
        <section className="rounded bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase text-gray-500">Vehicle Status</h2>
          <div className="space-y-3">
            {loading &&
              VEHICLE_STATUSES.map((s) => (
                <div key={s} className="flex items-center gap-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-2.5 flex-1 rounded-full" />
                  <Skeleton className="h-3 w-6" />
                </div>
              ))}
            {breakdown &&
              VEHICLE_STATUSES.map((s) => {
                const count = breakdown[s]
                const pct = breakdownTotal > 0 ? (count / breakdownTotal) * 100 : 0
                return (
                  <div key={s} className="flex items-center gap-3">
                    <span className="w-20 text-xs text-gray-500">{VEHICLE_BAR_LABEL[s]}</span>
                    <div className="h-2.5 flex-1 rounded-full bg-gray-100">
                      <div className={`h-2.5 rounded-full ${VEHICLE_BAR_STYLE[s]}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right text-xs font-semibold text-gray-700">{count}</span>
                  </div>
                )
              })}
          </div>
        </section>
      </div>
    </div>
  )
}

function KpiCard({ title, value, highlight }) {
  return (
    <div className={`rounded p-4 shadow-sm ${highlight ? 'bg-brand text-brand-dark' : 'bg-white text-gray-800'}`}>
      <div className={`text-xs font-medium uppercase ${highlight ? 'text-brand-dark/70' : 'text-gray-500'}`}>{title}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  )
}
