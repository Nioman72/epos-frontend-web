/** 標準錯誤回應結構（對應後端 ApiException） */
export interface ApiError {
  status: number
  code: string
  message: string
  timestamp?: string
}

/** 分頁回應包裝 */
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
