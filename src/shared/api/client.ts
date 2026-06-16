import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { tokenStore } from '@/shared/api/tokenStore'
import type { AuthResponse } from '@/features/auth/types'
import type { ApiError } from '@/shared/types/api'

// ── axios instance ────────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

// ── Request interceptor：注入 Bearer token ────────────────────────────────────
// Auth 端點不帶 token：避免 Spring Security JWT filter 在 login/register
// 時因舊 token 無效而直接回傳 401，導致請求根本進不到 controller

const AUTH_PREFIX = '/api/v1/auth/'

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken()
  const isAuthEndpoint = config.url?.includes(AUTH_PREFIX)
  if (token && !isAuthEndpoint) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── 401 auto-refresh 機制 ─────────────────────────────────────────────────────

let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

/** 把 pending requests 全部用新 token 重試 */
function flushQueue(newToken: string) {
  pendingQueue.forEach(({ resolve }) => resolve(newToken))
  pendingQueue = []
}

/** 把 pending requests 全部以錯誤中止 */
function rejectQueue(err: unknown) {
  pendingQueue.forEach(({ reject }) => reject(err))
  pendingQueue = []
}

/** 讓外部（AuthContext）能設定 logout callback，避免循環依賴 */
let onForceLogout: (() => void) | null = null
export function setForceLogoutCallback(cb: () => void) {
  onForceLogout = cb
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // 只對「需要認證的端點」做 auto-refresh
    // Auth 端點的 401 = 帳密錯誤 / token 已失效，直接回傳錯誤即可
    const isAuthEndpoint = originalRequest.url?.includes(AUTH_PREFIX)
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isAuthEndpoint
    ) {
      return Promise.reject(normalizeError(error))
    }

    const refreshToken = tokenStore.getRefreshToken()
    if (!refreshToken) {
      onForceLogout?.()
      return Promise.reject(normalizeError(error))
    }

    if (isRefreshing) {
      // 有其他請求已在 refresh，加入等待隊列
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      })
    }

    // 啟動 refresh
    isRefreshing = true
    originalRequest._retry = true

    try {
      const { data } = await axios.post<AuthResponse>(
        `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'}/api/v1/auth/refresh`,
        { refreshToken }
      )

      tokenStore.setTokens(data.accessToken, data.refreshToken)
      flushQueue(data.accessToken)

      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      rejectQueue(refreshError)
      tokenStore.clearTokens()
      onForceLogout?.()
      return Promise.reject(normalizeError(refreshError as AxiosError))
    } finally {
      isRefreshing = false
    }
  }
)

// ── Error normalization ───────────────────────────────────────────────────────

export function normalizeError(error: AxiosError | unknown): ApiError {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as Partial<ApiError>
    return {
      status: error.response.status,
      code: data.code ?? 'UNKNOWN',
      message: data.message ?? error.message,
    }
  }
  return {
    status: 0,
    code: 'NETWORK_ERROR',
    message: error instanceof Error ? error.message : 'Network error',
  }
}
