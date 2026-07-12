import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { NAV_ITEMS, ROLES, can } from '../lib/rbac'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const items = NAV_ITEMS.filter((item) => can(user.role, item.module))

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* sidebar */}
      <aside className="hidden w-52 flex-col bg-white shadow-sm sm:flex">
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="h-7 w-7 rounded bg-brand" />
          <span className="font-bold text-brand-dark">TransitOps</span>
        </div>
        <nav className="flex-1 space-y-1 px-2">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm ${
                  isActive ? 'bg-brand/20 font-semibold text-brand-dark' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* main */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between bg-white px-4 py-3 shadow-sm">
          <input
            type="search"
            placeholder="Search…"
            className="w-56 rounded border border-gray-200 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
          />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">{user.name}</span>
            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">{ROLES[user.role]}</span>
            <button
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="text-sm text-gray-500 hover:text-red-600"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-x-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
