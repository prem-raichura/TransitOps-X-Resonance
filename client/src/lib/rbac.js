// Mirror of server permission matrix (PLANS/02 §3) — UX only, server is the authority.
// Levels: 'full' | 'view' | null

export const ROLES = {
  FLEET_MANAGER: 'Fleet Manager',
  DISPATCHER: 'Dispatcher',
  SAFETY_OFFICER: 'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
}

export const MATRIX = {
  fleet: { FLEET_MANAGER: 'full', DISPATCHER: 'view', SAFETY_OFFICER: null, FINANCIAL_ANALYST: 'view' },
  drivers: { FLEET_MANAGER: 'full', DISPATCHER: 'view', SAFETY_OFFICER: 'full', FINANCIAL_ANALYST: null },
  trips: { FLEET_MANAGER: null, DISPATCHER: 'full', SAFETY_OFFICER: 'view', FINANCIAL_ANALYST: null },
  maintenance: { FLEET_MANAGER: 'full', DISPATCHER: null, SAFETY_OFFICER: null, FINANCIAL_ANALYST: 'view' },
  fuel: { FLEET_MANAGER: null, DISPATCHER: null, SAFETY_OFFICER: 'view', FINANCIAL_ANALYST: 'full' },
  analytics: { FLEET_MANAGER: null, DISPATCHER: null, SAFETY_OFFICER: null, FINANCIAL_ANALYST: 'full' },
  dashboard: { FLEET_MANAGER: 'view', DISPATCHER: 'view', SAFETY_OFFICER: 'view', FINANCIAL_ANALYST: 'view' },
  settings: { FLEET_MANAGER: 'full', DISPATCHER: 'view', SAFETY_OFFICER: 'view', FINANCIAL_ANALYST: 'view' },
}

export const can = (role, module_) => MATRIX[module_]?.[role] ?? null
export const canEdit = (role, module_) => can(role, module_) === 'full'

// Where each role lands after login (PLANS/02 §4)
export const HOME_ROUTE = {
  FLEET_MANAGER: '/fleet',
  DISPATCHER: '/dashboard',
  SAFETY_OFFICER: '/drivers',
  FINANCIAL_ANALYST: '/fuel',
}

export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', module: 'dashboard' },
  { path: '/fleet', label: 'Fleet', module: 'fleet' },
  { path: '/drivers', label: 'Drivers', module: 'drivers' },
  { path: '/trips', label: 'Trips', module: 'trips' },
  { path: '/maintenance', label: 'Maintenance', module: 'maintenance' },
  { path: '/fuel', label: 'Fuel & Expenses', module: 'fuel' },
  { path: '/analytics', label: 'Analytics', module: 'analytics' },
  { path: '/settings', label: 'Settings', module: 'settings' },
]
