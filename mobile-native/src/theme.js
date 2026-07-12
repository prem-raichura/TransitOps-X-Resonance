export const colors = {
  brand: '#f5b301',
  brandDark: '#21313f',
  brandDark2: '#2b3f52',
  bg: '#f1f4f7',
  card: '#ffffff',
  text: '#1f2937',
  subtle: '#6b7280',
  faint: '#9ca3af',
  border: '#e5e7eb',
  blue: '#2563eb',
  green: '#16a34a',
  amber: '#f59e0b',
  red: '#ef4444',
  greenDot: '#4ade80',
}

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 }

// soft elevation used across cards
export const shadow = {
  shadowColor: '#0f172a',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
}

export const statusColor = {
  DRAFT: colors.faint,
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
