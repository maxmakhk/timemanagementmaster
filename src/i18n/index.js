import { createI18n } from 'vue-i18n'
import en from '../locales/en.json'
import zh from '../locales/zh.json'

const messages = {
  en,
  zh
}

// 從 localStorage 讀取語言設置，預設為中文
const savedLocale = localStorage.getItem('locale') || 'zh'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  globalInjection: true,
  messages,
})

export default i18n

// 匯出設置語言函數
export const setLocale = (locale) => {
  if (i18n.global.locale) {
    i18n.global.locale.value = locale
    localStorage.setItem('locale', locale)
  }
}

// 匯出獲取當前語言函數
export const getLocale = () => {
  return i18n.global.locale.value
}
