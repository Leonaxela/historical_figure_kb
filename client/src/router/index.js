import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  // ── 公开路由 ──
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
  { path: '/celebrities', name: 'celebrities', component: () => import('../views/CelebrityList.vue') },
  { path: '/celebrities/:id', name: 'celebrity-detail', component: () => import('../views/CelebrityDetail.vue') },
  { path: '/graph', name: 'graph', component: () => import('../views/GraphView.vue') },

  // ── 管理后台 ──
  { path: '/admin/login', name: 'admin-login', component: () => import('../views/admin/AdminLogin.vue') },
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', name: 'admin-dashboard', component: () => import('../views/admin/AdminDashboard.vue') },
      { path: 'celebrities', name: 'admin-celebrities', component: () => import('../views/admin/AdminCelebrities.vue') },
      { path: 'celebrities/:id', name: 'admin-celebrity-edit', component: () => import('../views/admin/AdminCelebrityEdit.vue') },
      { path: 'celebrity-detail/:id', name: 'admin-celebrity-detail', component: () => import('../views/admin/AdminCelebrityDetail.vue') },
      { path: 'celebrity-view/:id', name: 'admin-celebrity-view', component: () => import('../views/admin/AdminCelebrityView.vue') },
      { path: 'settings', name: 'admin-settings', component: () => import('../views/admin/AdminSettings.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 从详情页返回看板时，由看板组件自己恢复滚动位置
    if (to.name === 'admin-dashboard' && sessionStorage.getItem('dashboardScrollY')) {
      return false
    }
    return { top: 0 }
  },
})

// ── 路由守卫 ──
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    return next('/admin/login')
  }
  next()
})

export default router
