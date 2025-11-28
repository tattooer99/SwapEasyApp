import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../hooks/useTelegram'
import { useSupabase } from '../hooks/useSupabase'
import CaseCard from '../components/CaseCard'
import { ExchangeOffer, MutualLikeNotification, Case } from '../types'
import './NotificationsPage.css'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { webApp } = useTelegram()
  const { currentUser, getNotifications, respondToExchangeOffer } = useSupabase()
  const [notifications, setNotifications] = useState<{
    mutualLikes: MutualLikeNotification[]
    exchangeOffers: ExchangeOffer[]
  }>({ mutualLikes: [], exchangeOffers: [] })
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
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const data = await getNotifications()
      setNotifications(data)
    } catch (error) {
      console.error('Error loading notifications:', error)
      if (webApp) {
        webApp.showAlert('Помилка при завантаженні сповіщень')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRespondToOffer = async (offerId: number, status: 'accepted' | 'declined') => {
    try {
      await respondToExchangeOffer(offerId, status)
      await loadNotifications()
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.notificationOccurred('success')
      }
      if (webApp) {
        webApp.showAlert(status === 'accepted' ? 'Обмін прийнято!' : 'Обмін відхилено')
      }
    } catch (error) {
      console.error('Error responding to offer:', error)
      if (webApp) {
        webApp.showAlert('Помилка при відповіді на пропозицію')
      }
    }
  }

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="notifications-page__loading">Завантаження...</div>
      </div>
    )
  }

  const hasNotifications = notifications.mutualLikes.length > 0 || notifications.exchangeOffers.length > 0

  return (
    <div className="notifications-page">
      <h2 className="notifications-page__title">Сповіщення</h2>

      {!hasNotifications && (
        <div className="notifications-page__empty">
          У вас немає нових сповіщень
        </div>
      )}

      {notifications.mutualLikes.length > 0 && (
        <div className="notifications-page__section">
          <h3 className="notifications-page__section-title">Взаємні вподобання</h3>
          {notifications.mutualLikes.map((notification) => {
            const otherUser = notification.user1_id === currentUser?.id ? notification.user2 : notification.user1
            const otherItem = notification.user1_id === currentUser?.id ? notification.user2_item : notification.user1_item
            const myItem = notification.user1_id === currentUser?.id ? notification.user1_item : notification.user2_item

            if (!otherUser || !otherItem || !myItem) return null

            return (
              <div key={notification.id} className="notifications-page__notification">
                <div className="notifications-page__notification-header">
                  <span>💕 Взаємний лайк з {otherUser.name}!</span>
                </div>
                <div className="notifications-page__notification-content">
                  <div className="notifications-page__notification-item">
                    <p className="notifications-page__notification-label">Ваш кейс:</p>
                    <CaseCard case={myItem as Case} showActions={false} />
                  </div>
                  <div className="notifications-page__notification-item">
                    <p className="notifications-page__notification-label">Їхній кейс:</p>
                    <CaseCard 
                      case={otherItem as Case} 
                      showActions={false}
                      onViewUser={() => {
                        if (otherUser?.id) {
                          navigate(`/user-cases/${otherUser.id}`)
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="notifications-page__notification-actions">
                  <button
                    className="notifications-page__action-button"
                    onClick={() => {
                      // Navigate to exchange offer creation
                      navigate('/search')
                    }}
                  >
                    Запропонувати обмін
                  </button>
                  <button
                    className="notifications-page__action-button notifications-page__action-button--chat"
                    onClick={() => {
                      if (otherUser?.id) {
                        navigate(`/chat/${otherUser.id}`)
                      }
                    }}
                  >
                    💬 Написати
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {notifications.exchangeOffers.length > 0 && (
        <div className="notifications-page__section">
          <h3 className="notifications-page__section-title">Пропозиції обміну</h3>
          {notifications.exchangeOffers.map((offer) => {
            if (!offer.offered_item || !offer.requested_item || !offer.from_user) return null

            return (
              <div key={offer.id} className="notifications-page__notification">
                <div className="notifications-page__notification-header">
                  <span>💬 {offer.from_user.name} пропонує обмін</span>
                </div>
                <div className="notifications-page__notification-content">
                  <div className="notifications-page__notification-item">
                    <p className="notifications-page__notification-label">Вони пропонують:</p>
                    <CaseCard 
                      case={offer.offered_item as Case} 
                      showActions={false}
                      onViewUser={() => {
                        if (offer.from_user?.id) {
                          navigate(`/user-cases/${offer.from_user.id}`)
                        }
                      }}
                    />
                  </div>
                  <div className="notifications-page__notification-item">
                    <p className="notifications-page__notification-label">Вони хочуть ваш:</p>
                    <CaseCard case={offer.requested_item as Case} showActions={false} />
                  </div>
                </div>
                <div className="notifications-page__notification-actions">
                  <button
                    className="notifications-page__action-button notifications-page__action-button--accept"
                    onClick={() => handleRespondToOffer(offer.id, 'accepted')}
                  >
                    ✅ Прийняти
                  </button>
                  <button
                    className="notifications-page__action-button notifications-page__action-button--decline"
                    onClick={() => handleRespondToOffer(offer.id, 'declined')}
                  >
                    ❌ Відхилити
                  </button>
                  <button
                    className="notifications-page__action-button notifications-page__action-button--chat"
                    onClick={() => {
                      if (offer.from_user?.id) {
                        navigate(`/chat/${offer.from_user.id}`)
                      }
                    }}
                  >
                    💬 Написати
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

