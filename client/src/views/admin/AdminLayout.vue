<template>
  <div class="admin-shell">
    <!-- 侧边栏 -->
    <aside class="admin-sidebar" :class="{ collapsed }">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <span class="logo-icon">✦</span>
          <span class="logo-text" v-show="!collapsed">管理后台</span>
        </div>
        <button class="collapse-btn" @click="collapsed = !collapsed">
          <span v-html="collapsed ? '▶' : '◀'"></span>
        </button>
      </div>
      <el-menu
        :default-active="currentRoute"
        :collapse="collapsed"
        router
        class="sidebar-menu"
        background-color="#14161b"
        text-color="#8b8fa3"
        active-text-color="#60a5fa"
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><Grid /></el-icon>
          <span>数据看板</span>
        </el-menu-item>
        <el-menu-item index="/admin/celebrities">
          <el-icon><User /></el-icon>
          <span>名人管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/settings">
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
        </el-menu-item>
      </el-menu>
      <div class="sidebar-footer" v-show="!collapsed">
        <div class="user-info">
          <span class="user-avatar">{{ auth.username.charAt(0).toUpperCase() }}</span>
          <span class="user-name">{{ auth.username }}</span>
        </div>
        <el-button text size="small" class="logout-btn" @click="handleLogout">
          退出登录
        </el-button>
      </div>
    </aside>

    <!-- 主区域 -->
    <div class="admin-main" :class="{ expanded: collapsed }">
      <header class="admin-topbar">
        <h2 class="topbar-title">{{ pageTitle }}</h2>
      </header>
      <main class="admin-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'
import { Grid, User, Setting } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const collapsed = ref(false)

const currentRoute = computed(() => {
  const path = route.path
  // 详情页属于数据看板子界面
  if (path.startsWith('/admin/celebrity-detail') || path.startsWith('/admin/celebrity-view')) return '/admin/dashboard'
  return path.startsWith('/admin/') ? path : '/admin/dashboard'
})

const pageTitle = computed(() => {
  const map = {
    'admin-dashboard': '数据看板',
    'admin-celebrities': '名人管理',
    'admin-celebrity-edit': '编辑名人',
    'admin-celebrity-detail': '数据看板',
    'admin-celebrity-view': '数据看板',
    'admin-settings': '系统设置',
  }
  return map[route.name] || '管理后台'
})

function handleLogout() {
  auth.logout()
  router.push('/admin/login')
}
</script>

<style scoped>
.admin-shell {
  display: flex;
  height: 100vh;
  background: #0d0f14;
  color: #e1e5eb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif;
  scrollbar-width: thin;
  scrollbar-color: #2a2d38 transparent;
}

/* ─── 侧边栏 ─── */
.admin-sidebar {
  width: 240px;
  min-width: 240px;
  background: #14161b;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-right: 1px solid #1e2028;
  overflow: hidden;
}
.admin-sidebar.collapsed {
  width: 64px;
  min-width: 64px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 16px;
  border-bottom: 1px solid #1e2028;
  height: 64px;
}
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo-icon {
  font-size: 22px;
  color: #60a5fa;
  animation: spin 12s linear infinite;
}
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: #e1e5eb;
  white-space: nowrap;
}
.collapse-btn {
  background: none;
  border: none;
  color: #5a5f6e;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 6px;
  border-radius: 4px;
  transition: color 0.2s;
}
.collapse-btn:hover { color: #60a5fa; }

.sidebar-menu {
  flex: 1;
  border-right: none !important;
  padding: 8px 0;
}
:deep(.sidebar-menu .el-menu-item) {
  border-radius: 6px;
  margin: 2px 8px;
  height: 42px;
  line-height: 42px;
  font-size: 14px;
}
:deep(.sidebar-menu .el-menu-item:hover) {
  background: #1e2028 !important;
}
:deep(.sidebar-menu .el-menu-item.is-active) {
  background: #1e293b !important;
  color: #60a5fa !important;
}
:deep(.sidebar-menu .el-menu-item .el-icon) {
  font-size: 18px;
}

.sidebar-footer {
  padding: 12px 16px;
  border-top: 1px solid #1e2028;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.user-avatar {
  width: 30px;
  height: 30px;
  line-height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  flex-shrink: 0;
}
.user-name {
  font-size: 13px;
  color: #8b8fa3;
}
.logout-btn {
  color: #5a5f6e !important;
  font-size: 12px !important;
}
.logout-btn:hover { color: #f87171 !important; }

/* ─── 主区域 ─── */
.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.admin-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  height: 64px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}
.topbar-title {
  font-size: 17px;
  font-weight: 600;
  color: #303133;
}

.admin-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  background: #f5f7fa;
}

/* ─── 自定义滚动条 ─── */
.admin-content::-webkit-scrollbar {
  width: 6px;
}
.admin-content::-webkit-scrollbar-track {
  background: transparent;
}
.admin-content::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}
.admin-content::-webkit-scrollbar-thumb:hover {
  background: #409eff;
}
</style>
