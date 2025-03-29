import { defineBoot } from '#q-app/wrappers'
import { createI18n } from 'vue-i18n'
import messages from 'src/i18n'

export default defineBoot(({ app }) => {
  const i18n = createI18n({
    locale: 'ko-KR', // 한국어를 기본 언어로 설정
    fallbackLocale: 'en-US',
    globalInjection: true,
    messages,
  })

  // Set i18n instance on app
  app.use(i18n)
})
