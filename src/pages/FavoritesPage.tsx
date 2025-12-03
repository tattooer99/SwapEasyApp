import { useState, useEffect, useRef } from 'react'
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
  const { getLikedCases, unlikeCase, currentUser, loading: userLoading } = useSupabase()
  const [likedCases, setLikedCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingCaseId, setDeletingCaseId] = useState<number | null>(null)
  const loadingRef = useRef(false)

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

    // Предотвращаем множественные одновременные запросы
    if (loadingRef.current) {
      return
    }

    // Загружаем данные
    const loadData = async () => {
      if (loadingRef.current) return
      loadingRef.current = true

      try {
        setLoading(true)
        const data = await getLikedCases()
        setLikedCases(data)
      } catch (error) {
        console.error('Error loading data:', error)
        if (webApp) {
          webApp.showAlert('Помилка при завантаженні даних')
        }
      } finally {
        setLoading(false)
        loadingRef.current = false
      }
    }

    loadData()
    // Убираем getLikedCases и webApp из зависимостей, чтобы избежать бесконечного цикла
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, userLoading, currentUser?.id])

  const handleDelete = async (caseId: number) => {
    if (deletingCaseId !== null) return

    try {
      setDeletingCaseId(caseId)
      await unlikeCase(caseId)
      
      // Обновляем список, удаляя удаленный кейс
      setLikedCases(prev => prev.filter(c => c.id !== caseId))
      
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.notificationOccurred('success')
      }
      if (webApp) {
        webApp.showAlert('Видалено з вподобань')
      }
    } catch (error) {
      console.error('Error removing from favorites:', error)
      if (webApp) {
        webApp.showAlert('Помилка при видаленні з вподобань')
      }
    } finally {
      setDeletingCaseId(null)
    }
  }

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
            <div key={caseItem.id} className="favorites-page__case-wrapper">
              <CaseCard 
                case={caseItem} 
                showActions={false}
                onViewUser={() => {
                  if (caseItem.owner?.id) {
                    navigate(`/user-cases/${caseItem.owner.id}`)
                  }
                }}
              />
              <div className="favorites-page__case-actions">
                {caseItem.owner?.id && (
                  <button
                    className="favorites-page__view-user-button"
                    onClick={() => {
                      if (caseItem.owner?.id) {
                        navigate(`/user-cases/${caseItem.owner.id}`)
                      }
                    }}
                    aria-label="Переглянути всі кейси користувача"
                  >
                    👤 Всі кейси користувача
                  </button>
                )}
                <button
                  className="favorites-page__delete-case-button"
                  onClick={() => handleDelete(caseItem.id)}
                  disabled={deletingCaseId === caseItem.id}
                  aria-label="Видалити з вподобань"
                >
                  {deletingCaseId === caseItem.id ? '...' : '🗑️ Видалити'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

