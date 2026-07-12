import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { canEdit } from '../lib/rbac'
import { listVehicles } from '../api/vehicles'
import {
  listFuel,
  createFuel,
  listExpenses,
  createExpense,
  expenseSummary,
  tripOptions,
} from '../api/fuel'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'

const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

const LOGGED_BY_STYLE = {
  ANALYST: 'bg-slate-100 text-slate-600',
  DRIVER: 'bg-indigo-100 text-indigo-700',
  AUTO: 'bg-sky-100 text-sky-700',
}

const EMPTY_FUEL = { vehicleSlug: '', tripSlug: '', liters: '', cost: '', date: new Date().toISOString().slice(0, 10) }
const EMPTY_EXPENSE = { tripSlug: '', tollCost: '', miscCost: '' }

const field =
  'mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none'
const label = 'mb-1 block text-xs font-medium uppercase text-gray-500'

export default function Fuel() {
  const { user } = useAuth()
  const editable = canEdit(user.role, 'fuel') // Financial Analyst full; Safety Officer view-only

  const [fuel, setFuel] = useState([])
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [trips, setTrips] = useState([])
  const [error, setError] = useState('')

  const [fuelModal, setFuelModal] = useState(false)
  const [expenseModal, setExpenseModal] = useState(false)
  const [fuelForm, setFuelForm] = useState(EMPTY_FUEL)
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE)
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  const loadTables = () =>
    Promise.all([listFuel(), listExpenses()])
      .then(([f, e]) => {
        setFuel(f)
        setExpenses(e)
      })
      .catch(() => setError('Could not load fuel & expense data'))

  useEffect(() => {
    loadTables()
    if (editable) {
      expenseSummary().then(setSummary).catch(() => {})
      listVehicles().then((v) => setVehicles(v.filter((x) => x.status !== 'RETIRED'))).catch(() => {})
      tripOptions().then(setTrips).catch(() => {})
    }
  }, [editable])

  const refreshSummary = () => editable && expenseSummary().then(setSummary).catch(() => {})

  const submitFuel = async (e) => {
    e.preventDefault()
    setFormError('')
    setBusy(true)
    try {
      await createFuel({
        vehicleSlug: fuelForm.vehicleSlug,
        tripSlug: fuelForm.tripSlug || undefined,
        liters: Number(fuelForm.liters),
        cost: Number(fuelForm.cost),
        date: fuelForm.date,
      })
      setFuelModal(false)
      setFuelForm(EMPTY_FUEL)
      await loadTables()
      refreshSummary()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const submitExpense = async (e) => {
    e.preventDefault()
    setFormError('')
    setBusy(true)
    try {
      await createExpense({
        tripSlug: expenseForm.tripSlug,
        tollCost: Number(expenseForm.tollCost || 0),
        miscCost: Number(expenseForm.miscCost || 0),
      })
      setExpenseModal(false)
      setExpenseForm(EMPTY_EXPENSE)
      await loadTables()
      refreshSummary()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const openFuel = () => {
    setFuelForm(EMPTY_FUEL)
    setFormError('')
    setFuelModal(true)
  }
  const openExpense = () => {
    setExpenseForm(EMPTY_EXPENSE)
    setFormError('')
    setExpenseModal(true)
  }

  const th = 'pb-2 text-left text-xs font-semibold uppercase text-gray-400'
  const td = 'py-2 text-gray-600'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Fuel &amp; Expense Management</h1>
        <p className="text-sm text-gray-500">
          Fuel logs and per-trip expenses · operational cost auto-computed
        </p>
      </div>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">✕ {error}</div>
      )}

      {/* Fuel Logs */}
      <section className="rounded bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase text-gray-500">Fuel Logs</h2>
          {editable && (
            <button
              onClick={openFuel}
              className="rounded bg-brand px-3 py-1.5 text-sm font-semibold text-brand-dark hover:brightness-95"
            >
              + Log Fuel
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={th}>Vehicle</th>
                <th className={th}>Trip</th>
                <th className={th}>Date</th>
                <th className={th}>Liters</th>
                <th className={th}>Fuel Cost</th>
                <th className={th}>Source</th>
              </tr>
            </thead>
            <tbody>
              {fuel.map((f) => (
                <tr key={f.id} className="border-t border-gray-100">
                  <td className="py-2 font-medium text-gray-700">{f.vehicle.name}</td>
                  <td className="py-2 font-mono text-xs text-gray-500">{f.trip?.slug || '—'}</td>
                  <td className={td}>{new Date(f.date).toLocaleDateString()}</td>
                  <td className={td}>{f.liters} L</td>
                  <td className={td}>{inr(f.cost)}</td>
                  <td className="py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        LOGGED_BY_STYLE[f.loggedBy] || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {f.loggedBy}
                    </span>
                  </td>
                </tr>
              ))}
              {fuel.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-400">
                    No fuel logs yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Other Expenses */}
      <section className="rounded bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase text-gray-500">Other Expenses</h2>
          {editable && (
            <button
              onClick={openExpense}
              className="rounded bg-brand px-3 py-1.5 text-sm font-semibold text-brand-dark hover:brightness-95"
            >
              + Add Expense
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={th}>Trip</th>
                <th className={th}>Vehicle</th>
                <th className={th}>Toll</th>
                <th className={th}>Other</th>
                <th className={th}>Maint. (linked)</th>
                <th className={th}>Total</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-t border-gray-100">
                  <td className="py-2 font-mono text-xs text-gray-500">{e.tripSlug}</td>
                  <td className="py-2 font-medium text-gray-700">{e.vehicle.name}</td>
                  <td className={td}>{inr(e.tollCost)}</td>
                  <td className={td}>{inr(e.miscCost)}</td>
                  <td className={td}>{inr(e.maintenanceCost)}</td>
                  <td className="py-2 font-semibold text-gray-800">{inr(e.total)}</td>
                  <td className="py-2">
                    <StatusBadge status={e.tripStatus} />
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-400">
                    No expenses yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Auto operational-cost footer (analyst only — /summary is analyst-scoped) */}
      {editable && summary && (
        <section className="rounded bg-brand-dark p-5 text-white shadow-sm">
          <div className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-300">
            Total Operational Cost (Auto) = Fuel + Maintenance
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-400">
                  <th className="pb-2">Vehicle</th>
                  <th className="pb-2">Fuel</th>
                  <th className="pb-2">Maintenance</th>
                  <th className="pb-2">Operational</th>
                </tr>
              </thead>
              <tbody>
                {summary.vehicles.map((v) => (
                  <tr key={v.slug} className="border-t border-white/10">
                    <td className="py-1.5 font-medium">{v.name}</td>
                    <td className="py-1.5 text-gray-300">{inr(v.fuelCost)}</td>
                    <td className="py-1.5 text-gray-300">{inr(v.maintenanceCost)}</td>
                    <td className="py-1.5">{inr(v.operationalCost)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-brand">
                  <td className="pt-3 font-bold uppercase text-brand">Grand Total</td>
                  <td className="pt-3 text-gray-200">{inr(summary.totals.fuelCost)}</td>
                  <td className="pt-3 text-gray-200">{inr(summary.totals.maintenanceCost)}</td>
                  <td className="pt-3 text-lg font-bold text-brand">{inr(summary.totals.operationalCost)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {/* Log Fuel modal */}
      <Modal open={fuelModal} onClose={() => setFuelModal(false)} title="Log Fuel">
        {formError && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">✕ {formError}</div>
        )}
        <form onSubmit={submitFuel}>
          <label className={label}>Vehicle</label>
          <select
            required
            value={fuelForm.vehicleSlug}
            onChange={(e) => setFuelForm({ ...fuelForm, vehicleSlug: e.target.value })}
            className={`${field} bg-white`}
          >
            <option value="" disabled>
              Select vehicle
            </option>
            {vehicles.map((v) => (
              <option key={v.slug} value={v.slug}>
                {v.name} — {v.regNo}
              </option>
            ))}
          </select>

          <label className={label}>Trip (optional)</label>
          <select
            value={fuelForm.tripSlug}
            onChange={(e) => setFuelForm({ ...fuelForm, tripSlug: e.target.value })}
            className={`${field} bg-white`}
          >
            <option value="">— No trip —</option>
            {trips.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.slug} · {t.vehicle?.name || ''} ({t.status})
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Liters</label>
              <input
                required
                type="number"
                min="0.1"
                step="any"
                value={fuelForm.liters}
                onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })}
                placeholder="42"
                className={field}
              />
            </div>
            <div>
              <label className={label}>Fuel Cost (₹)</label>
              <input
                required
                type="number"
                min="0"
                step="any"
                value={fuelForm.cost}
                onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })}
                placeholder="3150"
                className={field}
              />
            </div>
          </div>

          <label className={label}>Date</label>
          <input
            required
            type="date"
            value={fuelForm.date}
            onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })}
            className={field}
          />

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setFuelModal(false)} className="rounded border px-4 py-2 text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded bg-brand px-4 py-2 text-sm font-semibold text-brand-dark hover:brightness-95 disabled:opacity-60"
            >
              {busy ? 'Saving…' : 'Log Fuel'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Expense modal */}
      <Modal open={expenseModal} onClose={() => setExpenseModal(false)} title="Add Expense">
        {formError && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">✕ {formError}</div>
        )}
        <form onSubmit={submitExpense}>
          <label className={label}>Trip</label>
          <select
            required
            value={expenseForm.tripSlug}
            onChange={(e) => setExpenseForm({ ...expenseForm, tripSlug: e.target.value })}
            className={`${field} bg-white`}
          >
            <option value="" disabled>
              Select trip
            </option>
            {trips.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.slug} · {t.route}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Toll Cost (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={expenseForm.tollCost}
                onChange={(e) => setExpenseForm({ ...expenseForm, tollCost: e.target.value })}
                placeholder="120"
                className={field}
              />
            </div>
            <div>
              <label className={label}>Other Cost (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={expenseForm.miscCost}
                onChange={(e) => setExpenseForm({ ...expenseForm, miscCost: e.target.value })}
                placeholder="0"
                className={field}
              />
            </div>
          </div>
          <p className="mb-4 text-xs text-gray-500">
            Maintenance cost is linked automatically from the vehicle's service log.
          </p>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setExpenseModal(false)} className="rounded border px-4 py-2 text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded bg-brand px-4 py-2 text-sm font-semibold text-brand-dark hover:brightness-95 disabled:opacity-60"
            >
              {busy ? 'Saving…' : 'Add Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
