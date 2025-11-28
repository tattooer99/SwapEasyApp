import { useEffect, useState } from 'react'

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

// Мок для разработки вне Telegram
function createMockWebApp(): TelegramWebApp {
  return {
    initData: '',
    initDataUnsafe: {
      user: {
        id: 123456789,
        first_name: 'Тестовий',
        username: 'testuser',
      },
      auth_date: Math.floor(Date.now() / 1000),
      hash: '',
    },
    version: '7.0',
    platform: 'web',
    colorScheme: 'light' as const,
    themeParams: {
      bg_color: '#ffffff',
      text_color: '#000000',
      hint_color: '#999999',
      link_color: '#2481cc',
      button_color: '#2481cc',
      button_text_color: '#ffffff',
      secondary_bg_color: '#f1f1f1',
    },
    isExpanded: true,
    viewportHeight: window.innerHeight,
    viewportStableHeight: window.innerHeight,
    headerColor: '#ffffff',
    backgroundColor: '#ffffff',
    BackButton: {
      isVisible: false,
      onClick: () => {},
      offClick: () => {},
      show: () => {},
      hide: () => {},
    },
    MainButton: {
      text: '',
      color: '#2481cc',
      textColor: '#ffffff',
      isVisible: false,
      isActive: true,
      isProgressVisible: false,
      setText: () => {},
      onClick: () => {},
      offClick: () => {},
      show: () => {},
      hide: () => {},
      enable: () => {},
      disable: () => {},
      showProgress: () => {},
      hideProgress: () => {},
      setParams: () => {},
    },
    HapticFeedback: {
      impactOccurred: () => {},
      notificationOccurred: () => {},
      selectionChanged: () => {},
    },
    ready: () => {},
    expand: () => {},
    close: () => {},
    sendData: () => {},
    openLink: () => {},
    openTelegramLink: () => {},
    openInvoice: () => {},
    showPopup: (_params, callback) => {
      if (callback) callback('ok')
    },
    showAlert: (message: string, callback?: () => void) => {
      alert(message)
      if (callback) callback()
    },
    showConfirm: (message: string, callback?: (confirmed: boolean) => void) => {
      const confirmed = confirm(message)
      if (callback) callback(confirmed)
    },
    showScanQrPopup: () => {},
    closeScanQrPopup: () => {},
    readTextFromClipboard: () => {},
    requestWriteAccess: () => {},
    requestContact: () => {},
  } as TelegramWebApp
}

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)

  useEffect(() => {
    // Используем нативный Telegram WebApp если доступен, иначе мок для разработки
    const tg = window.Telegram?.WebApp || (import.meta.env.DEV ? createMockWebApp() : null)
    
    if (tg) {
      tg.ready()
      tg.expand()
      setWebApp(tg)
      
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user)
      }
    }
  }, [])

  return { user, webApp }
}

