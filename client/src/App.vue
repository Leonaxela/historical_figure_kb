<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-content">
        <div class="logo" @click="$router.push('/')">
          <div class="logo-icon">✦</div>
          <span class="logo-text">古今人物</span>
        </div>
        <el-menu
          :default-active="currentRoute"
          mode="horizontal"
          :ellipsis="false"
          router
          class="header-menu"
        >
          <el-menu-item index="/">首页</el-menu-item>
          <el-menu-item index="/celebrities">名人库</el-menu-item>
          <el-menu-item index="/graph">关系图谱</el-menu-item>
        </el-menu>
        <div class="header-right" v-if="auth.isLoggedIn">
            <span class="header-user">{{ auth.username }}</span>
            <el-button text size="small" @click="auth.logout()">退出</el-button>
        </div>
      </div>
    </el-header>
    <el-main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth.js'

const route = useRoute()
const auth = useAuthStore()
const currentRoute = computed(() => {
  const path = route.path
  if (path === '/') return '/'
  return '/' + path.split('/').filter(Boolean)[0]
})
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif; background: #f5f7fa; color: #303133; }

.app-container { min-height: 100vh; }
.app-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 60px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  margin-right: 40px;
}
.logo-icon {
  font-size: 24px;
  color: #409eff;
  animation: spin 12s linear infinite;
}
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.logo-text {
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #409eff, #6366f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.header-menu { border-bottom: none !important; flex: 1; }
.header-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.header-user { font-size: 13px; color: #909399; }
.app-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  width: 100%;
}

/* 路由过渡 */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.25s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
