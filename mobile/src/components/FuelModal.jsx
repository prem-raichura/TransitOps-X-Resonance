import { useRef, useState } from 'react'
import api from '../api/client'
import { getPosition } from '../lib/geo'

// Camera-first fuel logging. Photo of the fuel meter + GPS fix are BOTH mandatory (doc 11).
// Flow: pick/capture photo -> app grabs GPS -> enter liters + cost -> multipart upload.
export default function FuelModal({ tripSlug, onClose, onLogged }) {
  const fileRef = useRef(null)
  const [photo, setPhoto] = useState(null) // File
  const [preview, setPreview] = useState(null) // object URL
  const [coords, setCoords] = useState(null)
  const [liters, setLiters] = useState('')
  const [cost, setCost] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onPick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
    // grab GPS at capture time (proof pair)
    try {
      setCoords(await getPosition())
    } catch (err) {
      setCoords(null)
      setError('Enable GPS to log fuel — location is required with the photo.')
    }
  }

  const submit = async () => {
    setError('')
    if (!photo || !coords) {
      setError('Fuel meter photo with GPS is required.')
      return
    }
    if (!liters || !cost) {
      setError('Enter liters and cost.')
      return
    }
    setBusy(true)
    try {
      const form = new FormData()
      form.append('proofImage', photo)
      form.append('liters', liters)
      form.append('cost', cost)
      form.append('lat', coords.lat)
      form.append('lng', coords.lng)
      await api.post(`/driver/trips/${tripSlug}/fuel`, form)
      onLogged?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div className="w-full rounded-t-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-semibold">Log Fuel</h3>

        {error && <div className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        {/* camera-first: capture the meter/pump display */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onPick}
          className="hidden"
        />

        {preview ? (
          <div className="mb-3">
            <img src={preview} alt="fuel meter" className="h-40 w-full rounded object-cover" />
            <p className="mt-1 text-xs text-gray-500">
              {coords ? `📍 ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : '⚠️ no GPS fix'}
            </p>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="mb-3 flex h-40 w-full flex-col items-center justify-center rounded border-2 border-dashed border-gray-300 text-gray-500"
          >
            <span className="text-3xl">📷</span>
            <span className="mt-1 text-sm">Photograph the fuel meter</span>
          </button>
        )}

        <div className="mb-3 grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Liters"
            value={liters}
            onChange={(e) => setLiters(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Cost ₹"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded border border-gray-300 py-2 text-sm">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy || !photo || !coords}
            className="flex-1 rounded bg-brand py-2 text-sm font-semibold text-brand-dark disabled:opacity-50"
          >
            {busy ? 'Uploading…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}
