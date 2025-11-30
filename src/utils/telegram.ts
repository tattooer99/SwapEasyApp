import type { TelegramWebApp } from '../types/telegram'

function safeBackButtonShow(webApp: TelegramWebApp, onClick: () => void): void {
  if (webApp?.BackButton && webApp.BackButton.isVisible !== undefined) {
    webApp.BackButton.show()
    webApp.BackButton.onClick(onClick)
  }
}

function safeBackButtonHide(webApp: TelegramWebApp): void {
  if (webApp?.BackButton && webApp.BackButton.isVisible !== undefined) {
    webApp.BackButton.hide()
    webApp.BackButton.offClick(() => {})
  }
}

function safeShowAlert(webApp: TelegramWebApp | null, message: string): void {
  if (!webApp) {
    alert(message)
    return
  }

  try {
    if (typeof webApp.showAlert === 'function') {
      webApp.showAlert(message)
    } else {
      alert(message)
    }
  } catch (error) {
    console.warn('Error showing alert, using fallback:', error)
  }
}

export { safeBackButtonShow, safeBackButtonHide, safeShowAlert }
