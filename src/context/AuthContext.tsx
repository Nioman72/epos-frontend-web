import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { authApi } from '../api/authApi'
import { tokenStore } from '../api/tokenStore'
import { setForceLogoutCallback } from '../api/client'
import type { AuthState, AuthUser, LoginRequest, RegisterRequest } from '../types/auth'

// ── Context 型別 ──────────────────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
  login: (req: LoginRequest) => Promise<void>
  register: (req: RegisterRequest) => Promise<void>
  guestLogin: () => Promise<void>
  logout: () => Promise<void>
  /** 手動觸發 refresh（驗證工具用） */
  manualRefresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ── Token 持久化（sessionStorage，關分頁即清除）────────────────────────────────

const STORAGE_KEY = 'epos_session'

function loadSession(): { accessToken: string; refreshToken: string; user: AuthUser } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveSession(accessToken: string, refreshToken: string, user: AuthUser) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken, refreshToken, user }))
}

function clearSession() {
  sessionStorage.removeItem(STORAGE_KEY)
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const saved = loadSession()
    if (saved) {
      tokenStore.setTokens(saved.accessToken, saved.refreshToken)
      return {
        user: saved.user,
        accessToken: saved.accessToken,
        refreshToken: saved.refreshToken,
        isAuthenticated: true,
        isGuest: saved.user.role === 'GUEST',
      }
    }
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isGuest: false,
    }
  })

  // 強制登出 callback（給 axios interceptor 用）
  const forceLogout = useCallback(() => {
    tokenStore.clearTokens()
    clearSession()
    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isGuest: false,
    })
  }, [])

  useEffect(() => {
    setForceLogoutCallback(forceLogout)
  }, [forceLogout])

  // ── helpers ────────────────────────────────────────────────────────────────

  function applyAuthResponse(
    accessToken: string,
    refreshToken: string,
    userId: string,
    email: string,
    role: string
  ) {
    const user: AuthUser = { userId, email, role: role as AuthUser['role'] }
    tokenStore.setTokens(accessToken, refreshToken)
    saveSession(accessToken, refreshToken, user)
    setState({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isGuest: role === 'GUEST',
    })
  }

  // ── actions ────────────────────────────────────────────────────────────────

  const login = async (req: LoginRequest) => {
    const data = await authApi.login(req)
    applyAuthResponse(data.accessToken, data.refreshToken, data.userId, data.email, data.role)
  }

  const register = async (req: RegisterRequest) => {
    const data = await authApi.register(req)
    applyAuthResponse(data.accessToken, data.refreshToken, data.userId, data.email, data.role)
  }

  const guestLogin = async () => {
    const data = await authApi.guestLogin()
    applyAuthResponse(data.accessToken, data.refreshToken, data.userId, data.email, data.role)
  }

  const logout = async () => {
    if (state.refreshToken) {
      try {
        await authApi.logout(state.refreshToken)
      } catch {
        // 即使後端失敗也要清除本地狀態
      }
    }
    forceLogout()
  }

  const manualRefresh = async () => {
    if (!state.refreshToken) throw new Error('No refresh token')
    const data = await authApi.refresh(state.refreshToken)
    applyAuthResponse(data.accessToken, data.refreshToken, data.userId, data.email, data.role)
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, guestLogin, logout, manualRefresh }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
