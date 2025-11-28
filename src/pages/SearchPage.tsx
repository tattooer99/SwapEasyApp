import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../hooks/useTelegram'
import { useSupabase } from '../hooks/useSupabase'
import CaseCard from '../components/CaseCard'
import { ITEM_TYPES, REGIONS, Case } from '../types'
import './SearchPage.css'

export default function SearchPage() {
  const navigate = useNavigate()
  const { webApp } = useTelegram()
  const { searchCases, likeCase, createExchangeOffer, getMyCases } = useSupabase()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<{
    item_type?: string
    region?: string
  }>({})
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCaseForExchange, setSelectedCaseForExchange] = useState<Case | null>(null)
  const [myCases, setMyCases] = useState<Case[]>([])

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
    loadCases()
    loadMyCases()
  }, [filters])

  const loadCases = async () => {
    try {
      setLoading(true)
      const data = await searchCases(filters)
      setCases(data)
    } catch (error) {
      console.error('Error loading cases:', error)
      if (webApp) {
        webApp.showAlert('Помилка при завантаженні кейсів')
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
      if (webApp) {
        webApp.showAlert('Помилка при додаванні до вподобань')
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
      // Reload cases to update UI
      await loadCases()
    } catch (error) {
      console.error('Error creating exchange offer:', error)
      if (webApp) {
        webApp.showAlert('Помилка при створенні пропозиції')
      }
    }
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

  return (
    <div className="search-page">
      <div className="search-page__header">
        <h2>Пошук кейсів</h2>
        <button
          className="search-page__filter-button"
          onClick={() => setShowFilters(!showFilters)}
        >
          🔍 Фільтри
        </button>
      </div>

      {showFilters && (
        <div className="search-page__filters">
          <div className="search-page__filter-group">
            <label>Категорія:</label>
            <select
              value={filters.item_type || ''}
              onChange={(e) => setFilters({ ...filters, item_type: e.target.value || undefined })}
              className="search-page__select"
            >
              <option value="">Всі</option>
              {ITEM_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.emoji} {type.value}
                </option>
              ))}
            </select>
          </div>

          <div className="search-page__filter-group">
            <label>Регіон:</label>
            <select
              value={filters.region || ''}
              onChange={(e) => setFilters({ ...filters, region: e.target.value || undefined })}
              className="search-page__select"
            >
              <option value="">Всі</option>
              {REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="search-page__cases">
        {cases.length === 0 ? (
          <div className="search-page__empty">
            Кейси не знайдено. Спробуйте змінити фільтри.
          </div>
        ) : (
          cases.map((caseItem) => (
            <CaseCard
              key={caseItem.id}
              case={caseItem}
              onLike={() => handleLike(caseItem)}
              onExchange={() => handleExchange(caseItem)}
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

