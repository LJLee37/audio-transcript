import { boot } from 'quasar/wrappers'
import axios from 'axios'

// API 기본 URL 설정
const api = axios.create({
  baseURL: 'https://server.ljlee37.com:5759/api',
  timeout: 60000, // 60초 타임아웃 (음성 파일 처리는 시간이 걸릴 수 있음)
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터 설정
api.interceptors.request.use(
  (config) => {
    // 로컬 스토리지에서 토큰 가져오기
    const token = localStorage.getItem('token')

    // 토큰이 있으면 헤더에 추가
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 응답 인터셉터 설정
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // 401 에러 (인증 실패) 처리
    if (error.response && error.response.status === 401) {
      // 토큰 삭제
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // 로그인 페이지로 리다이렉트
      window.location.href = '/#/login'
    }

    return Promise.reject(error)
  },
)

export default boot(({ app }) => {
  // Vue 인스턴스에 $api 추가
  app.config.globalProperties.$api = api
})

export { api }
