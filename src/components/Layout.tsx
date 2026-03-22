import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useLoading } from '../lib/LoadingContext'

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

  return (
    <div className="min-h-screen bg-green-50 flex flex-col">
      <header className="bg-green-700 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <h1 className="text-xl font-bold tracking-tight">Thottam</h1>
        <div className="flex items-center gap-3">
          <span className="text-green-200 text-xs hidden sm:inline">
            {user?.email}
          </span>
          <button
            onClick={signOut}
            className="text-green-200 hover:text-white text-sm font-medium"
          >
            Sign Out
          </button>
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
