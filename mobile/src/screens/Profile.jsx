import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useDriverAuth } from '../context/DriverAuthContext'

export default function Profile() {
  const { logout } = useDriverAuth()
  const navigate = useNavigate()
  const [me, setMe] = useState(null)

  useEffect(() => {
    api.get('/driver/me').then(({ data }) => setMe(data)).catch(() => {})
  }, [])

  const doLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex items-center gap-3 bg-brand-dark px-4 py-3">
        <button onClick={() => navigate('/')} className="text-white">
          ←
        </button>
        <span className="text-sm font-semibold text-white">Profile</span>
      </header>

      {me && (
        <div className="space-y-4 p-4">
          <section className="rounded-lg bg-white p-5 text-center shadow-sm">
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl font-bold text-brand-dark">
              {me.name?.[0]}
            </div>
            <p className="text-lg font-semibold">{me.name}</p>
            <p className="text-sm text-gray-500">{me.contact}</p>
          </section>

          <section className="rounded-lg bg-white p-4 text-sm shadow-sm">
            <Row label="License" value={`${me.licenseNo} (${me.licenseCategory})`} />
            <Row
              label="License expiry"
              value={new Date(me.licenseExpiry).toLocaleDateString()}
              warn={me.licenseExpired}
            />
            <Row label="Safety score" value={`${me.safetyScore}%`} />
            <Row label="Status" value={me.status} />
          </section>

          {me.licenseExpired && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              ⚠️ Your license has expired — contact the safety officer.
            </div>
          )}

          <button onClick={doLogout} className="w-full rounded-lg bg-white py-3 text-sm font-medium text-red-600 shadow-sm">
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, warn }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${warn ? 'text-red-600' : 'text-gray-800'}`}>{value}</span>
    </div>
  )
}
