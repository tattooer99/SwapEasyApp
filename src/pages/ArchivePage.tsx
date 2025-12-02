import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../hooks/useTelegram'
import { useSupabase } from '../hooks/useSupabase'
import CaseCard from '../components/CaseCard'
import { Case } from '../types'
import { safeShowAlert, safeBackButtonShow, safeBackButtonHide } from '../utils/telegram'
import './ArchivePage.css'

export default function ArchivePage() {
  const navigate = useNavigate()
  const { webApp } = useTelegram()
  const { currentUser, getArchivedCases, restoreCase, deleteCase } = useSupabase()
  const [archivedCases, setArchivedCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [restoringId, setRestoringId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    if (webApp) {
      safeBackButtonShow(webApp, () => navigate('/view-cases'))
    }
    return () => {
      if (webApp) {
        safeBackButtonHide(webApp)
      }
    }
  }, [webApp, navigate])

  useEffect(() => {
    if (currentUser) {
      loadArchivedCases()
    }
  }, [currentUser])

  const loadArchivedCases = async () => {
    try {
      setLoading(true)
      const data = await getArchivedCases()
      setArchivedCases(data)
    } catch (error) {
      console.error('Error loading archived cases:', error)
      safeShowAlert(webApp, 'Помилка при завантаженні архіву')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (caseId: number) => {
    const confirmed = window.confirm('Ви впевнені, що хочете відновити цей кейс? Він знову стане активним і буде видимий для інших користувачів.')
    if (!confirmed) return

    try {
      setRestoringId(caseId)
      await restoreCase(caseId)
      await loadArchivedCases()
      safeShowAlert(webApp, 'Кейс відновлено!')
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.notificationOccurred('success')
      }
    } catch (error) {
      console.error('Error restoring case:', error)
      safeShowAlert(webApp, 'Помилка при відновленні кейсу')
    } finally {
      setRestoringId(null)
    }
  }

  const handleDelete = async (caseId: number) => {
    const confirmed = window.confirm('Ви впевнені, що хочете видалити цей кейс назавжди? Цю дію неможливо скасувати.')
    if (!confirmed) return

    try {
      setDeletingId(caseId)
      await deleteCase(caseId)
      await loadArchivedCases()
      safeShowAlert(webApp, 'Кейс видалено!')
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.notificationOccurred('success')
      }
    } catch (error) {
      console.error('Error deleting case:', error)
      safeShowAlert(webApp, 'Помилка при видаленні кейсу')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="archive-page">
        <div className="archive-page__loading">Завантаження...</div>
      </div>
    )
  }

  return (
    <div className="archive-page">
      <h2 className="archive-page__title">Архів</h2>
      <p className="archive-page__description">
        Тут зберігаються кейси, які брали участь в успішних обмінах
      </p>

      {archivedCases.length === 0 ? (
        <div className="archive-page__empty">
          У вас поки немає кейсів в архіві
        </div>
      ) : (
        <div className="archive-page__list">
          {archivedCases.map((caseItem) => (
            <div key={caseItem.id} className="archive-page__case-wrapper">
              <CaseCard 
                case={caseItem} 
                showActions={false}
              />
              <div className="archive-page__actions">
                <button
                  className="archive-page__restore-button"
                  onClick={() => handleRestore(caseItem.id)}
                  disabled={restoringId === caseItem.id || deletingId === caseItem.id}
                >
                  {restoringId === caseItem.id ? '...' : '↩️ Відновити'}
                </button>
                <button
                  className="archive-page__delete-button"
                  onClick={() => handleDelete(caseItem.id)}
                  disabled={restoringId === caseItem.id || deletingId === caseItem.id}
                >
                  {deletingId === caseItem.id ? '...' : '🗑️ Видалити'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

