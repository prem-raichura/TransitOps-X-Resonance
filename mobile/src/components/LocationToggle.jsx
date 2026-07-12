import { useState } from 'react'
import api from '../api/client'

// Header toggle: driver controls whether GPS pings are sent (doc 12).
// Green dot = ON. Server is authoritative — it refuses pings when off.
export default function LocationToggle({ enabled, onChange }) {
  const [busy, setBusy] = useState(false)

  const toggle = async () => {
    setBusy(true)
    try {
      const { data } = await api.put('/driver/location-sharing', { enabled: !enabled })
      onChange?.(data.locationEnabled)
    } catch {
      // keep previous state on failure
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
    >
      <span className={`h-2 w-2 rounded-full ${enabled ? 'bg-green-400' : 'bg-gray-400'}`} />
      {enabled ? 'Location ON' : 'Location OFF'}
    </button>
  )
}
