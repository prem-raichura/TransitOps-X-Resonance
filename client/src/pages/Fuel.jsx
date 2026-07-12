import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { TableSkeleton } from '../components/Skeleton'

const LOGGED_BY_STYLE = {
  DRIVER: 'bg-blue-100 text-blue-700',
  ANALYST: 'bg-gray-100 text-gray-700',
  AUTO: 'bg-purple-100 text-purple-700',
}

const mapUrl = (lat, lng) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`

export default function Fuel() {
  const { user } = useAuth()
  const isAnalyst = user?.role === 'FINANCIAL_ANALYST'
  const [fuel, setFuel] = useState([])
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Resilient loads: one failing call must not blank the whole page.
    // The operational-cost summary is Financial-Analyst-only, so Safety Officer skips it.
    const jobs = [
      api.get('/fuel').then((r) => setFuel(r.data)),
      api.get('/expenses').then((r) => setExpenses(r.data)),
    ]
    if (isAnalyst) {
      jobs.push(api.get('/expenses/summary').then((r) => setSummary(r.data)).catch(() => {}))
    }
    Promise.allSettled(jobs)
      .then((results) => {
        // only error if BOTH core tables failed to load
        if (results[0].status === 'rejected' && results[1].status === 'rejected') {
          setError('Could not load fuel & expenses')
        }
      })
      .finally(() => setLoading(false))
  }, [isAnalyst])

  return (
    <div className="space-y-6">
      {error && <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {/* operational cost summary (spec 3.7) */}
      {loading && (
        <section className="rounded bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="skeleton h-4 w-64" />
            <div className="skeleton h-6 w-24" />
          </div>
          <table className="w-full text-sm">
            <tbody>
              <TableSkeleton cols={5} rows={3} cellClass="py-2 pr-4" />
            </tbody>
          </table>
        </section>
      )}
      {summary && (
        <section className="rounded bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase text-gray-500">Operational Cost = Fuel + Maintenance</h2>
            <span className="text-lg font-bold text-brand-dark">
              ₹{summary.totals.total.toLocaleString()}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-400">
                <th className="pb-2">Vehicle</th>
                <th className="pb-2">Fuel (L)</th>
                <th className="pb-2">Fuel Cost</th>
                <th className="pb-2">Maintenance</th>
                <th className="pb-2">Operational Cost</th>
              </tr>
            </thead>
            <tbody>
              {summary.byVehicle
                .filter((v) => v.operationalCost > 0)
                .sort((a, b) => b.operationalCost - a.operationalCost)
                .map((v) => (
                  <tr key={v.slug} className="border-t border-gray-100">
                    <td className="py-2 font-medium text-gray-700">{v.name}</td>
                    <td className="py-2 text-gray-600">{v.fuelLiters.toLocaleString()}</td>
                    <td className="py-2 text-gray-600">₹{v.fuelCost.toLocaleString()}</td>
                    <td className="py-2 text-gray-600">₹{v.maintenanceCost.toLocaleString()}</td>
                    <td className="py-2 font-semibold text-gray-800">₹{v.operationalCost.toLocaleString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      )}

      {/* fuel logs — includes driver-uploaded with proof photo + GPS */}
      <section className="rounded bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold uppercase text-gray-500">Fuel Logs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-400">
                <th className="pb-2">Vehicle</th>
                <th className="pb-2">Trip</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Liters</th>
                <th className="pb-2">Cost</th>
                <th className="pb-2">Source</th>
                <th className="pb-2">Proof</th>
                <th className="pb-2">Location</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeleton cols={8} rows={4} cellClass="py-2 pr-4" />}
              {!loading && fuel.map((f) => (
                <tr key={f.id} className="border-t border-gray-100">
                  <td className="py-2 font-medium text-gray-700">{f.vehicle?.name}</td>
                  <td className="py-2 font-mono text-xs text-gray-500">{f.trip?.slug || '—'}</td>
                  <td className="py-2 text-gray-600">{new Date(f.date).toLocaleDateString()}</td>
                  <td className="py-2 text-gray-600">{f.liters} L</td>
                  <td className="py-2 text-gray-600">₹{f.cost.toLocaleString()}</td>
                  <td className="py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${LOGGED_BY_STYLE[f.loggedBy] || 'bg-gray-100 text-gray-700'}`}>
                      {f.loggedBy}
                    </span>
                  </td>
                  <td className="py-2">
                    {f.proofImageUrl ? (
                      <a href={f.proofImageUrl} target="_blank" rel="noreferrer">
                        <img src={f.proofImageUrl} alt="fuel proof" className="h-10 w-10 rounded border border-gray-200 object-cover" />
                      </a>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-2">
                    {f.lat != null ? (
                      <a href={mapUrl(f.lat, f.lng)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                        📍 map
                      </a>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && fuel.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-gray-400">No fuel logs yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* expenses (toll / misc) */}
      <section className="rounded bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold uppercase text-gray-500">Other Expenses (Toll / Misc)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-400">
                <th className="pb-2">Trip</th>
                <th className="pb-2">Vehicle</th>
                <th className="pb-2">Toll</th>
                <th className="pb-2">Misc</th>
                <th className="pb-2">Maintenance</th>
                <th className="pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeleton cols={6} rows={3} cellClass="py-2 pr-4" />}
              {!loading && expenses.map((e) => (
                <tr key={e.id} className="border-t border-gray-100">
                  <td className="py-2 font-mono text-xs text-gray-500">{e.tripSlug}</td>
                  <td className="py-2 text-gray-700">{e.vehicle?.name || '—'}</td>
                  <td className="py-2 text-gray-600">₹{(e.tollCost || 0).toLocaleString()}</td>
                  <td className="py-2 text-gray-600">₹{(e.miscCost || 0).toLocaleString()}</td>
                  <td className="py-2 text-gray-600">₹{(e.maintenanceCost || 0).toLocaleString()}</td>
                  <td className="py-2 font-semibold text-gray-800">₹{(e.total || 0).toLocaleString()}</td>
                </tr>
              ))}
              {!loading && expenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-400">No expenses yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
