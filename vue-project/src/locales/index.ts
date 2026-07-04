import { createI18n } from 'vue-i18n'
import en from './en'
import ja from './ja'
import zh from './zh'

const messages = {
  en,
  ja,
  zh
}

// 从localStorage读取保存的语言设置，没有则默认为日语
const savedLocale = localStorage.getItem('locale') || 'ja'

const i18n = createI18n({
  locale: savedLocale,
  fallbackLocale: 'en',
  messages
})

export default i18n
