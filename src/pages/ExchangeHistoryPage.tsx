import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../hooks/useTelegram'
import { useSupabase } from '../hooks/useSupabase'
import CaseCard from '../components/CaseCard'
import { ExchangeOffer, Case } from '../types'
import './ExchangeHistoryPage.css'

export default function ExchangeHistoryPage() {
  const navigate = useNavigate()
  const { webApp } = useTelegram()
  const { currentUser, getExchangeHistory } = useSupabase()
  const [exchanges, setExchanges] = useState<ExchangeOffer[]>([])
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
    loadExchangeHistory()
  }, [currentUser])

  const loadExchangeHistory = async () => {
    try {
      setLoading(true)
      const data = await getExchangeHistory()
      setExchanges(data)
    } catch (error) {
      console.error('Error loading exchange history:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (webApp) {
        webApp.showAlert('Помилка при завантаженні історії обмінів: ' + errorMessage)
      } else {
        alert('Помилка при завантаженні історії обмінів: ' + errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp?: string) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="exchange-history-page">
        <div className="exchange-history-page__loading">Завантаження...</div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="exchange-history-page">
        <div className="exchange-history-page__empty">
          <p>Будь ласка, увійдіть або налаштуйте Supabase.</p>
          <button className="exchange-history-page__button" onClick={() => navigate('/')}>
            На головну
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="exchange-history-page">
      <h2 className="exchange-history-page__title">Історія обмінів</h2>

      {exchanges.length === 0 ? (
        <div className="exchange-history-page__empty">
          <p>У вас поки немає завершених обмінів</p>
          <p className="exchange-history-page__hint">
            Після прийняття пропозиції обміну вона з'явиться тут
          </p>
        </div>
      ) : (
        <div className="exchange-history-page__list">
          {exchanges.map((exchange) => {
            const isFromMe = exchange.from_user_id === currentUser.id
            const otherUser = isFromMe ? exchange.to_user : exchange.from_user
            const myItem = isFromMe ? exchange.offered_item : exchange.requested_item
            const otherItem = isFromMe ? exchange.requested_item : exchange.offered_item

            if (!otherUser || !myItem || !otherItem) return null

            return (
              <div key={exchange.id} className="exchange-history-page__exchange">
                <div className="exchange-history-page__exchange-header">
                  <div className="exchange-history-page__exchange-info">
                    <span className="exchange-history-page__exchange-user">
                      {isFromMe ? 'Ви обмінялися з' : 'Обмін з'} {otherUser.name}
                    </span>
                    <span className="exchange-history-page__exchange-date">
                      {formatDate(exchange.created_at)}
                    </span>
                  </div>
                  <div className="exchange-history-page__exchange-badge">
                    ✅ Завершено
                  </div>
                </div>

                <div className="exchange-history-page__exchange-content">
                  <div className="exchange-history-page__exchange-item">
                    <p className="exchange-history-page__exchange-label">
                      {isFromMe ? 'Ви віддали:' : 'Вони віддали:'}
                    </p>
                    <CaseCard
                      case={isFromMe ? (myItem as Case) : (otherItem as Case)}
                      showActions={false}
                      onViewUser={() => {
                        if (otherUser.id) {
                          navigate(`/user-cases/${otherUser.id}`)
                        }
                      }}
                    />
                  </div>

                  <div className="exchange-history-page__exchange-arrow">⇄</div>

                  <div className="exchange-history-page__exchange-item">
                    <p className="exchange-history-page__exchange-label">
                      {isFromMe ? 'Ви отримали:' : 'Вони отримали:'}
                    </p>
                    <CaseCard
                      case={isFromMe ? (otherItem as Case) : (myItem as Case)}
                      showActions={false}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

