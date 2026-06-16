import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import RequestLogPanel from '@/dev/RequestLogPanel'

const NAV_ITEMS = [
  { to: '/auth', label: '🔐 Auth' },
  { to: '/srd', label: '📚 SRD' },
  { to: '/characters', label: '🃏 Characters' },
  { to: '/level-up', label: '⬆️ Level Up' },
  { to: '/inventory', label: '🎒 Inventory' },
  { to: '/adventure-log', label: '📖 Logs' },
  { to: '/errors', label: '⚠️ 錯誤情境' },
]

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 bg-slate-800 flex flex-col border-r border-slate-700">
        <div className="px-4 py-4 border-b border-slate-700">
          <div className="text-lg font-bold text-violet-400">⚔️ Epos</div>
          <div className="text-xs text-slate-400">API 驗證工具</div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `block px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Auth status */}
        <div className="px-4 py-3 border-t border-slate-700 text-xs">
          {isAuthenticated && user ? (
            <div className="space-y-1">
              <div className="text-slate-400 truncate">{user.email}</div>
              <div className="text-violet-400">{user.role}</div>
              <button
                onClick={logout}
                className="mt-1 text-red-400 hover:text-red-300 cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="text-slate-500">未登入</div>
          )}
        </div>
      </aside>

      {/* Main content + Log Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>

        {/* Request Log Panel */}
        <RequestLogPanel />
      </div>
    </div>
  )
}
