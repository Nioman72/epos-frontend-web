export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface AuthUser {
  userId: string
  email: string
  role: 'PLAYER' | 'DM' | 'ADMIN' | 'GUEST'
}

export interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isGuest: boolean
}

export interface RegisterRequest {
  email: string
  password: string
  username: string
}

export interface LoginRequest {
  email: string
  password: string
}

// 對齊後端 auth 回應：回 isAdmin（boolean），非 role。role 由 AuthContext 推導。
export interface AuthResponse {
  accessToken: string
  refreshToken: string
  userId: string
  email: string
  isAdmin: boolean
  accessTokenExpiresInMs?: number
}
