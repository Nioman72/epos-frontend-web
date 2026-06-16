import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/dev/Layout'
import AppShell from '@/features/shell/AppShell'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'

// 正式產品頁（6.2）
import LoginPage from '@/features/auth/LoginPage'
import RegisterPage from '@/features/auth/RegisterPage'
import CharactersListPage from '@/features/characters/CharactersListPage'
import CharacterCreatePage from '@/features/characters/CharacterCreatePage'
import CharacterSheetPage from '@/features/characters/CharacterSheetPage'

// Phase 2 驗證頁（dev 工具，保留於 /dev/*）
import AuthPage from '@/dev/AuthPage'
import SrdPage from '@/dev/SrdPage'
import CharactersPage from '@/dev/CharactersPage'
import LevelUpPage from '@/dev/LevelUpPage'
import InventoryPage from '@/dev/InventoryPage'
import AdventureLogPage from '@/dev/AdventureLogPage'
import ErrorScenariosPage from '@/dev/ErrorScenariosPage'

export default function App() {
  return (
    <Routes>
      {/* 正式產品（6.2：角色卡讀/編輯 + 建角 wizard） */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
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
