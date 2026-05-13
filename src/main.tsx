import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RequestLogProvider } from './context/RequestLogContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RequestLogProvider>
          <App />
        </RequestLogProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
