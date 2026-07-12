import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { canEdit } from '../lib/rbac'
import { TableSkeleton } from '../components/Skeleton'

/* Generate a random secure password — letters + digits + symbols */
const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

/* ─── Driver status helpers ─────────────────────────────────────── */
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

/* ─── Driver add form ───────────────────────────────────────────── */
const emptyDriverForm = { name: '', licenseNo: '', licenseCategory: 'LMV', licenseExpiry: '', contact: '' }

const validateDriverForm = (form) => {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Name is required'
  if (!form.licenseNo.trim()) errors.licenseNo = 'License number is required'
  if (!form.contact.trim()) errors.contact = 'Contact number is required'
  else if (!/^\d{10}$/.test(form.contact.trim())) errors.contact = 'Contact must be a 10-digit number'
  if (!form.licenseExpiry) errors.licenseExpiry = 'License expiry is required'
  return errors
}

/* ─── Staff (dispatcher) add form ───────────────────────────────── */
const STAFF_ROLES = [
  { value: 'DISPATCHER', label: 'Dispatcher' },
  { value: 'SAFETY_OFFICER', label: 'Safety Officer' },
  { value: 'FINANCIAL_ANALYST', label: 'Financial Analyst' },
]
const STAFF_ROLE_LABEL = { DISPATCHER: 'Dispatcher', SAFETY_OFFICER: 'Safety Officer', FINANCIAL_ANALYST: 'Financial Analyst' }
const STAFF_ROLE_BADGE = {
  DISPATCHER: 'bg-blue-100 text-blue-700',
  SAFETY_OFFICER: 'bg-purple-100 text-purple-700',
  FINANCIAL_ANALYST: 'bg-green-100 text-green-700',
}
const emptyStaffForm = { name: '', email: '', role: 'DISPATCHER' }

const validateStaffForm = (form, existingStaff = []) => {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Name is required'
  if (!form.email.trim()) errors.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email'
  else if (existingStaff.some(s => s.email.toLowerCase() === form.email.trim().toLowerCase())) {
    errors.email = 'Email is already registered'
  }
  return errors
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function Drivers() {
  const { user } = useAuth()
  const isManager = user.role === 'FLEET_MANAGER'
  const isSafetyOfficer = user.role === 'SAFETY_OFFICER'
  const isDispatcher = user.role === 'DISPATCHER'
  const canEditDrivers = canEdit(user.role, 'drivers') // FLEET_MANAGER + SAFETY_OFFICER

  /* drivers state */
  const [drivers, setDrivers] = useState([])
  const [driversLoading, setDriversLoading] = useState(true)
  const [driversError, setDriversError] = useState('')

  /* driver status toggle (Safety Officer) */
  const [statusError, setStatusError] = useState('')

  /* add-driver modal (Safety Officer) */
  const [showAddDriver, setShowAddDriver] = useState(false)
  const [driverForm, setDriverForm] = useState(emptyDriverForm)
  const [driverFormError, setDriverFormError] = useState('')
  const [driverFieldErrors, setDriverFieldErrors] = useState({})

  /* set app-password modal (Dispatcher) */
  const [credsFor, setCredsFor] = useState(null)
  const [credsPassword, setCredsPassword] = useState('')
  const [credsError, setCredsError] = useState('')

  /* staff (dispatchers) state — Fleet Manager only */
  const [staff, setStaff] = useState([])
  const [staffLoading, setStaffLoading] = useState(isManager)
  const [staffError, setStaffError] = useState('')
  const [showAddStaff, setShowAddStaff] = useState(false)
  const [staffForm, setStaffForm] = useState(emptyStaffForm)
  const [staffFormError, setStaffFormError] = useState('')
  const [staffFieldErrors, setStaffFieldErrors] = useState({})
  const [createdStaff, setCreatedStaff] = useState(null)
  const [passwordCopied, setPasswordCopied] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(null) // staff member pending removal confirm

  /* ── Load drivers ─────────────────────────────────────────────── */
  const loadDrivers = () => {
    api
      .get('/drivers')
      .then(({ data }) => setDrivers(data))
      .catch(() => setDriversError('Could not load drivers'))
      .finally(() => setDriversLoading(false))
  }

  /* ── Load staff (Fleet Manager only) ─────────────────────────── */
  const loadStaff = () => {
    if (!isManager) return
    api
      .get('/staff')
      .then(({ data }) => setStaff(data))
      .catch(() => setStaffError('Could not load staff'))
      .finally(() => setStaffLoading(false))
  }

  useEffect(() => {
    loadDrivers()
    loadStaff()
  }, [])

  /* ── Driver status toggle (Safety Officer / Fleet Manager) ─────── */
  const setDriverStatus = async (slug, status) => {
    try {
      await api.put(`/drivers/${slug}`, { status })
      loadDrivers()
    } catch (err) {
      setStatusError(err.response?.data?.error || 'Status update failed')
    }
  }

  /* ── Add Driver (Safety Officer) ──────────────────────────────── */
  const addDriver = async () => {
    setDriverFormError('')
    const errors = validateDriverForm(driverForm)
    setDriverFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    try {
      await api.post('/drivers', {
        ...driverForm,
        name: driverForm.name.trim(),
        licenseNo: driverForm.licenseNo.trim(),
        contact: driverForm.contact.trim(),
      })
      setShowAddDriver(false)
      setDriverForm(emptyDriverForm)
      setDriverFieldErrors({})
      loadDrivers()
    } catch (err) {
      setDriverFormError(err.response?.data?.error || 'Could not add driver')
    }
  }

  /* ── Set driver app password (Dispatcher) ─────────────────────── */
  const saveCredentials = async () => {
    setCredsError('')
    try {
      await api.post(`/drivers/${credsFor.slug}/credentials`, { password: credsPassword })
      setCredsFor(null)
      setCredsPassword('')
      loadDrivers()
    } catch (err) {
      setCredsError(err.response?.data?.error || 'Could not set credentials')
    }
  }

  /* ── Add Staff / Dispatcher (Fleet Manager) ───────────────────── */
  const addStaff = async () => {
    setStaffFormError('')
    const errors = validateStaffForm(staffForm, staff)
    setStaffFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    const autoPassword = generatePassword()
    try {
      await api.post('/staff', {
        name: staffForm.name.trim(),
        email: staffForm.email.trim(),
        password: autoPassword,
        role: staffForm.role,
      })
      // Show the generated credentials to the manager so they can share them
      setCreatedStaff({ name: staffForm.name.trim(), email: staffForm.email.trim(), password: autoPassword })
      setStaffForm(emptyStaffForm)
      setStaffFieldErrors({})
      setPasswordCopied(false)
      loadStaff()
    } catch (err) {
      if (err.response?.status === 409) {
        setStaffFieldErrors({ email: err.response.data.error || 'Email already registered' })
      } else {
        setStaffFormError(err.response?.data?.error || 'Could not add staff member')
      }
    }
  }

  /* ── Delete Staff (Fleet Manager) ────────────────────────── */
  // Step 1: open confirm popup
  const deleteStaff = (member) => setConfirmRemove(member)

  // Step 2: confirmed — actually delete
  const confirmRemoveExec = async () => {
    try {
      await api.delete(`/staff/${confirmRemove.id}`)
      setConfirmRemove(null)
      loadStaff()
    } catch (err) {
      setStaffError(err.response?.data?.error || 'Could not remove staff member')
      setConfirmRemove(null)
    }
  }

  /* ── Shared input class ───────────────────────────────────────── */
  const inputCls = (hasErr) =>
    `w-full rounded border px-3 py-2 text-sm focus:outline-none ${hasErr ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-brand'}`

  /* ════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-8">

      {/* ── 1. Truck Drivers table (visible to all roles) ─────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Drivers &amp; Safety Profiles</h1>
            <p className="text-xs text-gray-400 mt-0.5">Truck drivers registered in the fleet</p>
          </div>
          {/* Only Safety Officer can add drivers */}
          {isSafetyOfficer && (
            <button
              onClick={() => setShowAddDriver(true)}
              className="btn btn-primary"
            >
              + Add Driver
            </button>
          )}
        </div>

        {(driversError || statusError) && (
          <p className="mb-3 text-sm text-red-600">{driversError || statusError}</p>
        )}

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
                {(canEditDrivers || isDispatcher) && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {driversLoading && (
                <TableSkeleton cols={(canEditDrivers || isDispatcher) ? 9 : 8} rows={4} cellClass="px-4 py-3" />
              )}
              {!driversLoading && drivers.map((d) => {
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
                      {/* Safety Officer can toggle status; Fleet Manager view-only here */}
                      {isSafetyOfficer ? (
                        <div className="flex flex-wrap gap-1">
                          {TOGGLE_STATUSES.map((s) => (
                            <button
                              key={s}
                              onClick={() => setDriverStatus(d.slug, s)}
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
                    {(canEditDrivers || isDispatcher) && (
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
              {!driversLoading && drivers.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-gray-400 text-sm">No drivers registered yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-red-600">
          Rule: Expired license or Suspended status → blocked from trip assignment
        </p>
      </section>

      {/* ── 2. Staff / Dispatchers section (Fleet Manager only) ────── */}
      {isManager && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Staff Accounts</h2>
              <p className="text-xs text-gray-400 mt-0.5">Web dashboard users — Dispatchers, Safety Officers, Financial Analysts</p>
            </div>
            <button
              onClick={() => setShowAddStaff(true)}
              className="btn btn-primary"
            >
              + Add Staff
            </button>
          </div>

          {staffError && <p className="mb-3 text-sm text-red-600">{staffError}</p>}

          <div className="overflow-x-auto rounded bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Added</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffLoading && <TableSkeleton cols={5} rows={3} cellClass="px-4 py-3" />}
                {!staffLoading && staff.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                    <td className="px-4 py-3 text-gray-600">{m.email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STAFF_ROLE_BADGE[m.role]}`}>
                        {STAFF_ROLE_LABEL[m.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(m.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteStaff(m)}
                        className="text-xs font-semibold text-red-500 hover:text-red-700 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {!staffLoading && staff.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400 text-sm">No staff accounts yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ══ Add Driver Modal (Safety Officer) ══════════════════════ */}
      {showAddDriver && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4 z-50">
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
                  value={driverForm[key]}
                  onChange={(e) => setDriverForm({ ...driverForm, [key]: e.target.value })}
                  className={inputCls(driverFieldErrors[key])}
                />
                {driverFieldErrors[key] && <p className="mt-1 text-xs text-red-600">{driverFieldErrors[key]}</p>}
              </div>
            ))}
            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Category</label>
              <select
                value={driverForm.licenseCategory}
                onChange={(e) => setDriverForm({ ...driverForm, licenseCategory: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                <option value="LMV">LMV</option>
                <option value="HMV">HMV</option>
              </select>
            </div>
            {driverFormError && <p className="mb-3 text-sm text-red-600">{driverFormError}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowAddDriver(false); setDriverFormError(''); setDriverFieldErrors({}); setDriverForm(emptyDriverForm) }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={addDriver}
                className="btn btn-primary"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Add Staff Modal (Fleet Manager) ════════════════════════ */}
      {showAddStaff && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4 z-50">
          <div className="w-full max-w-md rounded bg-white p-6 shadow-lg">
            <h2 className="mb-1 text-sm font-bold uppercase text-gray-500">Add Staff Account</h2>
            <p className="mb-4 text-xs text-gray-400">
              Creates a web dashboard login. A secure password will be generated automatically.
            </p>

            {[
              { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Raven K.' },
              { key: 'email', label: 'Email', type: 'email', placeholder: 'raven@transitops.in' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} className="mb-3">
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500">{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={staffForm[key]}
                  onChange={(e) => setStaffForm({ ...staffForm, [key]: e.target.value })}
                  className={inputCls(staffFieldErrors[key])}
                />
                {staffFieldErrors[key] && <p className="mt-1 text-xs text-red-600">{staffFieldErrors[key]}</p>}
              </div>
            ))}

            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Role</label>
              <select
                value={staffForm.role}
                onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                {STAFF_ROLES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Password auto-generate note */}
            <div className="mb-4 flex items-center gap-2 rounded border border-brand/40 bg-brand/10 px-3 py-2">
              <span className="text-sm">🔑</span>
              <p className="text-xs text-gray-600">Password will be <span className="font-semibold">auto-generated</span> and shown to you after creation.</p>
            </div>

            {staffFormError && <p className="mb-3 text-sm text-red-600">{staffFormError}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowAddStaff(false); setStaffFormError(''); setStaffFieldErrors({}); setStaffForm(emptyStaffForm) }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={addStaff}
                className="btn btn-primary"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Created Staff Credentials Modal ═════════════════════════ */}
      {createdStaff && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4 z-50">
          <div className="w-full max-w-md rounded bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <h2 className="text-sm font-bold text-gray-800">Account Created!</h2>
                <p className="text-xs text-gray-400">Share these credentials with {createdStaff.name}</p>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div>
                <p className="text-xs font-medium uppercase text-gray-400">Email</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-gray-800">{createdStaff.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-gray-400">Auto-Generated Password</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="flex-1 rounded border border-dashed border-brand bg-white px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-gray-900">
                    {createdStaff.password}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdStaff.password)
                      setPasswordCopied(true)
                      setTimeout(() => setPasswordCopied(false), 2000)
                    }}
                    className="btn btn-primary btn-sm shrink-0"
                  >
                    {passwordCopied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs text-amber-600">⚠ Save this password now — it won't be shown again.</p>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => { setCreatedStaff(null); setShowAddStaff(false) }}
                className="btn btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Set App Password Modal (Dispatcher) ════════════════════ */}
      {credsFor && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4 z-50">
          <div className="w-full max-w-md rounded bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-sm font-bold uppercase text-gray-500">Set App Password — {credsFor.name}</h2>
            <p className="mb-3 text-sm text-gray-600">
              App login uses this driver's contact number:{' '}
              <span className="font-semibold text-gray-800">{credsFor.contact}</span>
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
                onClick={() => { setCredsFor(null); setCredsError(''); setCredsPassword('') }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={saveCredentials}
                className="btn btn-primary"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Remove Staff Confirmation Modal ════════════════════════ */}
      {confirmRemove && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4 z-50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            {/* Icon + heading */}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <span className="text-lg">🗑</span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">Remove Staff Account</h3>
                <p className="text-xs text-gray-400">This action cannot be undone</p>
              </div>
            </div>

            {/* Staff detail card */}
            <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-800">{confirmRemove.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{confirmRemove.email}</p>
              <span className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${STAFF_ROLE_BADGE[confirmRemove.role]}`}>
                {STAFF_ROLE_LABEL[confirmRemove.role]}
              </span>
            </div>

            <p className="mb-5 text-sm text-gray-600">
              Are you sure you want to remove{' '}
              <span className="font-semibold text-gray-800">{confirmRemove.name}</span>?
              They will immediately lose access to the dashboard.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmRemove(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveExec}
                className="btn btn-danger"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
