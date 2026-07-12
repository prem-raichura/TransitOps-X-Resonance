import { useRef, useState } from 'react'

// Swipe-to-confirm control. Fires onComplete() only when dragged past ~85% of the track.
// Snaps back on release if not far enough. Used for trip completion (mandatory GPS handled by caller).
export default function CompletionSlider({ label = 'slide to complete trip', disabled, onComplete }) {
  const trackRef = useRef(null)
  const [x, setX] = useState(0)
  const [dragging, setDragging] = useState(false)

  const KNOB = 52

  const maxX = () => (trackRef.current ? trackRef.current.offsetWidth - KNOB - 8 : 0)

  const move = (clientX) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const next = Math.max(0, Math.min(clientX - rect.left - KNOB / 2, maxX()))
    setX(next)
  }

  const start = () => {
    if (disabled) return
    setDragging(true)
  }

  const end = () => {
    if (!dragging) return
    setDragging(false)
    if (x >= maxX() * 0.85) {
      setX(maxX())
      onComplete?.()
    }
    setX(0) // snap back either way; success screen replaces this control
  }

  const pct = maxX() ? x / maxX() : 0

  return (
    <div
      ref={trackRef}
      className={`relative h-14 w-full select-none overflow-hidden rounded-full ${
        disabled ? 'bg-gray-200' : 'bg-brand-dark'
      }`}
      onMouseMove={(e) => dragging && move(e.clientX)}
      onMouseUp={end}
      onMouseLeave={end}
      onTouchMove={(e) => dragging && move(e.touches[0].clientX)}
      onTouchEnd={end}
    >
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium"
        style={{ color: disabled ? '#9ca3af' : `rgba(255,255,255,${1 - pct})` }}
      >
        {disabled ? 'unavailable' : label}
      </span>
      <button
        type="button"
        disabled={disabled}
        onMouseDown={start}
        onTouchStart={start}
        className="absolute top-1 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-brand-dark shadow"
        style={{ left: 4 + x, transition: dragging ? 'none' : 'left 0.2s' }}
      >
        ➜
      </button>
    </div>
  )
}
