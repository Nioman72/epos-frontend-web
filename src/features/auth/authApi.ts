import { apiClient } from '@/shared/api/client'
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/features/auth/types'

const BASE = '/api/v1/auth'

export const authApi = {
  register: (body: RegisterRequest) =>
    apiClient.post<AuthResponse>(`${BASE}/register`, body).then((r) => r.data),

  login: (body: LoginRequest) =>
    apiClient.post<AuthResponse>(`${BASE}/login`, body).then((r) => r.data),

  guestLogin: () =>
    apiClient.post<AuthResponse>(`${BASE}/guest`).then((r) => r.data),

  /** 手動觸發 refresh（驗證工具用） */
  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>(`${BASE}/refresh`, { refreshToken }).then((r) => r.data),

  logout: (refreshToken: string) =>
    apiClient.post(`${BASE}/logout`, { refreshToken }),

  /** 發送密碼重設信（202 regardless of email existence） */
  forgotPassword: (email: string) =>
    apiClient.post(`${BASE}/forgot-password`, { email }),

  /** 以重設 Token 設定新密碼（204 No Content） */
  resetPassword: (token: string, newPassword: string) =>
    apiClient.post(`${BASE}/reset-password`, { token, newPassword }),
}
