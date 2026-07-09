<template>
  <div class="home">
    <div class="hero">
      <h1 class="title">
        <span class="prefix">古今中外名人</span>
        <RotatingText
          :texts="['生平', '关系', '图谱', '史料', '轶事']"
          :rotation-interval="2200"
          :stagger-duration="0.025"
          stagger-from="last"
          :initial="{ y: '100%' }"
          :animate="{ y: 0 }"
          :exit="{ y: '-120%' }"
          :transition="{ type: 'spring', damping: 30, stiffness: 400 }"
          main-class-name="rotating-inline"
          split-level-class-name="rotating-split"
          element-level-class-name="rotating-char"
        />
      </h1>

      <div class="search-box">
        <div class="search-input-wrap">
          <el-icon class="search-icon"><Search /></el-icon>
          <input
            v-model="searchText"
            class="search-input"
            placeholder="搜索名人，如：苏轼、爱因斯坦、孔子..."
            @keyup.enter="doSearch"
            @input="onInput"
            @focus="showSuggestions = true"
            @blur="setTimeout(() => showSuggestions = false, 200)"
          />
          <el-button type="primary" class="search-btn" @click="doSearch">搜索</el-button>
        </div>
        <div class="search-suggestions" v-if="showSuggestions && suggestions.length">
          <div class="suggestion-item" v-for="s in suggestions" :key="s.id" @mousedown.prevent="goToDetail(s)">
            <div class="suggestion-avatar">{{ (s.chinese_name || s.name).charAt(0) }}</div>
            <div class="suggestion-info">
              <span class="suggestion-name">{{ s.chinese_name || s.name }}</span>
              <span class="suggestion-en" v-if="s.chinese_name">{{ s.name }}</span>
            </div>
            <span class="suggestion-occ">{{ s.occupation?.split('、')[0] || '' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import RotatingText from '../components/RotatingText.vue'
import { celebrityApi } from '../api/index.js'

const router = useRouter()
const searchText = ref('')
const suggestions = ref([])
const showSuggestions = ref(false)

let debounceTimer = null
function onInput() {
  clearTimeout(debounceTimer)
  const q = searchText.value.trim()
  if (!q) { suggestions.value = []; return }
  debounceTimer = setTimeout(async () => {
    const res = await celebrityApi.list({ search: q, pageSize: 6 })
    suggestions.value = res.data || []
  }, 200)
}

function goToDetail(item) {
  if (item.id) router.push('/celebrities/' + item.id)
}

function doSearch() {
  if (searchText.value.trim()) {
    router.push('/celebrities?search=' + encodeURIComponent(searchText.value.trim()))
  } else {
    router.push('/celebrities')
  }
}
</script>

<style scoped>
.home {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 160px);
}

.hero {
  text-align: center;
  max-width: 680px;
  width: 100%;
  margin-top: -100px;
}

.title {
  font-size: 38px;
  font-weight: 300;
  color: #303133;
  margin-bottom: 44px;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
  line-height: 1.6;
}

.prefix { font-weight: 300; }

:deep(.rotating-inline) {
  display: inline-flex !important;
  align-items: center;
  overflow: hidden;
  height: 48px;
  vertical-align: baseline;
}
:deep(.rotating-split) {
  display: inline-flex;
  overflow: hidden;
  padding: 0 1px;
}
:deep(.rotating-char) {
  display: inline-block;
  color: #409eff;
  font-weight: 700;
}

/* ─── 搜索框 ─── */
.search-box { width: 100%; position: relative; }

.search-input-wrap {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 48px;
  padding: 3px 3px 3px 22px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
  transition: all 0.25s ease;
}
.search-input-wrap:focus-within {
  box-shadow: 0 2px 16px rgba(64,158,255,0.12);
  border-color: #409eff;
}

.search-icon { font-size: 18px; color: #c0c4cc; margin-right: 10px; flex-shrink: 0; }

.search-input {
  flex: 1;
  border: none;
  outline: none;
  height: 46px;
  font-size: 16px;
  color: #303133;
  background: transparent;
}
.search-input::placeholder { color: #c0c4cc; }

.search-btn {
  border-radius: 24px !important;
  height: 38px !important;
  padding: 0 26px !important;
  font-size: 14px !important;
  flex-shrink: 0;
}

/* ─── 候选列表 ─── */
.search-suggestions {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(0,0,0,0.08);
  z-index: 1000;
  overflow: hidden;
}
.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s;
}
.suggestion-item:hover { background: #f5f7fa; }
.suggestion-item + .suggestion-item { border-top: 1px solid #f0f2f5; }

.suggestion-avatar {
  width: 32px; height: 32px; line-height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #6366f1);
  color: #fff; font-size: 14px; font-weight: 700;
  text-align: center; flex-shrink: 0;
}
.suggestion-info { display: flex; flex-direction: column; gap: 2px; flex: 1; text-align: left; }
.suggestion-name { font-size: 14px; font-weight: 500; color: #303133; }
.suggestion-en { font-size: 11px; color: #909399; }
.suggestion-occ { font-size: 12px; color: #c0c4cc; flex-shrink: 0; }
</style>
