// App shell: role-scoped sidebar + responsive content area (doc 02 shell, minimal for flow 03).
import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

// Menu with the roles allowed to see each item (permission matrix, doc 02 §3).
const NAV = [
  { to: '/dashboard', label: 'Dashboard', roles: ['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
  { to: '/fleet', label: 'Fleet (Vehicles)', roles: ['FLEET_MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST'] },
  { to: '/drivers', label: 'Drivers', roles: ['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER'] },
  { to: '/trips', label: 'Trips', roles: ['DISPATCHER', 'SAFETY_OFFICER'] },
  { to: '/maintenance', label: 'Maintenance', roles: ['FLEET_MANAGER', 'FINANCIAL_ANALYST'] },
  { to: '/fuel', label: 'Fuel & Expenses', roles: ['SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
  { to: '/analytics', label: 'Analytics', roles: ['FINANCIAL_ANALYST'] },
];

const ROLE_LABELS = {
  FLEET_MANAGER: 'Fleet Manager',
  DISPATCHER: 'Dispatcher',
  SAFETY_OFFICER: 'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((n) => !user || n.roles.includes(user.role));

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — collapses on small screens */}
      <aside
        className={`${open ? 'block' : 'hidden'} md:block w-60 shrink-0 bg-slate-900 text-slate-100`}
      >
        <div className="px-5 py-4 text-lg font-bold tracking-tight">TransitOps</div>
        <nav className="mt-2 flex flex-col gap-1 px-2">
          {items.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm ${
                  isActive ? 'bg-slate-700 font-medium' : 'hover:bg-slate-800'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <button
            className="md:hidden rounded border px-2 py-1 text-sm"
            onClick={() => setOpen((o) => !o)}
          >
            ☰
          </button>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-slate-600">
              {user?.name} · <span className="font-medium">{ROLE_LABELS[user?.role] || user?.role}</span>
            </span>
            <button onClick={handleLogout} className="rounded border px-3 py-1 hover:bg-slate-50">
              Logout
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-x-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
