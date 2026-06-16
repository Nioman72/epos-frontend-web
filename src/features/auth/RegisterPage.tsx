import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'

// 正式產品註冊頁（6.2，ADR-026 次要 bug：補正式註冊入口）。
// 後端 register 即回 token → AuthContext 自動登入 → 導向角色清單。
export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await register({ email, password, username })
      navigate('/characters', { replace: true })
    } catch {
      setError('註冊失敗：信箱可能已註冊，或密碼不符複雜度要求')
    } finally {
      setBusy(false)
    }
  }

  const field: React.CSSProperties = {
    width: '100%', padding: '10px 14px', marginTop: 6, borderRadius: 4,
    background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text)',
    fontSize: 15,
  }
  const label: React.CSSProperties = {
    fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)',
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <form onSubmit={submit} style={{ width: 360, maxWidth: '100%' }}>
        <div style={{
          fontFamily: 'Georgia, serif', fontSize: 40, letterSpacing: 8,
          color: 'var(--accent)', textAlign: 'center', marginBottom: 6,
        }}>EPOS</div>
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, letterSpacing: 2, marginBottom: 32 }}>
          建立帳號
        </p>

        <label style={label}>電子郵件
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="email" required style={field} />
        </label>
        <div style={{ height: 16 }} />
        <label style={label}>使用者名稱
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
            autoComplete="username" required style={field} />
        </label>
        <div style={{ height: 16 }} />
        <label style={label}>密碼
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password" required style={field} />
        </label>

        {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 14 }}>{error}</p>}

        <button type="submit" disabled={busy} style={{
          width: '100%', marginTop: 24, padding: '12px', borderRadius: 4, cursor: 'pointer',
          background: 'var(--accent-bg)', border: '1px solid var(--accent)', color: 'var(--accent)',
          fontFamily: 'Georgia, serif', fontSize: 15, letterSpacing: 2,
        }}>{busy ? '建立中…' : '建立帳號'}</button>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--muted)' }}>
          已有帳號？<Link to="/login" style={{ color: 'var(--accent)' }}>登入</Link>
        </p>
      </form>
    </div>
  )
}
