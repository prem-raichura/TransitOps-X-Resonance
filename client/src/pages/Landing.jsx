import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { HOME_ROUTE } from '../lib/rbac'
import ThemeToggle from '../components/ThemeToggle'

const FEATURES = [
  { icon: '🚚', title: 'Vehicle Registry', desc: 'Track every vehicle, capacity and status. Retired or in-shop rigs auto-hide from dispatch.' },
  { icon: '🧑‍✈️', title: 'Driver & Safety', desc: 'License validity, safety scores and duty status — expired licenses blocked from trips.' },
  { icon: '🗺️', title: 'Trip Dispatch', desc: 'One-tap dispatch with capacity, license and availability checks enforced server-side.' },
  { icon: '🔧', title: 'Maintenance', desc: 'Log service records; vehicles flip to In Shop and back automatically.' },
  { icon: '⛽', title: 'Fuel & Expenses', desc: 'Manual and driver-app fuel logs with auto-computed operational cost per vehicle.' },
  { icon: '📊', title: 'Analytics', desc: 'ROI, fuel efficiency and cost breakdowns — export-ready for finance.' },
]

// Photos live in client/public/team/ — drop <slug>.jpg (or .png) there; falls back to initials if missing.
const TEAM = [
  { name: 'Prem Raichura', photo: '/team/prem-raichura.png', email: 'mailto:premraichura7@gmail.com', linkedin: 'https://www.linkedin.com/in/prem-raichura/', github: 'https://github.com/prem-raichuraprem-raichura' },
  { name: 'Charmi Padh', photo: '/team/charmi-padh.png', email: 'mailto:charmi.padh030206@gmail.com', linkedin: 'https://www.linkedin.com/in/charmi-padh/', github: 'https://github.com/CharmiPadh03/' },
  { name: 'Honey Modha', photo: '/team/honey-modha.jpg', email: 'mailto:honeymodha02@gmail.com', linkedin: 'https://www.linkedin.com/in/honey-modha/', github: 'https://github.com/honeymodha' },
  { name: 'Harsh Thummar', photo: '/team/harsh-thummar.jpg', email: 'mailto:harshthummar77@gmail.com', linkedin: 'https://www.linkedin.com/in/harshthummar77/', github: 'https://github.com/harshthummar77' },
]

// Round avatar: shows the photo, or initials on missing/broken image.
function Avatar({ name, photo }) {
  const [failed, setFailed] = useState(false)
  const initials = name.split(' ').map((w) => w[0]).join('')
  if (photo && !failed) {
    return (
      <img
        src={photo}
        alt={name}
        onError={() => setFailed(true)}
        className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-ocean-light/40 dark:ring-slate-700"
      />
    )
  }
  return (
    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-ocean-mid to-ocean-deep text-2xl font-bold text-white ring-4 ring-ocean-light/40 dark:ring-slate-700">
      {initials}
    </div>
  )
}

const STATS = [
  ['4', 'Roles, one RBAC login'],
  ['10', 'Business rules enforced'],
  ['100%', 'Server-side validation'],
  ['1', 'Depot, full visibility'],
]

export default function Landing() {
  const { user } = useAuth()
  const ctaTo = user ? HOME_ROUTE[user.role] || '/dashboard' : '/login'
  const ctaLabel = user ? 'Open dashboard' : 'Sign in'

  return (
    <div className="min-h-screen bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ocean-deep font-bold text-white">
              T
            </div>
            <span className="text-lg font-bold text-ocean-deep dark:text-ocean-light">TransitOps</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#features" className="hidden text-sm font-medium text-slate-600 hover:text-ocean-deep dark:text-slate-300 dark:hover:text-ocean-light sm:inline">
              Features
            </a>
            <a href="#team" className="hidden text-sm font-medium text-slate-600 hover:text-ocean-deep dark:text-slate-300 dark:hover:text-ocean-light sm:inline">
              Team
            </a>
            <ThemeToggle />
            <Link
              to={ctaTo}
              className="rounded-lg bg-ocean-deep px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ocean-mid"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* palette gradient backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-ocean-light/40 via-white to-white dark:from-ocean-deep/40 dark:via-slate-900 dark:to-slate-900" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-sunset/15 px-3 py-1 text-xs font-semibold text-sunset">
              ● Smart Transport Operations
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              <span className="bg-gradient-to-r from-ocean-deep via-ocean-mid to-sunset bg-clip-text text-transparent dark:from-ocean-light dark:via-ocean-mid dark:to-sunset">
                Optimize. Organise. Outperform.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-base text-slate-600 dark:text-slate-300">
              A centralized fleet operations platform that simplifies fleet management, automates
              workflows, and delivers actionable business insights.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={ctaTo}
                className="rounded-lg bg-sunset px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sunset/30 transition-transform hover:-translate-y-0.5"
              >
                {user ? 'Open dashboard →' : 'Get started →'}
              </Link>
              <a
                href="#features"
                className="rounded-lg border border-ocean-mid px-6 py-3 text-sm font-semibold text-ocean-deep transition-colors hover:bg-ocean-light/20 dark:border-ocean-mid dark:text-ocean-light"
              >
                Explore features
              </a>
            </div>
          </div>

          {/* decorative panel */}
          <div className="relative">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-ocean-deep/10 dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Fleet status</span>
                <span className="rounded-full bg-ocean-light/30 px-2 py-0.5 text-xs font-medium text-ocean-deep dark:text-ocean-light">Live</span>
              </div>
              {[
                ['VAN-05', 'Available', 'bg-green-500'],
                ['TRK-12', 'On Trip', 'bg-ocean-mid'],
                ['MINI-03', 'In Shop', 'bg-sunset'],
                ['VAN-09', 'Retired', 'bg-red-500'],
              ].map(([name, label, dot]) => (
                <div key={name} className="flex items-center justify-between border-t border-slate-100 py-3 dark:border-slate-700">
                  <span className="font-medium">{name}</span>
                  <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span className={`h-2 w-2 rounded-full ${dot}`} />
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-2xl bg-ocean-mid/20" />
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="bg-ocean-deep">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-10 md:grid-cols-4">
          {STATS.map(([n, label]) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-extrabold text-ocean-light">{n}</div>
              <div className="mt-1 text-sm text-white/70">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mobile app showcase */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2">
        <div className="flex justify-center">
          <div className="rounded-[2.5rem] border-[6px] border-slate-800 bg-slate-800 shadow-2xl shadow-ocean-deep/20 dark:border-slate-700">
            <img
              src="/team/demo.jpeg"
              alt="TransitOps driver mobile app"
              className="h-[520px] w-auto rounded-[2rem] object-cover"
            />
          </div>
        </div>
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-sunset/15 px-3 py-1 text-xs font-semibold text-sunset">
            📱 On the road
          </span>
          <h2 className="mt-5 text-3xl font-bold text-ocean-deep dark:text-white">
            The driver app, in every pocket
          </h2>
          <p className="mt-4 max-w-md text-slate-600 dark:text-slate-300">
            Drivers see only their own trips, log geotagged fuel, toggle live location and complete
            runs with a GPS-verified swipe — dispatch approves from the back-office.
          </p>
          <ul className="mt-6 space-y-3">
            {['My trips & live status', 'Geotagged fuel logging', 'GPS-verified completion'].map((t) => (
              <li key={t} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ocean-light/40 text-xs text-ocean-deep dark:bg-slate-700 dark:text-ocean-light">
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-ocean-deep dark:text-white">Everything the depot needs</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">Six modules, one platform, role-scoped access.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-ocean-mid hover:shadow-xl dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ocean-light/30 text-xl dark:bg-ocean-deep/40">
                {f.icon}
              </div>
              <h3 className="mt-4 font-semibold text-ocean-deep dark:text-ocean-light">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-ocean-deep to-ocean-mid px-8 py-14 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to move?</h2>
          <p className="mx-auto mt-3 max-w-md text-white/80">
            Sign in with your role and take control of the fleet in minutes.
          </p>
          <Link
            to={ctaTo}
            className="mt-8 inline-block rounded-lg bg-sunset px-8 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
          >
            {ctaLabel} →
          </Link>
        </div>
      </section>

      {/* Team Profile */}
      <section id="team" className="mx-auto max-w-6xl px-5 pb-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-ocean-deep dark:text-white">Team Profile</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">The people behind TransitOps.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((m) => (
            <div
              key={m.name}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-center transition-all hover:-translate-y-1 hover:border-ocean-mid hover:shadow-xl dark:border-slate-700 dark:bg-slate-800"
            >
              <Avatar name={m.name} photo={m.photo} />
              <h3 className="mt-4 font-semibold text-ocean-deep dark:text-ocean-light">{m.name}</h3>
              <div className="mt-4 flex justify-center gap-3">
                <a
                  href={m.email}
                  aria-label={`Email ${m.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-ocean-light/30 text-ocean-deep transition-colors hover:bg-sunset hover:text-white dark:bg-slate-700 dark:text-ocean-light"
                >
                  ✉
                </a>
                <a
                  href={m.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${m.name} on LinkedIn`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-ocean-light/30 text-xs font-bold text-ocean-deep transition-colors hover:bg-sunset hover:text-white dark:bg-slate-700 dark:text-ocean-light"
                >
                  in
                </a>
                <a
                  href={m.github}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${m.name} on GitHub`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-ocean-light/30 text-xs font-bold text-ocean-deep transition-colors hover:bg-sunset hover:text-white dark:bg-slate-700 dark:text-ocean-light"
                >
                  GH
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        TransitOps © 2026 · Smart Transport Operations Platform
      </footer>
    </div>
  )
}
