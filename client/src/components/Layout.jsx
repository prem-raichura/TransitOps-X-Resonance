import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { NAV_ITEMS, ROLE_CODE, can } from '../lib/rbac'
import ThemeToggle from './ThemeToggle'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false) // mobile sidebar toggle

  const items = NAV_ITEMS.filter((item) => can(user.role, item.module))

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-slate-900">
      {/* backdrop for the mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 sm:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* sidebar — overlay drawer on small screens, static column on ≥sm */}
      <aside
        className={`${open ? 'translate-x-0' : '-translate-x-full'}
          fixed inset-y-0 left-0 z-40 flex w-52 shrink-0 flex-col bg-white shadow-sm
          transition-transform duration-200 dark:bg-slate-800
          sm:static sm:translate-x-0 sm:transition-none`}
      >
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="h-7 w-7 rounded bg-brand" />
          <span className="font-bold text-brand-dark dark:text-slate-100">TransitOps</span>
        </div>
        <nav className="flex-1 space-y-1 px-2">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-brand/20 font-semibold text-brand-dark dark:bg-brand/15 dark:text-brand'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between bg-white px-4 py-3 shadow-sm dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <button
              className="btn btn-ghost btn-sm btn-icon sm:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <input
              type="search"
              placeholder="Search…"
              className="w-40 rounded border border-gray-200 px-3 py-1.5 text-sm focus:border-brand focus:outline-none sm:w-56"
            />
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/profile" className="flex items-center gap-2 hover:opacity-80" title="Profile">
              <span className="hidden text-sm font-medium text-gray-700 sm:inline">{user.name}</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                {ROLE_CODE[user.role]}
              </span>
            </Link>
            <button
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="btn btn-ghost btn-sm text-gray-500 hover:text-red-600"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-x-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
