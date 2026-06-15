import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

// 正式產品登入頁（6.2）。複用 AuthContext.login（API Client 已備 401 refresh）。
export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login({ email, password })
      navigate('/characters', { replace: true })
    } catch {
      setError('登入失敗，請檢查帳號或密碼')
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
          角色卡管理
        </p>

        <label style={label}>電子郵件
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="email" required style={field} />
        </label>
        <div style={{ height: 16 }} />
        <label style={label}>密碼
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password" required style={field} />
        </label>

        {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 14 }}>{error}</p>}

        <button type="submit" disabled={busy} style={{
          width: '100%', marginTop: 24, padding: '12px', borderRadius: 4, cursor: 'pointer',
          background: 'var(--accent-bg)', border: '1px solid var(--accent)', color: 'var(--accent)',
          fontFamily: 'Georgia, serif', fontSize: 15, letterSpacing: 2,
        }}>{busy ? '登入中…' : '登入'}</button>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--muted)' }}>
          還沒有帳號？<Link to="/register" style={{ color: 'var(--accent)' }}>註冊</Link>
        </p>
      </form>
    </div>
  )
}
