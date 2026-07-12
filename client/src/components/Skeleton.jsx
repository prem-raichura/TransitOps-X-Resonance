// Shared shimmer placeholders shown while data loads.
// `.skeleton` (index.css) = animate-pulse + light/dark surface.

export default function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}

/* Rows of shimmer cells for a <tbody>. `cellClass` should match the
   real table's cell padding so the layout doesn't jump when data lands. */
export function TableSkeleton({ cols = 5, rows = 5, cellClass = 'px-4 py-3' }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-t border-gray-100">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className={cellClass}>
              <Skeleton className="h-3.5 w-full max-w-[110px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/* Card-shaped placeholder (KPI cards, panels). */
export function CardSkeleton({ lines = 2, className = '' }) {
  return (
    <div className={`rounded bg-white p-5 shadow-sm ${className}`}>
      <Skeleton className="mb-4 h-4 w-1/2" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`mb-3 h-3.5 ${i % 2 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}
