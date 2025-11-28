import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../hooks/useTelegram'
import './ViewCasesPage.css'

export default function ViewCasesPage() {
  const navigate = useNavigate()
  const { webApp } = useTelegram()

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
          onClick={() => navigate('/favorites')}
        >
          <span className="view-cases-page__option-icon">❤️</span>
          <div className="view-cases-page__option-content">
            <h3>Мої вподобання</h3>
            <p>Кейси, які вам сподобалися</p>
          </div>
          <span className="view-cases-page__option-arrow">→</span>
        </button>
      </div>
    </div>
  )
}

