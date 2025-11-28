import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../hooks/useTelegram'
import { useSupabase } from '../hooks/useSupabase'
import CaseCard from '../components/CaseCard'
import { Case, Interest, ITEM_TYPES, PRICE_CATEGORIES } from '../types'
import './FavoritesPage.css'

export default function FavoritesPage() {
  const navigate = useNavigate()
  const { webApp } = useTelegram()
  const { getLikedCases, getInterests, addInterest, deleteInterest } = useSupabase()
  const [activeTab, setActiveTab] = useState<'liked' | 'interests'>('liked')
  const [likedCases, setLikedCases] = useState<Case[]>([])
  const [interests, setInterests] = useState<Interest[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddInterest, setShowAddInterest] = useState(false)
  const [newInterest, setNewInterest] = useState<{
    item_type: string
    price_category: string
  } | null>(null)

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
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      if (activeTab === 'liked') {
        const data = await getLikedCases()
        setLikedCases(data)
      } else {
        const data = await getInterests()
        setInterests(data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      if (webApp) {
        webApp.showAlert('Помилка при завантаженні даних')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddInterest = async () => {
    if (!newInterest?.item_type || !newInterest?.price_category) {
      if (webApp) {
        webApp.showAlert('Виберіть тип та цінову категорію')
      }
      return
    }

    try {
      await addInterest(newInterest.item_type, newInterest.price_category)
      setNewInterest(null)
      setShowAddInterest(false)
      await loadData()
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.notificationOccurred('success')
      }
    } catch (error) {
      console.error('Error adding interest:', error)
      if (webApp) {
        webApp.showAlert('Помилка при додаванні інтересу')
      }
    }
  }

  const handleDeleteInterest = async (interestId: number) => {
    try {
      await deleteInterest(interestId)
      await loadData()
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.notificationOccurred('success')
      }
    } catch (error) {
      console.error('Error deleting interest:', error)
      if (webApp) {
        webApp.showAlert('Помилка при видаленні інтересу')
      }
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
      <div className="favorites-page__tabs">
        <button
          className={`favorites-page__tab ${activeTab === 'liked' ? 'active' : ''}`}
          onClick={() => setActiveTab('liked')}
        >
          ❤️ Вподобання
        </button>
        <button
          className={`favorites-page__tab ${activeTab === 'interests' ? 'active' : ''}`}
          onClick={() => setActiveTab('interests')}
        >
          🎯 Інтереси
        </button>
      </div>

      {activeTab === 'liked' && (
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
      )}

      {activeTab === 'interests' && (
        <div className="favorites-page__content">
          <button
            className="favorites-page__add-button"
            onClick={() => setShowAddInterest(true)}
          >
            + Додати інтерес
          </button>

          {showAddInterest && (
            <div className="favorites-page__add-interest">
              <h3>Новий інтерес</h3>
              <div className="favorites-page__interest-options">
                <label>Тип:</label>
                <select
                  value={newInterest?.item_type || ''}
                  onChange={(e) => setNewInterest({ ...newInterest, item_type: e.target.value, price_category: newInterest?.price_category || '' })}
                  className="favorites-page__select"
                >
                  <option value="">Виберіть тип</option>
                  {ITEM_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.emoji} {type.value}
                    </option>
                  ))}
                </select>

                <label>Цінова категорія:</label>
                <select
                  value={newInterest?.price_category || ''}
                  onChange={(e) => setNewInterest({ ...newInterest, price_category: e.target.value, item_type: newInterest?.item_type || '' })}
                  className="favorites-page__select"
                >
                  <option value="">Виберіть категорію</option>
                  {PRICE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <div className="favorites-page__interest-actions">
                  <button
                    className="favorites-page__interest-button"
                    onClick={handleAddInterest}
                  >
                    Додати
                  </button>
                  <button
                    className="favorites-page__interest-button favorites-page__interest-button--cancel"
                    onClick={() => {
                      setShowAddInterest(false)
                      setNewInterest(null)
                    }}
                  >
                    Скасувати
                  </button>
                </div>
              </div>
            </div>
          )}

          {interests.length === 0 ? (
            <div className="favorites-page__empty">
              У вас поки немає інтересів. Додайте інтереси, щоб знаходити відповідні кейси!
            </div>
          ) : (
            interests.map((interest) => {
              const typeEmoji = ITEM_TYPES.find(t => t.value === interest.item_type)?.emoji || '📦'
              return (
                <div key={interest.id} className="favorites-page__interest-item">
                  <div className="favorites-page__interest-info">
                    <span className="favorites-page__interest-emoji">{typeEmoji}</span>
                    <div>
                      <div className="favorites-page__interest-type">{interest.item_type}</div>
                      <div className="favorites-page__interest-price">💸 {interest.price_category}</div>
                    </div>
                  </div>
                  <button
                    className="favorites-page__delete-button"
                    onClick={() => handleDeleteInterest(interest.id)}
                  >
                    Видалити
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

