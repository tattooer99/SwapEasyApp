import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../hooks/useTelegram'
import { useSupabase } from '../hooks/useSupabase'
import { Interest, ITEM_TYPES, PRICE_CATEGORIES } from '../types'
import { safeShowAlert } from '../utils/telegram'
import './ViewCasesPage.css'

export default function ViewCasesPage() {
  const navigate = useNavigate()
  const { webApp } = useTelegram()
  const { getInterests, addInterest, deleteInterest } = useSupabase()
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
    loadInterests()
  }, [])

  const loadInterests = async () => {
    try {
      setLoading(true)
      const data = await getInterests()
      setInterests(data)
    } catch (error) {
      console.error('Error loading interests:', error)
      safeShowAlert(webApp, 'Помилка при завантаженні інтересів')
    } finally {
      setLoading(false)
    }
  }

  const handleAddInterest = async () => {
    if (!newInterest?.item_type || !newInterest?.price_category) {
      safeShowAlert(webApp, 'Виберіть тип та цінову категорію')
      return
    }

    try {
      await addInterest(newInterest.item_type, newInterest.price_category)
      setNewInterest(null)
      setShowAddInterest(false)
      await loadInterests()
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.notificationOccurred('success')
      }
      safeShowAlert(webApp, 'Інтерес додано!')
    } catch (error) {
      console.error('Error adding interest:', error)
      safeShowAlert(webApp, 'Помилка при додаванні інтересу')
    }
  }

  const handleDeleteInterest = async (interestId: number) => {
    try {
      await deleteInterest(interestId)
      await loadInterests()
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.notificationOccurred('success')
      }
    } catch (error) {
      console.error('Error deleting interest:', error)
      safeShowAlert(webApp, 'Помилка при видаленні інтересу')
    }
  }

  if (loading) {
    return (
      <div className="view-cases-page">
        <div className="view-cases-page__loading">Завантаження...</div>
      </div>
    )
  }

  return (
    <div className="view-cases-page">
      <div className="view-cases-page__header">
        <h2>Переглянути кейси</h2>
      </div>

      <div className="view-cases-page__options">
        <button
          className="view-cases-page__option"
          onClick={() => navigate('/my-cases')}
        >
          <span className="view-cases-page__option-icon">📦</span>
          <div className="view-cases-page__option-content">
            <h3>Мої кейси</h3>
            <p>Переглянути, редагувати або видалити ваші кейси</p>
          </div>
          <span className="view-cases-page__option-arrow">→</span>
        </button>

        <button
          className="view-cases-page__option"
          onClick={() => navigate('/archive')}
        >
          <span className="view-cases-page__option-icon">📁</span>
          <div className="view-cases-page__option-content">
            <h3>Архів</h3>
            <p>Кейси, які брали участь в обмінах</p>
          </div>
          <span className="view-cases-page__option-arrow">→</span>
        </button>

        <div className="view-cases-page__interests-section">
          <h3 className="view-cases-page__interests-title">🎯 Інтереси</h3>
          <p className="view-cases-page__interests-description">
            Додайте інтереси, щоб знаходити відповідні кейси при пошуку
          </p>

          <button
            className="view-cases-page__add-interest-button"
            onClick={() => setShowAddInterest(true)}
          >
            + Додати інтерес
          </button>

          {showAddInterest && (
            <div className="view-cases-page__add-interest-form">
              <h4>Новий інтерес</h4>
              <div className="view-cases-page__interest-options">
                <label>Тип:</label>
                <select
                  value={newInterest?.item_type || ''}
                  onChange={(e) => setNewInterest({ 
                    ...newInterest, 
                    item_type: e.target.value, 
                    price_category: newInterest?.price_category || '' 
                  })}
                  className="view-cases-page__select"
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
                  onChange={(e) => setNewInterest({ 
                    ...newInterest, 
                    price_category: e.target.value, 
                    item_type: newInterest?.item_type || '' 
                  })}
                  className="view-cases-page__select"
                >
                  <option value="">Виберіть категорію</option>
                  {PRICE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <div className="view-cases-page__interest-actions">
                  <button
                    className="view-cases-page__interest-button"
                    onClick={handleAddInterest}
                  >
                    Додати
                  </button>
                  <button
                    className="view-cases-page__interest-button view-cases-page__interest-button--cancel"
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
            <div className="view-cases-page__empty-interests">
              У вас поки немає інтересів. Додайте інтереси, щоб знаходити відповідні кейси!
            </div>
          ) : (
            <div className="view-cases-page__interests-list">
              {interests.map((interest) => {
                const typeEmoji = ITEM_TYPES.find(t => t.value === interest.item_type)?.emoji || '📦'
                return (
                  <div key={interest.id} className="view-cases-page__interest-item">
                    <div className="view-cases-page__interest-info">
                      <span className="view-cases-page__interest-emoji">{typeEmoji}</span>
                      <div>
                        <div className="view-cases-page__interest-type">{interest.item_type}</div>
                        <div className="view-cases-page__interest-price">💸 {interest.price_category}</div>
                      </div>
                    </div>
                    <button
                      className="view-cases-page__delete-interest-button"
                      onClick={() => handleDeleteInterest(interest.id)}
                    >
                      Видалити
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

