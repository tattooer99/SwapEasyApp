import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../hooks/useTelegram'
import { useSupabase } from '../hooks/useSupabase'
import PhotoUploader from '../components/PhotoUploader'
import { ITEM_TYPES, PRICE_CATEGORIES } from '../types'
import './AddCasePage.css'

export default function AddCasePage() {
  const navigate = useNavigate()
  const { webApp } = useTelegram()
  const { currentUser, loading, createCase } = useSupabase()
  const [step, setStep] = useState<'title' | 'type' | 'description' | 'price' | 'photos'>('title')
  const [formData, setFormData] = useState({
    title: '',
    item_type: '',
    description: '',
    price_category: '',
    photos: [] as string[],
  })

  useEffect(() => {
    if (webApp?.BackButton) {
      webApp.BackButton.show()
      webApp.BackButton.onClick(() => {
        if (step === 'title') {
          navigate('/')
        } else {
          setStep('title')
        }
      })
    }

    if (webApp?.MainButton) {
      if (step === 'photos') {
        // На шаге фото показываем MainButton как альтернативу кнопке "Готово"
        webApp.MainButton.setText('Опублікувати')
        webApp.MainButton.show()
        webApp.MainButton.onClick(handleSubmit)
      } else {
        webApp.MainButton.hide()
      }
    }

    return () => {
      if (webApp?.BackButton) {
        webApp.BackButton.hide()
      }
      if (webApp?.MainButton) {
        webApp.MainButton.hide()
      }
    }
  }, [webApp, step, navigate])

  const handleSubmit = async () => {
    if (!formData.title || !formData.item_type || !formData.description || !formData.price_category) {
      if (webApp) {
        webApp.showAlert('Будь ласка, заповніть всі поля')
      }
      return
    }

    try {
      if (webApp?.MainButton) {
        webApp.MainButton.showProgress()
      }

      await createCase({
        title: formData.title,
        item_type: formData.item_type,
        description: formData.description,
        price_category: formData.price_category,
        photo1: formData.photos[0] || undefined,
        photo2: formData.photos[1] || undefined,
        photo3: formData.photos[2] || undefined,
      })

      if (webApp) {
        webApp.HapticFeedback?.notificationOccurred('success')
        webApp.showAlert('Кейс успішно додано!', () => {
          navigate('/')
        })
      }
    } catch (error) {
      console.error('Error creating case:', error)
      if (webApp) {
        webApp.showAlert('Помилка при додаванні кейсу')
      }
    } finally {
      if (webApp?.MainButton) {
        webApp.MainButton.hideProgress()
      }
    }
  }

  const handleNext = () => {
    if (step === 'title' && formData.title) {
      setStep('type')
    } else if (step === 'type' && formData.item_type) {
      setStep('description')
    } else if (step === 'description' && formData.description) {
      setStep('price')
    } else if (step === 'price' && formData.price_category) {
      setStep('photos')
    }
  }

  // Показываем загрузку только если идет инициализация
  if (loading) {
    return (
      <div className="add-case-page">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '50vh',
          color: 'var(--tg-theme-hint-color)'
        }}>
          Завантаження...
        </div>
      </div>
    )
  }

  // Если нет пользователя, но загрузка завершена - показываем предупреждение
  if (!currentUser) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    
    // В режиме разработки разрешаем работу без пользователя
    if (import.meta.env.DEV) {
      console.warn('Режим разработки: работаем без реального пользователя')
      // Продолжаем работу - функции будут показывать ошибки при попытке сохранить
    } else if (!supabaseUrl) {
      return (
        <div className="add-case-page">
          <div style={{ 
            padding: '20px',
            textAlign: 'center',
            color: 'var(--tg-theme-hint-color)'
          }}>
            <p style={{ marginBottom: '16px' }}>
              Supabase не налаштовано. Налаштуйте змінні оточення VITE_SUPABASE_URL та VITE_SUPABASE_ANON_KEY
            </p>
            <button 
              className="add-case-page__button"
              onClick={() => navigate('/')}
            >
              Повернутися назад
            </button>
          </div>
        </div>
      )
    } else {
      // Если Supabase настроен, но пользователь не загрузился - показываем ошибку
      return (
        <div className="add-case-page">
          <div style={{ 
            padding: '20px',
            textAlign: 'center',
            color: 'var(--tg-theme-hint-color)'
          }}>
            <p style={{ marginBottom: '16px' }}>
              Помилка ініціалізації користувача. Спробуйте оновити сторінку.
            </p>
            <button 
              className="add-case-page__button"
              onClick={() => navigate('/')}
            >
              Повернутися назад
            </button>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="add-case-page">
      <div className="add-case-page__progress">
        <div className={`add-case-page__step ${step === 'title' ? 'active' : (step === 'type' || step === 'description' || step === 'price' || step === 'photos') ? 'completed' : ''}`}>
          1
        </div>
        <div className={`add-case-page__step ${step === 'type' ? 'active' : ['description', 'price', 'photos'].includes(step) ? 'completed' : ''}`}>
          2
        </div>
        <div className={`add-case-page__step ${step === 'description' ? 'active' : ['price', 'photos'].includes(step) ? 'completed' : ''}`}>
          3
        </div>
        <div className={`add-case-page__step ${step === 'price' ? 'active' : step === 'photos' ? 'completed' : ''}`}>
          4
        </div>
        <div className={`add-case-page__step ${step === 'photos' ? 'active' : ''}`}>
          5
        </div>
      </div>

      {step === 'title' && (
        <div className="add-case-page__step-content">
          <h2>Назва кейсу</h2>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Наприклад: iPhone 12"
            className="add-case-page__input"
            autoFocus
          />
          <div className="add-case-page__buttons">
            <button className="add-case-page__button" onClick={handleNext} disabled={!formData.title}>
              Далі
            </button>
            <button 
              className="add-case-page__button add-case-page__button--cancel" 
              onClick={() => navigate('/')}
            >
              Скасувати
            </button>
          </div>
        </div>
      )}

      {step === 'type' && (
        <div className="add-case-page__step-content">
          <h2>Тип кейсу</h2>
          <div className="add-case-page__options">
            {ITEM_TYPES.map((type) => (
              <button
                key={type.value}
                className={`add-case-page__option ${formData.item_type === type.value ? 'active' : ''}`}
                onClick={() => {
                  setFormData({ ...formData, item_type: type.value })
                  setTimeout(() => setStep('description'), 200)
                }}
              >
                <span className="add-case-page__option-emoji">{type.emoji}</span>
                <span>{type.value}</span>
              </button>
            ))}
          </div>
          <button 
            className="add-case-page__button add-case-page__button--cancel" 
            onClick={() => navigate('/')}
            style={{ marginTop: '16px' }}
          >
            Скасувати
          </button>
        </div>
      )}

      {step === 'description' && (
        <div className="add-case-page__step-content">
          <h2>Опис</h2>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Опишіть ваш кейс детально..."
            className="add-case-page__textarea"
            rows={6}
            autoFocus
          />
          <div className="add-case-page__buttons">
            <button className="add-case-page__button" onClick={handleNext} disabled={!formData.description}>
              Далі
            </button>
            <button 
              className="add-case-page__button add-case-page__button--cancel" 
              onClick={() => navigate('/')}
            >
              Скасувати
            </button>
          </div>
        </div>
      )}

      {step === 'price' && (
        <div className="add-case-page__step-content">
          <h2>Цінова категорія</h2>
          <div className="add-case-page__options">
            {PRICE_CATEGORIES.map((category) => (
              <button
                key={category}
                className={`add-case-page__option ${formData.price_category === category ? 'active' : ''}`}
                onClick={() => {
                  setFormData({ ...formData, price_category: category })
                  setTimeout(() => setStep('photos'), 200)
                }}
              >
                💸 {category}
              </button>
            ))}
          </div>
          <button 
            className="add-case-page__button add-case-page__button--cancel" 
            onClick={() => navigate('/')}
            style={{ marginTop: '16px' }}
          >
            Скасувати
          </button>
        </div>
      )}

      {step === 'photos' && (
        <div className="add-case-page__step-content">
          <h2>Фото (до 3 штук)</h2>
          <PhotoUploader
            maxPhotos={3}
            onPhotosChange={(photos) => setFormData({ ...formData, photos })}
          />
          <p style={{ 
            fontSize: '14px', 
            color: 'var(--tg-theme-hint-color)', 
            marginTop: '8px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            Фото не обов'язкові. Можна пропустити цей крок.
          </p>
          <div className="add-case-page__buttons">
            <button 
              className="add-case-page__button" 
              onClick={handleSubmit}
            >
              Готово
            </button>
            <button 
              className="add-case-page__button add-case-page__button--cancel" 
              onClick={() => navigate('/')}
            >
              Скасувати
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

