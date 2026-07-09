<template>
  <div class="login-page">
    <div class="login-card">
      <h2 class="login-title">管理员登录</h2>
      <el-form :model="form" size="large" @keyup.enter="handleLogin">
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" style="width:100%" @click="handleLogin" :loading="loading">登录</el-button>
        </el-form-item>
      </el-form>
      <p class="login-error" v-if="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const form = ref({ username: '', password: '' })
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!form.value.username || !form.value.password) {
    error.value = '请输入用户名和密码'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const ok = await auth.login(form.value.username, form.value.password)
    if (ok) {
      router.push('/')
    } else {
      error.value = '用户名或密码错误'
    }
  } catch {
    error.value = '登录失败，请检查网络'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: flex; align-items: center; justify-content: center;
  min-height: calc(100vh - 160px);
}
.login-card {
  width: 360px; padding: 40px; background: #fff;
  border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);
}
.login-title { text-align: center; font-size: 22px; font-weight: 600; margin-bottom: 28px; color: #303133; }
.login-error { text-align: center; font-size: 13px; color: #f56c6c; margin-top: 8px; }
</style>
