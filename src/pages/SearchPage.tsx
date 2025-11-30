import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../hooks/useTelegram'
import { useSupabase } from '../hooks/useSupabase'
import CaseCard from '../components/CaseCard'
import { Case } from '../types'
import { safeBackButtonShow, safeBackButtonHide } from '../utils/telegram'
import './SearchPage.css'

export default function SearchPage() {
  const navigate = useNavigate()
  const { webApp } = useTelegram()
  const { searchCases, likeCase, createExchangeOffer, getMyCases } = useSupabase()
  const [cases, setCases] = useState<Case[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedCaseForExchange, setSelectedCaseForExchange] = useState<Case | null>(null)
  const [myCases, setMyCases] = useState<Case[]>([])

  useEffect(() => {
    if (webApp) {
      safeBackButtonShow(webApp, () => navigate('/'))
    }

    return () => {
      if (webApp) {
        safeBackButtonHide(webApp)
      }
    }
  }, [webApp, navigate])

  useEffect(() => {
    loadCases()
    loadMyCases()
  }, [])

  const loadCases = async () => {
    try {
      setLoading(true)
      console.log('SearchPage: starting to load cases...')
      const data = await searchCases()
      console.log('SearchPage: received cases:', data.length, data)
      setCases(data)
      setCurrentIndex(0)
      if (data.length === 0) {
        console.warn('SearchPage: no cases found!')
      }
    } catch (error) {
      console.error('Error loading cases:', error)
      if (webApp) {
        webApp.showAlert('Помилка при завантаженні кейсів: ' + (error as Error).message)
      }
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

  const handleLike = async () => {
    const currentCase = cases[currentIndex]
    if (!currentCase) return

    try {
      await likeCase(currentCase.id, currentCase)
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.notificationOccurred('success')
      }
      if (webApp) {
        webApp.showAlert('Додано до вподобань!')
      }
      // Переходим к следующему кейсу
      goToNext()
    } catch (error) {
      console.error('Error liking case:', error)
      if (webApp) {
        webApp.showAlert('Помилка при додаванні до вподобань')
      }
    }
  }

  const handleSkip = () => {
    goToNext()
  }

  const goToNext = () => {
    if (currentIndex < cases.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // Все кейсы просмотрены
      if (webApp) {
        webApp.showAlert('Більше кейсів немає. Спробуйте пізніше або додайте інтереси для кращого пошуку.')
      }
      navigate('/')
    }
  }

  const handleExchange = () => {
    const currentCase = cases[currentIndex]
    if (!currentCase) return

    if (myCases.length === 0) {
      if (webApp) {
        webApp.showAlert('Спочатку додайте хоча б один кейс')
      }
      navigate('/add-case')
      return
    }
    setSelectedCaseForExchange(currentCase)
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
      // Переходим к следующему кейсу
      goToNext()
    } catch (error) {
      console.error('Error creating exchange offer:', error)
      if (webApp) {
        webApp.showAlert('Помилка при створенні пропозиції')
      }
    }
  }

  const handleViewUserCases = () => {
    const currentCase = cases[currentIndex]
    if (!currentCase?.owner?.id) return
    navigate(`/user-cases/${currentCase.owner.id}`)
  }

  const handleStopSearch = () => {
    navigate('/')
  }

  if (loading) {
    return (
      <div className="search-page">
        <div className="search-page__loading">Завантаження...</div>
      </div>
    )
  }

  if (selectedCaseForExchange) {
    return (
      <div className="search-page">
        <div className="search-page__header">
          <h2>Виберіть ваш кейс для обміну</h2>
          <button
            className="search-page__close"
            onClick={() => setSelectedCaseForExchange(null)}
          >
            ✕
          </button>
        </div>
        <div className="search-page__cases">
          {myCases.length === 0 ? (
            <div className="search-page__empty">
              У вас немає кейсів. <br />
              <button 
                className="search-page__add-case-button"
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
                className="search-page__case-selectable"
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

  const currentCase = cases[currentIndex]

  if (!currentCase) {
    return (
      <div className="search-page">
        <div className="search-page__empty">
          <p>Кейси не знайдено.</p>
          <p>Додайте інтереси для кращого пошуку або спробуйте пізніше.</p>
          <button 
            className="search-page__button"
            onClick={() => navigate('/')}
          >
            На головну
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="search-page">
      <div className="search-page__header">
        <h2>Пошук кейсів</h2>
        <div className="search-page__counter">
          {currentIndex + 1} / {cases.length}
        </div>
      </div>

      <div className="search-page__current-case">
        <CaseCard
          case={currentCase}
          showActions={false}
          onViewUser={handleViewUserCases}
        />
      </div>

      <div className="search-page__actions">
        <button
          className="search-page__action-button search-page__action-button--like"
          onClick={handleLike}
        >
          ❤️ Вподобати
        </button>
        <button
          className="search-page__action-button search-page__action-button--skip"
          onClick={handleSkip}
        >
          👎 Пропустити
        </button>
        <button
          className="search-page__action-button search-page__action-button--exchange"
          onClick={handleExchange}
        >
          🤝 Запропонувати обмін
        </button>
        <button
          className="search-page__action-button search-page__action-button--view"
          onClick={handleViewUserCases}
        >
          📋 Кейси користувача
        </button>
        <button
          className="search-page__action-button search-page__action-button--stop"
          onClick={handleStopSearch}
        >
          🛑 Завершити пошук
        </button>
      </div>
    </div>
  )
}
