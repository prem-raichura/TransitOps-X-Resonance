export const colors = {
  brand: '#f5b301',
  brandDark: '#21313f',
  bg: '#f3f4f6',
  white: '#ffffff',
  text: '#1f2937',
  subtle: '#6b7280',
  border: '#e5e7eb',
  blue: '#2563eb',
  green: '#16a34a',
  amber: '#f59e0b',
  red: '#ef4444',
  gray: '#9ca3af',
}

export const statusColor = {
  DRAFT: colors.gray,
  DISPATCHED: colors.blue,
  PENDING_COMPLETION: colors.amber,
  COMPLETED: colors.green,
  CANCELLED: colors.red,
}

export const statusLabel = {
  DRAFT: 'Draft',
  DISPATCHED: 'Active',
  PENDING_COMPLETION: 'Awaiting verification',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}
