// Shared status pill — reused by Vehicles/Drivers/Trips (doc 03).
// Available=green, On Trip=blue, In Shop=orange, Retired=red (+ driver/trip statuses).
const STYLES = {
  AVAILABLE: 'bg-green-100 text-green-800 ring-green-600/20',
  ON_TRIP: 'bg-blue-100 text-blue-800 ring-blue-600/20',
  IN_SHOP: 'bg-orange-100 text-orange-800 ring-orange-600/20',
  RETIRED: 'bg-red-100 text-red-800 ring-red-600/20',
  // shared statuses used elsewhere
  OFF_DUTY: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  SUSPENDED: 'bg-red-100 text-red-800 ring-red-600/20',
  // trip statuses
  DRAFT: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  DISPATCHED: 'bg-blue-100 text-blue-800 ring-blue-600/20',
  PENDING_COMPLETION: 'bg-orange-100 text-orange-800 ring-orange-600/20',
  COMPLETED: 'bg-green-100 text-green-800 ring-green-600/20',
  CANCELLED: 'bg-red-100 text-red-800 ring-red-600/20',
};

const LABELS = {
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  IN_SHOP: 'In Shop',
  RETIRED: 'Retired',
  OFF_DUTY: 'Off Duty',
  SUSPENDED: 'Suspended',
  DRAFT: 'Draft',
  DISPATCHED: 'Dispatched',
  PENDING_COMPLETION: 'Pending',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || 'bg-slate-100 text-slate-700 ring-slate-500/20';
  const label = LABELS[status] || status;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {label}
    </span>
  );
}
