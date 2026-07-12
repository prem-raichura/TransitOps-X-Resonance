import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { MATRIX, NAV_ITEMS, ROLES, canEdit } from '../lib/rbac'

const LEVEL_LABEL = { full: '✓', view: 'view' }

export default function Settings() {
  const { user } = useAuth()
  const editable = canEdit(user.role, 'settings')
  const [form, setForm] = useState({ depotName: '', currency: '', distanceUnit: '' })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/settings')
      .then(({ data }) => setForm({ depotName: data.depotName, currency: data.currency, distanceUnit: data.distanceUnit }))
      .catch(() => setError('Could not load settings'))
  }, [])

  const save = async () => {
    setError('')
    setSaved(false)
    try {
      await api.put('/settings', form)
      setSaved(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed')
    }
  }

  const modules = NAV_ITEMS.filter((i) => !['dashboard', 'settings'].includes(i.module))

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* general (mockup screen 8) */}
      <section className="rounded bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold uppercase text-gray-500">General</h2>
        {['depotName', 'currency', 'distanceUnit'].map((key) => (
          <div key={key} className="mb-4">
            <label className="mb-1 block text-xs font-medium uppercase text-gray-500">
              {key === 'depotName' ? 'Depot Name' : key === 'currency' ? 'Currency' : 'Distance Unit'}
            </label>
            <input
              value={form[key]}
              disabled={!editable}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none disabled:bg-gray-50"
            />
          </div>
        ))}
        {editable && (
          <button onClick={save} className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Save changes
          </button>
        )}
        {saved && <span className="ml-3 text-sm text-green-600">Saved ✓</span>}
        {error && <span className="ml-3 text-sm text-red-600">{error}</span>}
      </section>

      {/* rbac matrix — read-only */}
      <section className="rounded bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold uppercase text-gray-500">Role-Based Access (RBAC)</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-400">
              <th className="pb-2">Role</th>
              {modules.map((m) => (
                <th key={m.module} className="pb-2">
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(ROLES).map(([roleKey, roleLabel]) => (
              <tr key={roleKey} className="border-t border-gray-100">
                <td className="py-2 font-medium text-gray-700">{roleLabel}</td>
                {modules.map((m) => (
                  <td key={m.module} className="py-2 text-gray-600">
                    {LEVEL_LABEL[MATRIX[m.module][roleKey]] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
