import { useEffect, useState } from 'react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import api from '../api/client'
import Skeleton from '../components/Skeleton'

const KPI = [
  { key: 'fuelEfficiency', label: 'Fuel Efficiency', suffix: ' km/l' },
  { key: 'fleetUtilization', label: 'Fleet Utilization', suffix: '%' },
  { key: 'operationalCost', label: 'Operational Cost', prefix: '', fmt: (n) => n.toLocaleString() },
  {
    key: 'avgRoi',
    label: 'Vehicle ROI',
    suffix: '%',
    highlight: true,
    caption: 'ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost',
  },
]

// worst = red, rest orange/blue (mockup screen 7)
const COST_COLORS = ['#dc2626', '#f97316', '#2563eb']

const REPORTS = ['trips', 'fuel', 'expenses', 'vehicles']

export default function Analytics() {
  const [summary, setSummary] = useState(null)
  const [revenue, setRevenue] = useState([])
  const [costliest, setCostliest] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/analytics/summary').then(({ data }) => setSummary(data)),
      api.get('/analytics/monthly-revenue').then(({ data }) => setRevenue(data)),
      api.get('/analytics/costliest-vehicles').then(({ data }) => setCostliest(data)),
    ])
      .catch(() => setError('Could not load analytics'))
      .finally(() => setLoading(false))
  }, [])

  const download = async (report) => {
    setError('')
    try {
      const res = await api.get(`/analytics/export/csv?report=${report}`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${report}-report.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError(`Could not export ${report}`)
    }
  }

  const val = (k) => {
    const conf = KPI.find((c) => c.key === k)
    const n = summary?.[k]
    if (n == null) return '—'
    return `${conf.prefix ?? ''}${conf.fmt ? conf.fmt(n) : n}${conf.suffix ?? ''}`
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">✕ {error}</div>
      )}

      {/* 4 KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading &&
          KPI.map((c) => (
            <div key={c.key} className="rounded bg-white p-5 shadow-sm">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="mt-3 h-8 w-24" />
            </div>
          ))}
        {!loading && KPI.map((c) => (
          <div
            key={c.key}
            className={`rounded p-5 shadow-sm ${c.highlight ? 'bg-brand/20 ring-2 ring-brand' : 'bg-white'}`}
          >
            <p className="text-xs font-medium uppercase text-gray-500">{c.label}</p>
            <p className="mt-2 text-3xl font-bold text-brand-dark">{val(c.key)}</p>
            {c.caption && <p className="mt-2 text-xs text-gray-500">{c.caption}</p>}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Revenue bar chart */}
        <section className="rounded bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase text-gray-500">Monthly Revenue</h2>
          {loading ? (
            <Skeleton className="h-[260px] w-full" />
          ) : revenue.length === 0 ? (
            <p className="py-16 text-center text-gray-400">No revenue yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenue}>
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={70} tickFormatter={(n) => n.toLocaleString()} />
                <Tooltip formatter={(n) => n.toLocaleString()} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* Top Costliest Vehicles — horizontal bars */}
        <section className="rounded bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase text-gray-500">Top Costliest Vehicles</h2>
          {loading ? (
            <Skeleton className="h-[260px] w-full" />
          ) : costliest.length === 0 ? (
            <p className="py-16 text-center text-gray-400">No cost data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={costliest} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(n) => n.toLocaleString()} />
                <YAxis type="category" dataKey="vehicle" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={90} />
                <Tooltip formatter={(n) => n.toLocaleString()} />
                <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                  {costliest.map((_, i) => (
                    <Cell key={i} fill={COST_COLORS[i] || '#2563eb'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>

      {/* CSV export */}
      <section className="rounded bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold uppercase text-gray-500">Export Reports</h2>
        <div className="flex flex-wrap gap-3">
          {REPORTS.map((r) => (
            <button
              key={r}
              onClick={() => download(r)}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium capitalize text-gray-700 hover:bg-gray-50"
            >
              Export {r} CSV
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
