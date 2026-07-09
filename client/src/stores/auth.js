import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api/index.js'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const username = ref(localStorage.getItem('username') || '')

  const isLoggedIn = computed(() => !!token.value)

  async function login(user, pass) {
    const res = await api.post('/login', { username: user, password: pass })
    if (res.data.success) {
      token.value = res.data.data.token
      username.value = res.data.data.username
      localStorage.setItem('token', token.value)
      localStorage.setItem('username', username.value)
      // 设置默认请求头
      api.defaults.headers.common['Authorization'] = 'Bearer ' + token.value
      return true
    }
    return false
  }

  function logout() {
    token.value = ''
    username.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    delete api.defaults.headers.common['Authorization']
  }

  // 初始化时从 localStorage 恢复 token
  if (token.value) {
    api.defaults.headers.common['Authorization'] = 'Bearer ' + token.value
  }

  return { token, username, isLoggedIn, login, logout }
})
