import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTelegram } from '../hooks/useTelegram'
import { useSupabase } from '../hooks/useSupabase'
import ChatBubble from '../components/ChatBubble'
import { Message } from '../types'
import { safeBackButtonShow, safeBackButtonHide } from '../utils/telegram'
import './ChatPage.css'

export default function ChatPage() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()
  const { webApp } = useTelegram()
  const { currentUser, getUserCases, sendMessage, getMessages } = useSupabase()
  const [messages, setMessages] = useState<Message[]>([])
  const [otherUser, setOtherUser] = useState<{ id: number; name: string; region?: string } | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (webApp) {
      safeBackButtonShow(webApp, () => navigate('/chats'))
    }

    return () => {
      if (webApp) {
        safeBackButtonHide(webApp)
      }
    }
  }, [webApp, navigate])

  useEffect(() => {
    if (userId && currentUser) {
      loadChatData()
      // Обновляем сообщения каждые 3 секунды
      const interval = setInterval(() => {
        loadMessages()
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [userId, currentUser])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatData = async () => {
    if (!userId || !currentUser) return

    try {
      setLoading(true)
      
      // Получаем информацию о пользователе
      const userCasesData = await getUserCases(Number(userId))
      setOtherUser({
        id: userCasesData.user.id,
        name: userCasesData.user.name,
        region: userCasesData.user.region || undefined,
      })

      // Загружаем сообщения
      await loadMessages()
    } catch (error) {
      console.error('Error loading chat data:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (webApp) {
        webApp.showAlert('Помилка при завантаженні чату: ' + errorMessage)
      } else {
        alert('Помилка при завантаженні чату: ' + errorMessage)
      }
      navigate(-1)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    if (!userId || !currentUser) {
      console.log('loadMessages: missing userId or currentUser', { userId, currentUser: currentUser?.id })
      return
    }

    try {
      console.log('loadMessages: loading messages for user', Number(userId))
      const data = await getMessages(Number(userId))
      console.log('loadMessages: received', data.length, 'messages')
      setMessages(data)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !userId || !currentUser || sending) return

    const messageText = newMessage.trim()
    setNewMessage('')
    setSending(true)

    try {
      console.log('handleSendMessage: attempting to send message', { userId, messageText, currentUser: currentUser?.id })
      const sentMessage = await sendMessage(Number(userId), messageText)
      console.log('handleSendMessage: message sent successfully', sentMessage)
      setMessages((prev) => [...prev, sentMessage])
      
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.notificationOccurred('success')
      }
    } catch (error) {
      console.error('handleSendMessage: error sending message:', error)
      console.error('handleSendMessage: error details:', JSON.stringify(error, null, 2))
      const errorMessage = error instanceof Error ? error.message : String(error)
      setNewMessage(messageText) // Восстанавливаем текст сообщения
      
      if (webApp) {
        webApp.showAlert('Помилка при відправці повідомлення: ' + errorMessage)
      } else {
        alert('Помилка при відправці повідомлення: ' + errorMessage)
      }
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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

  if (loading) {
    return (
      <div className="chat-page">
        <div className="chat-page__loading">Завантаження...</div>
      </div>
    )
  }

  if (!otherUser || !currentUser) {
    return (
      <div className="chat-page">
        <div className="chat-page__empty">
          <p>Користувач не знайдено</p>
          <button className="chat-page__button" onClick={() => navigate(-1)}>
            Назад
          </button>
        </div>
      </div>
    )
  }

  const handleCloseChat = () => {
    navigate('/chats')
  }

  return (
    <div className="chat-page">
      <div className="chat-page__header">
        <div className="chat-page__user-info">
          <h2 className="chat-page__user-name">👤 {otherUser.name}</h2>
          {otherUser.region && (
            <p className="chat-page__user-region">📍 {otherUser.region}</p>
          )}
        </div>
        <button
          className="chat-page__close-button"
          onClick={handleCloseChat}
          aria-label="Закрити чат"
        >
          ✕
        </button>
      </div>

      <div className="chat-page__messages" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="chat-page__empty-messages">
            <p>Повідомлень поки немає</p>
            <p className="chat-page__hint">Почніть розмову!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.from_user_id === currentUser.id
            return (
              <ChatBubble
                key={message.id}
                message={message.message_text}
                isOwn={isOwn}
                timestamp={formatTime(message.created_at)}
              />
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-page__input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-page__input"
          placeholder="Написати повідомлення..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
          autoFocus
        />
        <button
          type="submit"
          className="chat-page__send-button"
          disabled={!newMessage.trim() || sending}
        >
          {sending ? '...' : '➤'}
        </button>
      </form>
    </div>
  )
}

