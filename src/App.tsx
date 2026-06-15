import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import AppShell from './components/AppShell'
import { ProtectedRoute } from './components/ProtectedRoute'

// 正式產品頁（6.2）
import LoginPage from './pages/LoginPage'
import CharactersListPage from './pages/CharactersListPage'
import CharacterCreatePage from './pages/CharacterCreatePage'
import CharacterSheetPage from './pages/CharacterSheetPage'

// Phase 2 驗證頁（dev 工具，保留於 /dev/*）
import AuthPage from './pages/AuthPage'
import SrdPage from './pages/SrdPage'
import CharactersPage from './pages/CharactersPage'
import LevelUpPage from './pages/LevelUpPage'
import InventoryPage from './pages/InventoryPage'
import AdventureLogPage from './pages/AdventureLogPage'
import ErrorScenariosPage from './pages/ErrorScenariosPage'

export default function App() {
  return (
    <Routes>
      {/* 正式產品（6.2：角色卡讀/編輯 + 建角 wizard） */}
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/characters" element={<CharactersListPage />} />
          <Route path="/characters/new" element={<CharacterCreatePage />} />
          <Route path="/characters/:id" element={<CharacterSheetPage />} />
        </Route>
      </Route>

      {/* Phase 2 API 驗證頁（dev 工具，移至 /dev/*） */}
      <Route path="/dev" element={<Layout />}>
        <Route index element={<Navigate to="/dev/auth" replace />} />
        <Route path="auth" element={<AuthPage />} />
        <Route path="srd" element={<SrdPage />} />
        <Route path="characters" element={<CharactersPage />} />
        <Route path="level-up" element={<LevelUpPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="adventure-log" element={<AdventureLogPage />} />
        <Route path="errors" element={<ErrorScenariosPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/characters" replace />} />
      <Route path="*" element={<Navigate to="/characters" replace />} />
    </Routes>
  )
}
