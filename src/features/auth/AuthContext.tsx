/* eslint-disable react-refresh/only-export-components -- context 的 useAuth hook 與 Provider 同檔為慣例 */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { authApi } from '@/features/auth/authApi'
import { tokenStore } from '@/shared/api/tokenStore'
import { setForceLogoutCallback } from '@/shared/api/client'
import type { AuthState, AuthUser, AuthResponse, LoginRequest, RegisterRequest } from '@/features/auth/types'

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

  // 後端 auth 回應為 isAdmin（非 role）；role 由此推導：guest 端點 → GUEST，
  // 否則 isAdmin ? ADMIN : PLAYER。（DM 為 campaign 層級角色，非 user 層級，故不在此。）
  function applyAuthResponse(data: AuthResponse, roleOverride?: AuthUser['role']) {
    const role: AuthUser['role'] = roleOverride ?? (data.isAdmin ? 'ADMIN' : 'PLAYER')
    const user: AuthUser = { userId: data.userId, email: data.email, role }
    tokenStore.setTokens(data.accessToken, data.refreshToken)
    saveSession(data.accessToken, data.refreshToken, user)
    setState({
      user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      isAuthenticated: true,
      isGuest: role === 'GUEST',
    })
  }

  // ── actions ────────────────────────────────────────────────────────────────

  const login = async (req: LoginRequest) => {
    applyAuthResponse(await authApi.login(req))
  }

  const register = async (req: RegisterRequest) => {
    applyAuthResponse(await authApi.register(req))
  }

  const guestLogin = async () => {
    applyAuthResponse(await authApi.guestLogin(), 'GUEST')
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
    // refresh 回應同樣只帶 isAdmin；保持現有 role（避免 guest 被誤推為 PLAYER）
    applyAuthResponse(await authApi.refresh(state.refreshToken), state.user?.role)
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
