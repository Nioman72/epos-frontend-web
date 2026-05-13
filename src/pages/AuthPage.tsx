import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/authApi'
import type { ApiError } from '../types/api'

type Mode = 'login' | 'register' | 'guest'

function ErrorBox({ error }: { error: ApiError | null }) {
  if (!error) return null
  return (
    <div className="bg-red-900/40 border border-red-700 rounded p-3 text-sm text-red-300">
      <span className="font-mono text-red-400">[{error.status} {error.code}]</span> {error.message}
    </div>
  )
}

function SuccessBox({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="bg-green-900/40 border border-green-700 rounded p-3 text-sm text-green-300">
      ✅ {message}
    </div>
  )
}

export default function AuthPage() {
  const { login, register, guestLogin, logout, manualRefresh, isAuthenticated, user, accessToken, refreshToken } = useAuth()

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Forgot / Reset password
  const [fpEmail, setFpEmail] = useState('')
  const [fpLoading, setFpLoading] = useState(false)
  const [fpError, setFpError] = useState<ApiError | null>(null)
  const [fpSuccess, setFpSuccess] = useState<string | null>(null)
  const [rpToken, setRpToken] = useState('')
  const [rpNewPw, setRpNewPw] = useState('')
  const [rpLoading, setRpLoading] = useState(false)
  const [rpError, setRpError] = useState<ApiError | null>(null)
  const [rpSuccess, setRpSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        await login({ email, password })
        setSuccess('登入成功')
      } else if (mode === 'register') {
        await register({ email, password, username })
        setSuccess('註冊成功並自動登入')
      } else {
        await guestLogin()
        setSuccess('訪客登入成功')
      }
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      await manualRefresh()
      setSuccess('Token refresh 成功')
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    setError(null)
    setSuccess(null)
    await logout()
    setSuccess('已登出')
  }

  async function handleForgotPw(e: React.FormEvent) {
    e.preventDefault()
    setFpError(null); setFpSuccess(null); setFpLoading(true)
    try {
      await authApi.forgotPassword(fpEmail)
      setFpSuccess('已送出請求（202 Accepted）。若 Email 存在，系統將寄送重設連結。')
    } catch (err) {
      setFpError(err as ApiError)
    } finally {
      setFpLoading(false)
    }
  }

  async function handleResetPw(e: React.FormEvent) {
    e.preventDefault()
    setRpError(null); setRpSuccess(null); setRpLoading(true)
    try {
      await authApi.resetPassword(rpToken.trim(), rpNewPw)
      setRpSuccess('密碼重設成功（204 No Content）')
      setRpToken(''); setRpNewPw('')
    } catch (err) {
      setRpError(err as ApiError)
    } finally {
      setRpLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">🔐 Auth 流程驗證 <span className="text-sm font-normal text-slate-400">WBS 2.3</span></h1>

      {/* 登入狀態 */}
      <div className="bg-slate-800 rounded-lg p-4 space-y-2 border border-slate-700">
        <div className="text-sm font-semibold text-slate-300 mb-2">目前狀態</div>
        <div className="text-xs space-y-1 font-mono">
          <div>
            <span className="text-slate-500">isAuthenticated: </span>
            <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>{String(isAuthenticated)}</span>
          </div>
          {user && (
            <>
              <div><span className="text-slate-500">userId: </span><span className="text-slate-300">{user.userId}</span></div>
              <div><span className="text-slate-500">email: </span><span className="text-slate-300">{user.email}</span></div>
              <div><span className="text-slate-500">role: </span><span className="text-violet-400">{user.role}</span></div>
            </>
          )}
          {accessToken && (
            <div><span className="text-slate-500">accessToken: </span><span className="text-yellow-400 break-all">{accessToken.slice(0, 40)}…</span></div>
          )}
          {refreshToken && (
            <div><span className="text-slate-500">refreshToken: </span><span className="text-yellow-400 break-all">{refreshToken.slice(0, 40)}…</span></div>
          )}
        </div>
      </div>

      {/* 表單 */}
      {!isAuthenticated && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-4">
          {/* Mode 切換 */}
          <div className="flex gap-2">
            {(['login', 'register', 'guest'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setSuccess(null) }}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  mode === m ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {m === 'login' ? '登入' : m === 'register' ? '註冊' : '訪客登入'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode !== 'guest' && (
              <>
                {mode === 'register' && (
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
                    required
                  />
                )}
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
                  required
                />
              </>
            )}

            <ErrorBox error={error} />
            <SuccessBox message={success} />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 text-white rounded px-4 py-2 text-sm font-medium transition-colors"
            >
              {loading ? '處理中…' : mode === 'login' ? '登入' : mode === 'register' ? '註冊' : '訪客登入'}
            </button>
          </form>
        </div>
      )}

      {/* 已登入操作 */}
      {isAuthenticated && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-3">
          <div className="text-sm font-semibold text-slate-300">操作</div>

          <ErrorBox error={error} />
          <SuccessBox message={success} />

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded px-4 py-2 text-sm font-medium transition-colors"
            >
              {loading ? '處理中…' : '手動 Refresh Token'}
            </button>

            <button
              onClick={handleLogout}
              disabled={loading}
              className="bg-red-700 hover:bg-red-600 disabled:bg-slate-700 text-white rounded px-4 py-2 text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>

          <p className="text-xs text-slate-500">
            手動 Refresh 會呼叫 POST /api/v1/auth/refresh，並更新 Context 中的 token。
          </p>
        </div>
      )}

      {/* 密碼重設流程 */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-5">
        <div className="text-sm font-semibold text-slate-300">🔑 密碼重設流程驗證</div>

        {/* Step 1: 發送重設信 */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Step 1 — POST /auth/forgot-password
          </div>
          <p className="text-xs text-slate-500">
            無論 Email 是否存在均回傳 202 Accepted（防止使用者枚舉攻擊）。
          </p>
          <form onSubmit={handleForgotPw} className="flex gap-2">
            <input
              type="email"
              placeholder="輸入 Email"
              value={fpEmail}
              onChange={e => setFpEmail(e.target.value)}
              required
              className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              disabled={fpLoading}
              className="bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 text-white rounded px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap"
            >
              {fpLoading ? '發送中…' : '發送重設信'}
            </button>
          </form>
          {fpError && (
            <div className="bg-red-900/40 border border-red-700 rounded p-2 text-xs text-red-300">
              [{fpError.status} {fpError.code}] {fpError.message}
            </div>
          )}
          {fpSuccess && (
            <div className="bg-green-900/40 border border-green-700 rounded p-2 text-xs text-green-300">
              ✅ {fpSuccess}
            </div>
          )}
        </div>

        <div className="border-t border-slate-700" />

        {/* Step 2: 重設密碼 */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Step 2 — POST /auth/reset-password
          </div>
          <p className="text-xs text-slate-500">
            貼入重設信中的明文 Token，設定新密碼（至少 8 字元）。Token 一次性，有效 30 分鐘。
          </p>
          <form onSubmit={handleResetPw} className="space-y-2">
            <input
              type="text"
              placeholder="重設 Token（從信件複製）"
              value={rpToken}
              onChange={e => setRpToken(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500 font-mono"
            />
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="新密碼（至少 8 字元）"
                value={rpNewPw}
                onChange={e => setRpNewPw(e.target.value)}
                required
                minLength={8}
                className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
              />
              <button
                type="submit"
                disabled={rpLoading}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap"
              >
                {rpLoading ? '重設中…' : '重設密碼'}
              </button>
            </div>
          </form>
          {rpError && (
            <div className="bg-red-900/40 border border-red-700 rounded p-2 text-xs text-red-300">
              [{rpError.status} {rpError.code}] {rpError.message}
            </div>
          )}
          {rpSuccess && (
            <div className="bg-green-900/40 border border-green-700 rounded p-2 text-xs text-green-300">
              ✅ {rpSuccess}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
