import { useEffect, useState } from 'react'

// Toggles the `dark` class on <html> and persists the choice.
// Initial class is set pre-paint by the inline script in index.html.
export default function ThemeToggle({ className = '' }) {
  const [dark, setDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <button
      type="button"
      onClick={() => setDark((d) => !d)}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border
                  border-slate-300 bg-white text-slate-600 transition-colors
                  hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800
                  dark:text-slate-200 dark:hover:bg-slate-700 ${className}`}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}
