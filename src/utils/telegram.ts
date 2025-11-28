// Утилита для безопасной работы с Telegram WebApp API
export function isBackButtonSupported(webApp: any): boolean {
  return webApp?.BackButton && typeof webApp.BackButton.isVisible !== 'undefined'
}

export function safeBackButtonShow(webApp: any, callback: () => void) {
  if (isBackButtonSupported(webApp)) {
    webApp.BackButton.show()
    webApp.BackButton.onClick(callback)
  }
}

export function safeBackButtonHide(webApp: any) {
  if (isBackButtonSupported(webApp)) {
    webApp.BackButton.hide()
  }
}

