import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/workers', label: 'Workers', icon: '👷' },
  { to: '/attendance', label: 'Attendance', icon: '📋' },
  { to: '/tasks', label: 'Tasks', icon: '✅' },
  { to: '/wages', label: 'Wages', icon: '💰' },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-green-50 flex flex-col">
      <header className="bg-green-700 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <h1 className="text-xl font-bold tracking-tight">Thottam</h1>
        <span className="text-green-200 text-sm">Farm Manager</span>
      </header>

      <main className="flex-1 p-4 max-w-4xl mx-auto w-full">
        <Outlet />
      </main>

      <nav className="bg-white border-t border-green-200 sticky bottom-0">
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
