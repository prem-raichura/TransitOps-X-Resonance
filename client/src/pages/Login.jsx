<<<<<<< HEAD
// Minimal login (doc 02). Enough to authenticate and reach flow 03; full RBAC dropdown UI is 02's job.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Where each role lands after login (doc 02 §4).
const HOME_BY_ROLE = {
  FLEET_MANAGER: '/fleet',
  DISPATCHER: '/dashboard',
  SAFETY_OFFICER: '/drivers',
  FINANCIAL_ANALYST: '/fuel',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('manager@transitops.in');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      navigate(HOME_BY_ROLE[user.role] || '/fleet');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setBusy(false);
=======
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLES, HOME_ROUTE } from '../lib/rbac'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', role: '', remember: true })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form)
      navigate(HOME_ROUTE[user.role] || '/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed — is the API running?')
    } finally {
      setLoading(false)
>>>>>>> 6db0e718af9c7de375e68fbaa07109db74c7cb65
    }
  }

  return (
<<<<<<< HEAD
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold">TransitOps</h1>
        <p className="mt-1 text-sm text-slate-500">Smart Transport Operations</p>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-xs text-slate-400">
          Demo: manager / dispatch / safety / finance @transitops.in · demo1234
        </p>
      </div>
    </div>
  );
=======
    <div className="flex min-h-screen">
      {/* brand panel (mockup screen 0) */}
      <div className="hidden w-2/5 flex-col justify-between bg-brand-dark p-10 md:flex">
        <div>
          <div className="h-10 w-10 rounded bg-brand" />
          <h1 className="mt-4 text-2xl font-bold text-white">TransitOps</h1>
          <p className="text-sm text-gray-400">Smart Transport Operations Platform</p>
        </div>
        <div className="text-sm text-gray-400">
          <p className="mb-2 font-semibold text-gray-300">One login, four roles:</p>
          <ul className="space-y-1">
            {Object.values(ROLES).map((r) => (
              <li key={r} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" /> {r}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-gray-500">TransitOps © 2026 · RBAC enabled</p>
      </div>

      {/* form */}
      <div className="flex flex-1 items-center justify-center bg-gray-50 p-6">
        <form onSubmit={submit} className="w-full max-w-sm">
          <h2 className="text-xl font-semibold text-gray-800">Sign in to your account</h2>
          <p className="mb-6 text-sm text-gray-500">Enter your credentials to continue</p>

          {error && (
            <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">✕ {error}</div>
          )}

          <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={set('email')}
            placeholder="raven@transitops.in"
            className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />

          <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Password</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={set('password')}
            placeholder="••••••••"
            className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />

          <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Role (RBAC)</label>
          <select
            required
            value={form.role}
            onChange={set('role')}
            className="mb-4 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
          >
            <option value="" disabled>
              Select your role
            </option>
            {Object.entries(ROLES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <div className="mb-6 flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600">
              <input type="checkbox" checked={form.remember} onChange={set('remember')} /> Remember me
            </label>
            <span className="cursor-pointer text-brand-dark underline">Forgot password?</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-brand py-2 font-semibold text-brand-dark hover:brightness-95 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
>>>>>>> 6db0e718af9c7de375e68fbaa07109db74c7cb65
}
