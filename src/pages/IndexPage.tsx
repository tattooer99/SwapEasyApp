import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../hooks/useTelegram'
import { useSupabase } from '../hooks/useSupabase'
import './IndexPage.css'

export default function IndexPage() {
  const navigate = useNavigate()
  const { user, webApp } = useTelegram()
  const { currentUser, loading, updateUserRegion } = useSupabase()
  const [showRegionSelect, setShowRegionSelect] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (currentUser && !currentUser.region) {
        setShowRegionSelect(true)
      } else if (currentUser && currentUser.region) {
        setShowRegionSelect(false)
      }
    }
  }, [loading, currentUser])

  useEffect(() => {
    if (webApp?.MainButton) {
      if (showRegionSelect) {
        webApp.MainButton.hide()
      } else {
        webApp.MainButton.hide()
      }
    }
  }, [webApp, showRegionSelect])

  const handleRegionSelect = async (region: string) => {
    try {
      await updateUserRegion(region)
      
      // Скрываем форму выбора региона
      setShowRegionSelect(false)
      
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.notificationOccurred('success')
      }
    } catch (error) {
      console.error('Error updating region:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Используем alert вместо webApp.showAlert для совместимости
      alert('Помилка при збереженні регіону: ' + errorMessage)
    }
  }

  // Показываем загрузку только если есть пользователь и еще идет инициализация
  if (loading && user) {
    return (
      <div className="index-page">
        <div className="index-page__loading">Завантаження...</div>
      </div>
    )
  }

  // Если нет пользователя Telegram (разработка), но есть currentUser - показываем интерфейс
  // Форма выбора региона покажется автоматически если у currentUser нет region
  if (!user && currentUser && currentUser.region) {
    return (
      <div className="index-page">
        <div className="index-page__header">
          <h1 className="index-page__title">
            Привіт, {currentUser.name}! 👋
          </h1>
          <h2 className="index-page__subtitle">SwapEasyApp</h2>
          <p style={{ color: 'var(--tg-theme-hint-color)', fontSize: '14px', marginTop: '8px' }}>
            Режим розробки: Supabase не налаштовано або працюємо без Telegram
          </p>
        </div>

        <div className="index-page__cards">
          <button
            className="index-page__card index-page__card--primary"
            onClick={() => navigate('/add-case')}
          >
            <span className="index-page__card-icon">➕</span>
            <span className="index-page__card-text">Додати кейс</span>
          </button>

          <button
            className="index-page__card"
            onClick={() => navigate('/search')}
          >
            <span className="index-page__card-icon">👀</span>
            <span className="index-page__card-text">Переглянути кейси</span>
          </button>

          <button
            className="index-page__card"
            onClick={() => navigate('/favorites')}
          >
            <span className="index-page__card-icon">❤️</span>
            <span className="index-page__card-text">Інтереси</span>
          </button>

          <button
            className="index-page__card"
            onClick={() => navigate('/search')}
          >
            <span className="index-page__card-icon">🔍</span>
            <span className="index-page__card-text">Пошук</span>
          </button>

          <button
            className="index-page__card"
            onClick={() => navigate('/notifications')}
          >
            <span className="index-page__card-icon">🔔</span>
            <span className="index-page__card-text">Сповіщення</span>
          </button>

          <button
            className="index-page__card"
            onClick={() => navigate('/exchange-history')}
          >
            <span className="index-page__card-icon">📜</span>
            <span className="index-page__card-text">Історія обмінів</span>
          </button>
        </div>
      </div>
    )
  }
  
  // Если нет пользователя и нет currentUser - показываем сообщение
  if (!user && !currentUser && !loading) {
    return (
      <div className="index-page">
        <div className="index-page__header">
          <h1 className="index-page__title">
            Привіт, Тестовий користувач! 👋
          </h1>
          <h2 className="index-page__subtitle">SwapEasyApp</h2>
          <p style={{ color: 'var(--tg-theme-hint-color)', fontSize: '14px', marginTop: '8px' }}>
            Режим розробки: Supabase не налаштовано або працюємо без Telegram
          </p>
        </div>

        <div className="index-page__cards">
          <button
            className="index-page__card index-page__card--primary"
            onClick={() => navigate('/add-case')}
          >
            <span className="index-page__card-icon">➕</span>
            <span className="index-page__card-text">Додати кейс</span>
          </button>

          <button
            className="index-page__card"
            onClick={() => navigate('/search')}
          >
            <span className="index-page__card-icon">👀</span>
            <span className="index-page__card-text">Переглянути кейси</span>
          </button>

          <button
            className="index-page__card"
            onClick={() => navigate('/favorites')}
          >
            <span className="index-page__card-icon">❤️</span>
            <span className="index-page__card-text">Інтереси</span>
          </button>

          <button
            className="index-page__card"
            onClick={() => navigate('/search')}
          >
            <span className="index-page__card-icon">🔍</span>
            <span className="index-page__card-text">Пошук</span>
          </button>

          <button
            className="index-page__card"
            onClick={() => navigate('/notifications')}
          >
            <span className="index-page__card-icon">🔔</span>
            <span className="index-page__card-text">Сповіщення</span>
          </button>
        </div>
      </div>
    )
  }

  if (showRegionSelect) {
    return (
      <div className="index-page">
        <div className="region-select">
          <h2>Виберіть ваш регіон</h2>
          <div className="region-select__grid">
            {[
              'Київська', 'Львівська', 'Одеська', 'Дніпропетровська',
              'Харківська', 'Запорізька', 'Вінницька', 'Житомирська',
              'Івано-Франківська', 'Тернопільська', 'Хмельницька', 'Черкаська',
              'Чернівецька', 'Полтавська', 'Сумська', 'Рівненська',
              'Херсонська', 'Миколаївська', 'Кіровоградська', 'Луганська',
              'Донецька', 'Волинська', 'Закарпатська', 'Чернігівська',
            ].map((region) => (
              <button
                key={region}
                className="region-select__button"
                onClick={() => handleRegionSelect(region)}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="index-page">
      <div className="index-page__header">
        <h1 className="index-page__title">
          Привіт, {user?.first_name || 'Користувач'}! 👋
        </h1>
        <h2 className="index-page__subtitle">SwapEasyApp</h2>
      </div>

      <div className="index-page__cards">
        <button
          className="index-page__card index-page__card--primary"
          onClick={() => navigate('/add-case')}
        >
          <span className="index-page__card-icon">➕</span>
          <span className="index-page__card-text">Додати кейс</span>
        </button>

        <button
          className="index-page__card"
          onClick={() => navigate('/view-cases')}
        >
          <span className="index-page__card-icon">👀</span>
          <span className="index-page__card-text">Переглянути кейси</span>
        </button>

        <button
          className="index-page__card"
          onClick={() => navigate('/favorites')}
        >
          <span className="index-page__card-icon">❤️</span>
          <span className="index-page__card-text">Інтереси</span>
        </button>

        <button
          className="index-page__card"
          onClick={() => navigate('/search')}
        >
          <span className="index-page__card-icon">🔍</span>
          <span className="index-page__card-text">Пошук</span>
        </button>

        <button
          className="index-page__card"
          onClick={() => navigate('/notifications')}
        >
          <span className="index-page__card-icon">🔔</span>
          <span className="index-page__card-text">Сповіщення</span>
        </button>

        <button
          className="index-page__card"
          onClick={() => navigate('/exchange-history')}
        >
          <span className="index-page__card-icon">📜</span>
          <span className="index-page__card-text">Історія обмінів</span>
        </button>
      </div>
    </div>
  )
}

