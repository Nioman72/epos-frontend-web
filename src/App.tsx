import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'

import AuthPage from './pages/AuthPage'
import SrdPage from './pages/SrdPage'
import CharactersPage from './pages/CharactersPage'
import CharacterWizardPage from './pages/CharacterWizardPage'
import LevelUpPage from './pages/LevelUpPage'
import InventoryPage from './pages/InventoryPage'
import AdventureLogPage from './pages/AdventureLogPage'
import ErrorScenariosPage from './pages/ErrorScenariosPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/auth" replace />} />
        <Route path="auth" element={<AuthPage />} />
        <Route path="srd" element={<SrdPage />} />
        <Route path="character-wizard" element={<CharacterWizardPage />} />
        <Route path="characters" element={<CharactersPage />} />
        <Route path="level-up" element={<LevelUpPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="adventure-log" element={<AdventureLogPage />} />
        <Route path="errors" element={<ErrorScenariosPage />} />
      </Route>
    </Routes>
  )
}
