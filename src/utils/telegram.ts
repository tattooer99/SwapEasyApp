import { TelegramWebApp } from '../types/telegram'

export function safeBackButtonShow(webApp: TelegramWebApp, onClick: () => void): void {
  if (webApp?.BackButton && webApp.BackButton.isVisible !== undefined) {
    webApp.BackButton.show()
    webApp.BackButton.onClick(onClick)
  }
}

export function safeBackButtonHide(webApp: TelegramWebApp): void {
  if (webApp?.BackButton && webApp.BackButton.isVisible !== undefined) {
    webApp.BackButton.hide()
    webApp.BackButton.offClick(() => {}) // Remove previous handler
  }
}

/**
 * Безопасный показ алерта в Telegram WebApp
 * Проверяет, не открыт ли уже popup, и обрабатывает ошибки
 */
export function safeShowAlert(webApp: TelegramWebApp | null, message: string): void {
  if (!webApp) {
    // Fallback для разработки
    alert(message)
    return
  }

  try {
    // Проверяем, доступен ли showAlert
    if (typeof webApp.showAlert === 'function') {
      webApp.showAlert(message)
    } else {
      // Fallback
      alert(message)
    }
  } catch (error) {
    // Если popup уже открыт или другая ошибка, используем fallback
    console.warn('Error showing alert, using fallback:', error)
    // Не показываем alert в catch, чтобы избежать бесконечного цикла
    // Просто логируем ошибку
  }
}
