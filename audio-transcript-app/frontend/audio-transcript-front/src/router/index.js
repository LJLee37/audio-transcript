import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // 인증 관련 네비게이션 가드 추가
  Router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
    const isGuestRoute = to.matched.some((record) => record.meta.guest)

    // 인증이 필요한 페이지에 접근할 때 토큰이 없으면 로그인 페이지로 리다이렉트
    if (requiresAuth && !token) {
      next('/auth/login')
    }
    // 이미 로그인한 상태에서 게스트 페이지(로그인, 회원가입)에 접근하면 메인 페이지로 리다이렉트
    else if (isGuestRoute && token) {
      next('/')
    }
    // 그 외의 경우 정상적으로 페이지 이동
    else {
      next()
    }
  })

  return Router
})
