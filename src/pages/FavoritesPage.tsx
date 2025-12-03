import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTelegram } from '../hooks/useTelegram'
import { useSupabase } from '../hooks/useSupabase'
import CaseCard from '../components/CaseCard'
import { Case } from '../types'
import './FavoritesPage.css'

export default function FavoritesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { webApp } = useTelegram()
  const { getLikedCases, currentUser, loading: userLoading } = useSupabase()
  const [likedCases, setLikedCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (webApp?.BackButton) {
      webApp.BackButton.show()
      webApp.BackButton.onClick(() => navigate('/'))
    }

    return () => {
      if (webApp?.BackButton) {
        webApp.BackButton.hide()
      }
    }
  }, [webApp, navigate])

  useEffect(() => {
    // Ждем загрузки пользователя перед загрузкой данных
    if (userLoading) {
      return // Пока загружается пользователь, ничего не делаем
    }

    if (!currentUser) {
      // Если пользователь не загружен и загрузка завершена, значит пользователь не найден
      setLoading(false)
      setLikedCases([])
      return
    }

    // Загружаем данные
    const loadData = async () => {
      try {
        setLoading(true)
        console.log('FavoritesPage: loading liked cases for user:', currentUser.id)
        const data = await getLikedCases()
        console.log('FavoritesPage: received liked cases:', data.length)
        setLikedCases(data)
      } catch (error) {
        console.error('Error loading data:', error)
        if (webApp) {
          webApp.showAlert('Помилка при завантаженні даних')
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [location.pathname, userLoading, currentUser, getLikedCases, webApp])

  if (loading) {
    return (
      <div className="favorites-page">
        <div className="favorites-page__loading">Завантаження...</div>
      </div>
    )
  }

  return (
    <div className="favorites-page">
      <h2 className="favorites-page__title">Вподобання</h2>
      
      <div className="favorites-page__content">
        {likedCases.length === 0 ? (
          <div className="favorites-page__empty">
            У вас поки немає вподобаних кейсів
          </div>
        ) : (
          likedCases.map((caseItem) => (
            <CaseCard 
              key={caseItem.id} 
              case={caseItem} 
              showActions={false}
              onViewUser={() => {
                if (caseItem.owner?.id) {
                  navigate(`/user-cases/${caseItem.owner.id}`)
                }
              }}
            />
          ))
        )}
      </div>
    </div>
  )
}

