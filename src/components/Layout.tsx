import { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useLoading } from '../lib/LoadingContext'
import { useSettings } from '../lib/SettingsContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/workers', label: 'Workers', icon: '👷' },
  { to: '/attendance', label: 'Attendance', icon: '📋' },
  { to: '/tasks', label: 'Tasks', icon: '✅' },
  { to: '/wages', label: 'Wages', icon: '💰' },
]

export default function Layout() {
  const { signOut, user } = useAuth()
  const { isLoading } = useLoading()
  const { farmName } = useSettings()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <div className="min-h-screen bg-green-50 flex flex-col">
      <header className="bg-green-700 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <h1 className="text-xl font-bold tracking-tight">{farmName}</h1>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white hover:text-green-200 p-1"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
              <p className="px-4 py-2 text-xs text-gray-400 truncate border-b border-gray-100">
                {user?.email}
              </p>
              <Link
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50"
              >
                Settings
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  signOut()
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Loading bar */}
      <div className="h-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-green-200 overflow-hidden">
            <div className="h-full bg-green-400 animate-loading-bar" />
          </div>
        )}
      </div>

      <div className="relative flex-1 flex flex-col">
        {/* Darkened overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/10 z-40 pointer-events-auto" />
        )}

        <main className="flex-1 p-4 max-w-4xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      <nav className="bg-white border-t border-green-200 sticky bottom-0 z-50">
        <div className="flex justify-around max-w-4xl mx-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-3 text-xs transition-colors ${
                  isActive
                    ? 'text-green-700 font-semibold'
                    : 'text-gray-500 hover:text-green-600'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
