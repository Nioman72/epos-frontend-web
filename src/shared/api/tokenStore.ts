/**
 * tokenStore — 輕量記憶體 token 管理
 *
 * 刻意不使用 localStorage，配合 React Context 同步狀態。
 * Context 初始化時會把 token 寫入此 store，讓 axios interceptor 直接讀取，
 * 避免在 interceptor 裡 import React Context（循環依賴問題）。
 */

let accessToken: string | null = null
let refreshToken: string | null = null

export const tokenStore = {
  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,
  setTokens: (access: string, refresh: string) => {
    accessToken = access
    refreshToken = refresh
  },
  clearTokens: () => {
    accessToken = null
    refreshToken = null
  },
}
