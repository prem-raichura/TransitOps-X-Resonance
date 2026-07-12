const STYLE = {
  DRAFT: 'bg-gray-400',
  DISPATCHED: 'bg-blue-600',
  PENDING_COMPLETION: 'bg-amber-500',
  COMPLETED: 'bg-green-600',
  CANCELLED: 'bg-red-500',
}
const LABEL = {
  DRAFT: 'Draft',
  DISPATCHED: 'Active',
  PENDING_COMPLETION: 'Awaiting verification',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export default function StatusPill({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${STYLE[status] || 'bg-gray-400'}`}>
      {LABEL[status] || status}
    </span>
  )
}
