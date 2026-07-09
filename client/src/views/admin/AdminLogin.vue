<template>
  <div class="admin-login">
    <div class="login-bg"></div>
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo">✦</div>
        <h1 class="login-title">管理后台</h1>
        <p class="login-subtitle">古今中外名人关系图谱系统</p>
      </div>
      <el-form :model="form" size="large" @keyup.enter="handleLogin" class="login-form">
        <el-form-item>
          <div class="input-wrap">
            <el-icon class="input-icon"><User /></el-icon>
            <el-input v-model="form.username" placeholder="管理员用户名" :prefix-icon="null" />
          </div>
        </el-form-item>
        <el-form-item>
          <div class="input-wrap">
            <el-icon class="input-icon"><Lock /></el-icon>
            <el-input v-model="form.password" type="password" placeholder="密码" show-password :prefix-icon="null" />
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" style="width:100%;height:44px;border-radius:10px;font-size:15px" @click="handleLogin" :loading="loading">
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>
      <transition name="fade">
        <p class="login-error" v-if="error">{{ error }}</p>
      </transition>
      <p class="login-footer">
        <el-button text size="small" @click="$router.push('/')">← 返回首页</el-button>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'
import { User, Lock } from '@element-plus/icons-vue'

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
      router.push('/admin/dashboard')
    } else {
      error.value = '用户名或密码错误'
    }
  } catch {
    error.value = '登录失败，请检查网络连接'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.admin-login {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0b0e;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif;
}
.login-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 600px 400px at 20% 30%, rgba(59, 130, 246, 0.08) 0%, transparent 70%),
    radial-gradient(ellipse 500px 500px at 80% 70%, rgba(99, 102, 241, 0.06) 0%, transparent 70%);
  pointer-events: none;
}

.login-card {
  position: relative;
  width: 400px;
  padding: 44px 36px 36px;
  background: #14161b;
  border-radius: 20px;
  border: 1px solid #1e2028;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.login-header {
  text-align: center;
  margin-bottom: 36px;
}
.login-logo {
  font-size: 36px;
  color: #60a5fa;
  animation: spin 12s linear infinite;
  margin-bottom: 12px;
}
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.login-title {
  font-size: 24px;
  font-weight: 700;
  color: #e1e5eb;
  margin-bottom: 4px;
}
.login-subtitle {
  font-size: 13px;
  color: #5a5f6e;
}

.login-form {
  margin-bottom: 8px;
}
.input-wrap {
  position: relative;
  width: 100%;
}
.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #5a5f6e;
  font-size: 16px;
  z-index: 2;
  pointer-events: none;
}
:deep(.input-wrap .el-input) {
  --el-input-bg-color: #0d0f14;
  --el-input-border-color: #1e2028;
  --el-input-hover-border-color: #3b82f6;
  --el-input-focus-border-color: #60a5fa;
  --el-input-text-color: #e1e5eb;
  --el-input-placeholder-color: #5a5f6e;
}
:deep(.input-wrap .el-input__wrapper) {
  padding-left: 42px;
  border-radius: 10px;
  box-shadow: 0 0 0 1px #1e2028 inset;
}
:deep(.input-wrap .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #3b82f6 inset;
}
:deep(.input-wrap .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #60a5fa inset;
}
:deep(.input-wrap .el-input__inner) {
  height: 44px;
}

.login-error {
  text-align: center;
  font-size: 13px;
  color: #f87171;
  margin-top: 4px;
  margin-bottom: 0;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #1e2028;
}
.login-footer .el-button {
  color: #5a5f6e !important;
  font-size: 12px;
}
.login-footer .el-button:hover { color: #60a5fa !important; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
