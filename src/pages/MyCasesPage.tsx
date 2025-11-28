import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../hooks/useTelegram'
import { useSupabase } from '../hooks/useSupabase'
import CaseCard from '../components/CaseCard'
import { Case } from '../types'
import './MyCasesPage.css'

export default function MyCasesPage() {
  const navigate = useNavigate()
  const { webApp } = useTelegram()
  const { getMyCases, deleteCase } = useSupabase()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [caseToDelete, setCaseToDelete] = useState<Case | null>(null)

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
  }, [])

  const loadCases = async () => {
    try {
      setLoading(true)
      const data = await getMyCases()
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

  const handleEdit = (caseItem: Case) => {
    navigate(`/edit-case/${caseItem.id}`)
  }

  const handleDelete = (caseItem: Case) => {
    setCaseToDelete(caseItem)
  }

  const confirmDelete = async () => {
    if (!caseToDelete) return

    try {
      await deleteCase(caseToDelete.id)
      setCaseToDelete(null)
      await loadCases()
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.notificationOccurred('success')
      }
      if (webApp) {
        webApp.showAlert('Кейс успішно видалено')
      }
    } catch (error) {
      console.error('Error deleting case:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (webApp) {
        webApp.showAlert('Помилка при видаленні: ' + errorMessage)
      } else {
        alert('Помилка при видаленні: ' + errorMessage)
      }
    }
  }

  if (loading) {
    return (
      <div className="my-cases-page">
        <div className="my-cases-page__loading">Завантаження...</div>
      </div>
    )
  }

  return (
    <div className="my-cases-page">
      <div className="my-cases-page__header">
        <h2>Мої кейси</h2>
        <button
          className="my-cases-page__add-button"
          onClick={() => navigate('/add-case')}
        >
          ➕ Додати кейс
        </button>
      </div>

      {cases.length === 0 ? (
        <div className="my-cases-page__empty">
          <p>У вас поки немає кейсів</p>
          <button
            className="my-cases-page__empty-button"
            onClick={() => navigate('/add-case')}
          >
            Додати перший кейс
          </button>
        </div>
      ) : (
        <div className="my-cases-page__cases">
          {cases.map((caseItem) => (
            <div key={caseItem.id} className="my-cases-page__case-wrapper">
              <CaseCard case={caseItem} showActions={false} />
              <div className="my-cases-page__case-actions">
                <button
                  className="my-cases-page__action-button my-cases-page__action-button--edit"
                  onClick={() => handleEdit(caseItem)}
                >
                  ✏️ Редагувати
                </button>
                <button
                  className="my-cases-page__action-button my-cases-page__action-button--delete"
                  onClick={() => handleDelete(caseItem)}
                >
                  🗑️ Видалити
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {caseToDelete && (
        <div className="my-cases-page__modal">
          <div className="my-cases-page__modal-content">
            <h3>Підтвердження видалення</h3>
            <p>Ви впевнені, що хочете видалити кейс "{caseToDelete.title}"?</p>
            <p className="my-cases-page__modal-warning">Цю дію неможливо скасувати.</p>
            <div className="my-cases-page__modal-actions">
              <button
                className="my-cases-page__modal-button my-cases-page__modal-button--confirm"
                onClick={confirmDelete}
              >
                Так, видалити
              </button>
              <button
                className="my-cases-page__modal-button my-cases-page__modal-button--cancel"
                onClick={() => setCaseToDelete(null)}
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

