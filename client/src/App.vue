<template>
  <el-container class="app-container" :class="{ 'is-admin': isAdminRoute }">
    <el-header class="app-header" v-if="!isAdminRoute">
      <div class="header-content">
        <div class="logo" @click="$router.push('/')">
          <img src="/logo-transparent.svg" class="logo-icon" alt="古今人物" />
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
      </div>
    </el-header>
    <el-main class="app-main" :class="{ 'is-admin': isAdminRoute }">
      <router-view v-slot="{ Component }">
          <component :is="Component" />
      </router-view>
    </el-main>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const currentRoute = computed(() => {
  const path = route.path
  if (path === '/') return '/'
  return '/' + path.split('/').filter(Boolean)[0]
})
const isAdminRoute = computed(() => route.path.startsWith('/admin'))
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
  width: 32px;
  height: 32px;
  object-fit: contain;
}
.logo-text {
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #409eff, #6366f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.header-menu { border-bottom: none !important; flex: 1; }
.app-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  width: 100%;
}
.app-main.is-admin {
  max-width: none;
  margin: 0;
  padding: 0;
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
