import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
  { path: '/celebrities', name: 'celebrities', component: () => import('../views/CelebrityList.vue') },
  { path: '/celebrities/:id', name: 'celebrity-detail', component: () => import('../views/CelebrityDetail.vue') },
  { path: '/graph', name: 'graph', component: () => import('../views/GraphView.vue') },
  { path: '/admin', name: 'login', component: () => import('../views/LoginView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
