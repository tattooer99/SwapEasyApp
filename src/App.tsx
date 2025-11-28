import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import IndexPage from './pages/IndexPage'
import AddCasePage from './pages/AddCasePage'
import SearchPage from './pages/SearchPage'
import FavoritesPage from './pages/FavoritesPage'
import NotificationsPage from './pages/NotificationsPage'
import ViewCasesPage from './pages/ViewCasesPage'
import MyCasesPage from './pages/MyCasesPage'
import EditCasePage from './pages/EditCasePage'
import UserCasesPage from './pages/UserCasesPage'
import ChatPage from './pages/ChatPage'
import ExchangeHistoryPage from './pages/ExchangeHistoryPage'

function App() {
  useEffect(() => {
    // Инициализация Telegram Web App
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      tg.expand()
    }
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/add-case" element={<AddCasePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/view-cases" element={<ViewCasesPage />} />
        <Route path="/my-cases" element={<MyCasesPage />} />
        <Route path="/edit-case/:id" element={<EditCasePage />} />
        <Route path="/user-cases/:userId" element={<UserCasesPage />} />
        <Route path="/chat/:userId" element={<ChatPage />} />
        <Route path="/exchange-history" element={<ExchangeHistoryPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

