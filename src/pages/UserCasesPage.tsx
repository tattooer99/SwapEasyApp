import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTelegram } from '../hooks/useTelegram'
import { useSupabase } from '../hooks/useSupabase'
import CaseCard from '../components/CaseCard'
import { Case, User } from '../types'
import './UserCasesPage.css'

export default function UserCasesPage() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()
  const { webApp } = useTelegram()
  const { getUserCases, likeCase, createExchangeOffer, getMyCases, getUserRating } = useSupabase()
  const [cases, setCases] = useState<Case[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCaseForExchange, setSelectedCaseForExchange] = useState<Case | null>(null)
  const [myCases, setMyCases] = useState<Case[]>([])
  const [userRating, setUserRating] = useState<{ rating: number; successful_exchanges: number } | null>(null)

  useEffect(() => {
    if (webApp?.BackButton) {
      webApp.BackButton.show()
      webApp.BackButton.onClick(() => navigate(-1))
    }

    return () => {
      if (webApp?.BackButton) {
        webApp.BackButton.hide()
      }
    }
  }, [webApp, navigate])

  useEffect(() => {
    if (userId) {
      loadUserCases()
      loadMyCases()
      loadUserRating()
    }
  }, [userId])

  const loadUserRating = async () => {
    if (!userId) return
    try {
      const rating = await getUserRating(Number(userId))
      setUserRating(rating)
    } catch (error) {
      console.error('Error loading user rating:', error)
    }
  }

  const loadUserCases = async () => {
    if (!userId) return

    try {
      setLoading(true)
      const result = await getUserCases(Number(userId))
      setCases(result.cases)
      setUser(result.user)
    } catch (error) {
      console.error('Error loading user cases:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (webApp) {
        webApp.showAlert('Помилка при завантаженні кейсів: ' + errorMessage)
      } else {
        alert('Помилка при завантаженні кейсів: ' + errorMessage)
      }
      navigate(-1)
    } finally {
      setLoading(false)
    }
  }

  const loadMyCases = async () => {
    try {
      const data = await getMyCases()
      setMyCases(data)
    } catch (error) {
      console.error('Error loading my cases:', error)
    }
  }

  const handleLike = async (caseItem: Case) => {
    try {
      await likeCase(caseItem.id, caseItem)
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.notificationOccurred('success')
      }
      if (webApp) {
        webApp.showAlert('Додано до вподобань!')
      }
    } catch (error) {
      console.error('Error liking case:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (webApp) {
        webApp.showAlert('Помилка при додаванні до вподобань: ' + errorMessage)
      } else {
        alert('Помилка при додаванні до вподобань: ' + errorMessage)
      }
    }
  }

  const handleExchange = (caseItem: Case) => {
    if (myCases.length === 0) {
      if (webApp) {
        webApp.showAlert('Спочатку додайте хоча б один кейс')
      }
      navigate('/add-case')
      return
    }
    setSelectedCaseForExchange(caseItem)
  }

  const handleSelectMyCaseForExchange = async (myCase: Case) => {
    if (!selectedCaseForExchange || !selectedCaseForExchange.owner) {
      if (webApp) {
        webApp.showAlert('Помилка: не вдалося знайти власника кейсу')
      }
      return
    }

    try {
      await createExchangeOffer(
        selectedCaseForExchange.owner.id,
        myCase.id,
        selectedCaseForExchange.id
      )
      setSelectedCaseForExchange(null)
      if (webApp) {
        webApp.HapticFeedback?.notificationOccurred('success')
        webApp.showAlert('Пропозицію обміну відправлено!')
      }
    } catch (error) {
      console.error('Error creating exchange offer:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (webApp) {
        webApp.showAlert('Помилка при створенні пропозиції: ' + errorMessage)
      } else {
        alert('Помилка при створенні пропозиції: ' + errorMessage)
      }
    }
  }

  if (loading) {
    return (
      <div className="user-cases-page">
        <div className="user-cases-page__loading">Завантаження...</div>
      </div>
    )
  }

  if (selectedCaseForExchange) {
    return (
      <div className="user-cases-page">
        <div className="user-cases-page__header">
          <h2>Виберіть ваш кейс для обміну</h2>
          <button
            className="user-cases-page__close"
            onClick={() => setSelectedCaseForExchange(null)}
          >
            ✕
          </button>
        </div>
        <div className="user-cases-page__cases">
          {myCases.length === 0 ? (
            <div className="user-cases-page__empty">
              У вас немає кейсів. <br />
              <button 
                className="user-cases-page__add-case-button"
                onClick={() => {
                  setSelectedCaseForExchange(null)
                  navigate('/add-case')
                }}
              >
                Додати кейс
              </button>
            </div>
          ) : (
            myCases.map((myCase) => (
              <div 
                key={myCase.id} 
                className="user-cases-page__case-selectable"
                onClick={() => handleSelectMyCaseForExchange(myCase)}
              >
                <CaseCard
                  case={myCase}
                  showActions={false}
                />
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="user-cases-page">
      <div className="user-cases-page__header">
        <h2>Кейси користувача</h2>
        {user && (
          <div className="user-cases-page__user-info">
            <p className="user-cases-page__user-name">👤 {user.name}</p>
            {user.region && (
              <p className="user-cases-page__user-region">📍 {user.region}</p>
            )}
            {userRating && (
              <div className="user-cases-page__user-rating">
                <span className="user-cases-page__rating-stars">
                  {'⭐'.repeat(Math.min(userRating.rating, 5))}
                </span>
                <span className="user-cases-page__rating-text">
                  Рейтинг: {userRating.rating} | Обмінів: {userRating.successful_exchanges}
                </span>
              </div>
            )}
            <button
              className="user-cases-page__chat-button"
              onClick={() => navigate(`/chat/${user.id}`)}
            >
              💬 Написати
            </button>
          </div>
        )}
      </div>

      {cases.length === 0 ? (
        <div className="user-cases-page__empty">
          У цього користувача поки немає кейсів
        </div>
      ) : (
        <div className="user-cases-page__cases">
          {cases.map((caseItem) => (
            <CaseCard
              key={caseItem.id}
              case={caseItem}
              onLike={() => handleLike(caseItem)}
              onExchange={() => handleExchange(caseItem)}
              showActions={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}

