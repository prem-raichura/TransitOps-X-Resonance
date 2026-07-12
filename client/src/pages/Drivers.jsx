import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { canEdit } from '../lib/rbac'

const STATUS_STYLES = {
  AVAILABLE: 'bg-green-600',
  ON_TRIP: 'bg-blue-600',
  OFF_DUTY: 'bg-gray-400',
  SUSPENDED: 'bg-red-600',
}
const STATUS_LABEL = {
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  OFF_DUTY: 'Off Duty',
  SUSPENDED: 'Suspended',
}
const TOGGLE_STATUSES = ['AVAILABLE', 'OFF_DUTY', 'SUSPENDED']

const safetyTier = (score) =>
  score >= 90
    ? { label: 'Good', className: 'bg-green-600' }
    : score >= 70
      ? { label: 'Fair', className: 'bg-yellow-500' }
      : { label: 'Poor', className: 'bg-red-600' }

const fmtExpiry = (iso) => {
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

const emptyForm = { name: '', licenseNo: '', licenseCategory: 'LMV', licenseExpiry: '', contact: '' }

const validateForm = (form) => {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Name is required'
  if (!form.licenseNo.trim()) errors.licenseNo = 'License number is required'
  if (!form.contact.trim()) errors.contact = 'Contact number is required'
  else if (!/^\d{10}$/.test(form.contact.trim())) errors.contact = 'Contact must be a 10-digit number'
  if (!form.licenseExpiry) errors.licenseExpiry = 'License expiry is required'
  return errors
}

export default function Drivers() {
  const { user } = useAuth()
  const editable = canEdit(user.role, 'drivers')
  const isDispatcher = user.role === 'DISPATCHER'

  const [drivers, setDrivers] = useState([])
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [credsFor, setCredsFor] = useState(null)
  const [credsPassword, setCredsPassword] = useState('')
  const [credsError, setCredsError] = useState('')

  const load = () => {
    api
      .get('/drivers')
      .then(({ data }) => setDrivers(data))
      .catch(() => setError('Could not load drivers'))
  }

  useEffect(load, [])

  const setStatus = async (slug, status) => {
    try {
      await api.put(`/drivers/${slug}`, { status })
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Status update failed')
    }
  }

  const addDriver = async () => {
    setFormError('')
    const errors = validateForm(form)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await api.post('/drivers', { ...form, name: form.name.trim(), licenseNo: form.licenseNo.trim(), contact: form.contact.trim() })
      setShowAdd(false)
      setForm(emptyForm)
      setFieldErrors({})
      load()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Could not add driver')
    }
  }

  const saveCredentials = async () => {
    setCredsError('')
    try {
      await api.post(`/drivers/${credsFor.slug}/credentials`, { password: credsPassword })
      setCredsFor(null)
      setCredsPassword('')
      load()
    } catch (err) {
      setCredsError(err.response?.data?.error || 'Could not set credentials')
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Drivers & Safety Profiles</h1>
        {editable && (
          <button
            onClick={() => setShowAdd(true)}
            className="rounded bg-brand px-4 py-2 text-sm font-semibold text-brand-dark hover:brightness-95"
          >
            + Add Driver
          </button>
        )}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3">License No</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Expiry</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Trip Compl.</th>
              <th className="px-4 py-3">Safety</th>
              <th className="px-4 py-3">Status</th>
              {(editable || isDispatcher) && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => {
              const tier = safetyTier(d.safetyScore)
              return (
                <tr key={d.slug} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-800">{d.name}</td>
                  <td className="px-4 py-3 text-gray-600">{d.licenseNo}</td>
                  <td className="px-4 py-3 text-gray-600">{d.licenseCategory}</td>
                  <td className="px-4 py-3">
                    {d.licenseExpired ? (
                      <span className="font-semibold text-red-600">{fmtExpiry(d.licenseExpiry)} EXPIRED</span>
                    ) : (
                      <span className="text-gray-600">{fmtExpiry(d.licenseExpiry)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{d.contact}</td>
                  <td className="px-4 py-3 text-gray-600">{d.safetyScore}%</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${tier.className}`}>
                      {tier.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {editable ? (
                      <div className="flex flex-wrap gap-1">
                        {TOGGLE_STATUSES.map((s) => (
                          <button
                            key={s}
                            onClick={() => setStatus(d.slug, s)}
                            disabled={d.status === s}
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white disabled:cursor-default ${STATUS_STYLES[s]} ${
                              d.status === s ? '' : 'opacity-40 hover:opacity-70'
                            }`}
                          >
                            {STATUS_LABEL[s]}
                          </button>
                        ))}
                        {d.status === 'ON_TRIP' && (
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white ${STATUS_STYLES.ON_TRIP}`}>
                            On Trip
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${STATUS_STYLES[d.status]}`}>
                        {STATUS_LABEL[d.status]}
                      </span>
                    )}
                  </td>
                  {(editable || isDispatcher) && (
                    <td className="px-4 py-3">
                      {isDispatcher && (
                        <button
                          onClick={() => setCredsFor(d)}
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Set app password
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-red-600">
        Rule: Expired license or Suspended status → blocked from trip assignment
      </p>

      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-sm font-bold uppercase text-gray-500">Add Driver</h2>
            {[
              { key: 'name', label: 'Name', type: 'text' },
              { key: 'licenseNo', label: 'License No', type: 'text' },
              { key: 'contact', label: 'Contact', type: 'text', placeholder: '10-digit number' },
              { key: 'licenseExpiry', label: 'License Expiry', type: 'date' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} className="mb-3">
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500">{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className={`w-full rounded border px-3 py-2 text-sm focus:outline-none ${
                    fieldErrors[key] ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-brand'
                  }`}
                />
                {fieldErrors[key] && <p className="mt-1 text-xs text-red-600">{fieldErrors[key]}</p>}
              </div>
            ))}
            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Category</label>
              <select
                value={form.licenseCategory}
                onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                <option value="LMV">LMV</option>
                <option value="HMV">HMV</option>
              </select>
            </div>
            {formError && <p className="mb-3 text-sm text-red-600">{formError}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAdd(false)
                  setFormError('')
                  setFieldErrors({})
                  setForm(emptyForm)
                }}
                className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button onClick={addDriver} className="rounded bg-brand px-4 py-2 text-sm font-semibold text-brand-dark hover:brightness-95">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {credsFor && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-sm font-bold uppercase text-gray-500">Set App Password — {credsFor.name}</h2>
            <p className="mb-3 text-sm text-gray-600">
              App login uses this driver's contact number: <span className="font-semibold text-gray-800">{credsFor.contact}</span>
            </p>
            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Password</label>
              <input
                type="password"
                value={credsPassword}
                onChange={(e) => setCredsPassword(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            {credsError && <p className="mb-3 text-sm text-red-600">{credsError}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setCredsFor(null)
                  setCredsError('')
                  setCredsPassword('')
                }}
                className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={saveCredentials}
                className="rounded bg-brand px-4 py-2 text-sm font-semibold text-brand-dark hover:brightness-95"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
