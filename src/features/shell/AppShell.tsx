import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'

// 正式產品殼（6.2）：品牌側欄導航 + 內容區。對齊主題 A 沉浸奇幻（CSS 變數於 index.css）。

const NAV = [
  { to: '/characters', label: '我的角色' },
]

export default function AppShell() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const onLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <aside style={{
        width: 220, flexShrink: 0, background: 'var(--surface)',
        borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        padding: '24px 0',
      }}>
        <div style={{
          fontFamily: 'Georgia, serif', fontSize: 22, letterSpacing: 4,
          color: 'var(--accent)', textAlign: 'center', marginBottom: 28,
        }}>EPOS</div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' }}>
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              style={({ isActive }) => ({
                padding: '10px 14px', borderRadius: 4, textDecoration: 'none',
                fontFamily: 'Georgia, serif', letterSpacing: 1,
                color: isActive ? 'var(--accent)' : 'var(--muted)',
                background: isActive ? 'var(--accent-bg)' : 'transparent',
              })}
            >{n.label}</NavLink>
          ))}
        </nav>

        <div style={{ padding: '0 12px', marginTop: 'auto' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', padding: '0 14px 8px', wordBreak: 'break-all' }}>
            {user?.email ?? ''}
          </div>
          <button
            onClick={onLogout}
            style={{
              width: '100%', padding: '8px 14px', borderRadius: 4, cursor: 'pointer',
              background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)',
              fontFamily: 'Georgia, serif', letterSpacing: 1,
            }}
          >登出</button>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
        <Outlet />
      </main>
    </div>
  )
}
