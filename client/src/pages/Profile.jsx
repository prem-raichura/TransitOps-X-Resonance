import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { MATRIX, NAV_ITEMS, ROLES, can } from '../lib/rbac'

const ACCESS_LABEL = { full: 'Full Access', view: 'View Only' }

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

const initials = (name) =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

const emptyPasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' }

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')

  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api
      .get('/auth/me')
      .then(({ data }) => setProfile(data.user))
      .catch(() => setError('Could not load profile'))
  }, [])

  const changePassword = async () => {
    setPasswordError('')
    setPasswordSaved(false)

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('Current and new password are required')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match')
      return
    }

    setBusy(true)
    try {
      await api.put('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordSaved(true)
      setPasswordForm(emptyPasswordForm)
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Could not change password')
    } finally {
      setBusy(false)
    }
  }

  const modules = NAV_ITEMS.filter((i) => i.module !== 'settings')

  if (!user) return null

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* account details */}
      <section className="rounded bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold uppercase text-gray-500">Account Details</h2>

        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-lg font-bold text-brand-dark">
            {initials(user.name)}
          </div>
          <div>
            <div className="text-base font-semibold text-gray-800">{user.name}</div>
            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">{ROLES[user.role]}</span>
          </div>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <dl className="space-y-3 text-sm">
          <div className="flex justify-between border-t border-gray-100 pt-3">
            <dt className="text-gray-500">Name</dt>
            <dd className="font-medium text-gray-800">{profile?.name ?? user.name}</dd>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-3">
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium text-gray-800">{profile?.email ?? user.email}</dd>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-3">
            <dt className="text-gray-500">Role</dt>
            <dd className="font-medium text-gray-800">{ROLES[user.role]}</dd>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-3">
            <dt className="text-gray-500">Member Since</dt>
            <dd className="font-medium text-gray-800">{profile?.createdAt ? fmtDate(profile.createdAt) : '—'}</dd>
          </div>
        </dl>
      </section>

      <div className="space-y-6">
        {/* role access */}
        <section className="rounded bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase text-gray-500">Your Access</h2>
          <ul className="divide-y divide-gray-100 text-sm">
            {modules.map((m) => {
              const level = can(user.role, m.module)
              return (
                <li key={m.module} className="flex items-center justify-between py-2">
                  <span className="text-gray-700">{m.label}</span>
                  {level ? (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        level === 'full' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {ACCESS_LABEL[level]}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">No Access</span>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        {/* change password */}
        <section className="rounded bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase text-gray-500">Change Password</h2>
          {[
            { key: 'currentPassword', label: 'Current Password' },
            { key: 'newPassword', label: 'New Password' },
            { key: 'confirmPassword', label: 'Confirm New Password' },
          ].map(({ key, label }) => (
            <div key={key} className="mb-3">
              <label className="mb-1 block text-xs font-medium uppercase text-gray-500">{label}</label>
              <input
                type="password"
                value={passwordForm[key]}
                onChange={(e) => setPasswordForm({ ...passwordForm, [key]: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          ))}
          {passwordError && <p className="mb-3 text-sm text-red-600">{passwordError}</p>}
          {passwordSaved && <p className="mb-3 text-sm text-green-600">Password changed ✓</p>}
          <button
            onClick={changePassword}
            disabled={busy}
            className="rounded bg-brand px-4 py-2 text-sm font-semibold text-brand-dark hover:brightness-95 disabled:opacity-60"
          >
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </section>
      </div>
    </div>
  )
}
