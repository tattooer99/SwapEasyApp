import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../hooks/useTelegram'
import { useSupabase } from '../hooks/useSupabase'
import { safeBackButtonShow, safeBackButtonHide, safeShowAlert } from '../utils/telegram'
import './ChatsPage.css'

interface Chat {
  user: {
    id: number
    name: string
    region?: string | null
  }
  lastMessage?: {
    message_text: string
    created_at?: string
  }
  unreadCount: number
}

export default function ChatsPage() {
  const navigate = useNavigate()
  const { webApp } = useTelegram()
  const { currentUser, getChats, deleteChat } = useSupabase()
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingChatId, setDeletingChatId] = useState<number | null>(null)

  useEffect(() => {
    if (webApp) {
      safeBackButtonShow(webApp, () => navigate('/'))
    }

    return () => {
      if (webApp) {
        safeBackButtonHide(webApp)
      }
    }
  }, [webApp, navigate])

  useEffect(() => {
    if (currentUser) {
      loadChats()
      const interval = setInterval(() => {
        loadChats()
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [currentUser])

  const loadChats = async () => {
    try {
      setLoading(true)
      const data = await getChats()
      setChats(data)
    } catch (error) {
      console.error('Error loading chats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'щойно'
    if (minutes < 60) return `${minutes} хв`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} год`
    
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} дн`
    
    return date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' })
  }

  const handleDeleteChat = async (e: React.MouseEvent, chatUserId: number) => {
    e.stopPropagation() // Предотвращаем открытие чата при клике на кнопку удаления
    
    const confirmed = window.confirm('Ви впевнені, що хочете видалити цей чат? Всі повідомлення будуть видалені.')
    if (!confirmed) return

    try {
      setDeletingChatId(chatUserId)
      await deleteChat(chatUserId)
      safeShowAlert(webApp, 'Чат видалено')
      
      // Обновляем список чатов
      await loadChats()
      
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.notificationOccurred('success')
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      safeShowAlert(webApp, 'Помилка при видаленні чату: ' + errorMessage)
    } finally {
      setDeletingChatId(null)
    }
  }

  if (loading) {
    return (
      <div className="chats-page">
        <div className="chats-page__loading">Завантаження...</div>
      </div>
    )
  }

  return (
    <div className="chats-page">
      <h2 className="chats-page__title">Чати</h2>

      {chats.length === 0 ? (
        <div className="chats-page__empty">
          <p>У вас поки немає активних чатів</p>
          <p className="chats-page__hint">Почніть розмову з іншими користувачами!</p>
        </div>
      ) : (
        <div className="chats-page__list">
          {chats.map((chat) => (
            <div
              key={chat.user.id}
              className="chats-page__chat-item-wrapper"
            >
              <button
                className="chats-page__chat-item"
                onClick={() => navigate(`/chat/${chat.user.id}`)}
              >
                <div className="chats-page__chat-avatar">
                  👤
                </div>
                <div className="chats-page__chat-content">
                  <div className="chats-page__chat-header">
                    <h3 className="chats-page__chat-name">{chat.user.name}</h3>
                    {chat.lastMessage && (
                      <span className="chats-page__chat-time">
                        {formatTime(chat.lastMessage.created_at)}
                      </span>
                    )}
                  </div>
                  <div className="chats-page__chat-preview">
                    {chat.lastMessage ? (
                      <p className="chats-page__chat-message">
                        {chat.lastMessage.message_text}
                      </p>
                    ) : (
                      <p className="chats-page__chat-message chats-page__chat-message--empty">
                        Немає повідомлень
                      </p>
                    )}
                    {chat.unreadCount > 0 && (
                      <span className="chats-page__unread-badge">
                        {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                      </span>
                    )}
                  </div>
                  {chat.user.region && (
                    <p className="chats-page__chat-region">📍 {chat.user.region}</p>
                  )}
                </div>
              </button>
              <button
                className="chats-page__delete-button"
                onClick={(e) => handleDeleteChat(e, chat.user.id)}
                disabled={deletingChatId === chat.user.id}
                aria-label="Видалити чат"
              >
                {deletingChatId === chat.user.id ? '...' : '🗑️'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

