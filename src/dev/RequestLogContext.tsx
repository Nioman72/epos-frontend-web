import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { apiClient } from '@/shared/api/client'
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios'

// ── 型別 ──────────────────────────────────────────────────────────────────────

export interface RequestLogEntry {
  id: string
  timestamp: string
  method: string
  url: string
  requestBody?: unknown
  requestHeaders?: Record<string, string>
  status?: number
  responseBody?: unknown
  durationMs?: number
  error?: string
}

interface RequestLogContextValue {
  logs: RequestLogEntry[]
  clearLogs: () => void
}

const RequestLogContext = createContext<RequestLogContextValue | null>(null)

const MAX_LOGS = 50

// ── Provider ──────────────────────────────────────────────────────────────────

export function RequestLogProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<RequestLogEntry[]>([])

  const addLog = useCallback((entry: RequestLogEntry) => {
    setLogs((prev) => [entry, ...prev].slice(0, MAX_LOGS))
  }, [])

  const updateLog = useCallback((id: string, patch: Partial<RequestLogEntry>) => {
    setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }, [])

  const clearLogs = useCallback(() => setLogs([]), [])

  // 掛 axios interceptor
  useEffect(() => {
    const pendingTimestamps = new Map<string, number>()

    const reqId = apiClient.interceptors.request.use((config: InternalAxiosRequestConfig & { _logId?: string }) => {
      const logId = crypto.randomUUID()
      config._logId = logId
      pendingTimestamps.set(logId, Date.now())

      addLog({
        id: logId,
        timestamp: new Date().toISOString(),
        method: (config.method ?? 'GET').toUpperCase(),
        url: (config.baseURL ?? '') + (config.url ?? ''),
        requestBody: config.data
          ? typeof config.data === 'string'
            ? (() => { try { return JSON.parse(config.data) } catch { return config.data } })()
            : config.data
          : undefined,
        requestHeaders: config.headers as Record<string, string>,
      })

      return config
    })

    const resId = apiClient.interceptors.response.use(
      (response: AxiosResponse & { config: { _logId?: string } }) => {
        const logId = response.config._logId
        if (logId) {
          const start = pendingTimestamps.get(logId)
          updateLog(logId, {
            status: response.status,
            responseBody: response.data,
            durationMs: start ? Date.now() - start : undefined,
          })
          pendingTimestamps.delete(logId)
        }
        return response
      },
      (error) => {
        const logId = error.config?._logId
        if (logId) {
          const start = pendingTimestamps.get(logId)
          updateLog(logId, {
            status: error.response?.status,
            responseBody: error.response?.data,
            durationMs: start ? Date.now() - start : undefined,
            error: error.message,
          })
          pendingTimestamps.delete(logId)
        }
        return Promise.reject(error)
      }
    )

    return () => {
      apiClient.interceptors.request.eject(reqId)
      apiClient.interceptors.response.eject(resId)
    }
  }, [addLog, updateLog])

  return (
    <RequestLogContext.Provider value={{ logs, clearLogs }}>
      {children}
    </RequestLogContext.Provider>
  )
}

export function useRequestLog() {
  const ctx = useContext(RequestLogContext)
  if (!ctx) throw new Error('useRequestLog must be used within RequestLogProvider')
  return ctx
}
