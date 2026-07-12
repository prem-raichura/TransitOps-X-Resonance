import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDriverAuth } from '../context/DriverAuthContext'

export default function Login() {
  const { login } = useDriverAuth()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(phone.trim(), password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed — is the API running?')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-brand-dark px-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 h-12 w-12 rounded-lg bg-brand" />
        <h1 className="text-2xl font-bold text-white">TransitOps Driver</h1>
        <p className="text-sm text-gray-400">Trips · GPS · Fuel proof</p>
      </div>

      <form onSubmit={submit} className="rounded-2xl bg-white p-6">
        {error && <div className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Phone Number</label>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="9876500001"
          className="mb-4 w-full rounded border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
        />

        <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="mb-5 w-full rounded border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
        />

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-brand py-2.5 font-semibold text-brand-dark disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Sign In'}
        </button>

        <p className="mt-4 text-center text-xs text-gray-400">Credentials provided by your dispatcher</p>
      </form>
    </div>
  )
}
