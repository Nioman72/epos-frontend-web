import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/features/auth/AuthContext'
import { RequestLogProvider } from '@/dev/RequestLogContext'
import App from '@/App'
import './index.css'

// react-query：Web 正式產品走伺服器快取直接 API（6.2，不複製 mobile SQLite local-first）
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RequestLogProvider>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </RequestLogProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
