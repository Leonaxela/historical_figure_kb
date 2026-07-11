<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card" v-for="s in stats" :key="s.label">
        <div class="stat-icon" :style="{ background: s.bg }">
          <el-icon :size="24"><component :is="s.icon" /></el-icon>
        </div>
        <div class="stat-body">
          <span class="stat-value">{{ s.value }}</span>
          <span class="stat-label">{{ s.label }}</span>
        </div>
        <div class="stat-trend" v-if="s.trend">
          <span :class="s.trend > 0 ? 'up' : 'down'">{{ s.trend > 0 ? '+' : '' }}{{ s.trend }}%</span>
        </div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="section">
      <h3 class="section-title">快速操作</h3>
      <div class="quick-actions">
        <div class="action-card" @click="$router.push('/admin/celebrities')">
          <el-icon :size="28"><User /></el-icon>
          <span>管理名人</span>
        </div>
        <div class="action-card" @click="$router.push('/admin/settings')">
          <el-icon :size="28"><Setting /></el-icon>
          <span>关系类型设置</span>
        </div>
        <div class="action-card" @click="$router.push('/')">
          <el-icon :size="28"><View /></el-icon>
          <span>查看前台</span>
        </div>
        <div class="action-card" @click="$router.push('/graph')">
          <el-icon :size="28"><Share /></el-icon>
          <span>浏览图谱</span>
        </div>
      </div>
    </div>

    <!-- 热度排行 -->
    <div class="section">
      <h3 class="section-title">🔥 关系热度排行 </h3>
      <div class="hot-list">
        <div class="hot-item" v-for="(item, i) in topConnected" :key="item.id" @click="goDetail(item.id)">
          <span class="hot-rank" :class="'rank-' + (i + 1)">{{ i + 1 }}</span>
          <span class="hot-name">{{ item.chinese_name || item.name }}</span>
          <span class="hot-en-name" v-if="item.chinese_name">{{ item.name }}</span>
          <span class="hot-count">{{ item.conn_count }} 条关系</span>
        </div>
      </div>
    </div>

    <!-- 词云 -->
    <div class="section">
      <h3 class="section-title" >☁️ 名人词云</h3>
      <div class="chart-card">
        <WordCloud3D :data="wordcloudData" :on-label-click="goCelebrity" />
      </div>
    </div>

    <!-- 名人称谓 -->
    <div class="section">
      <h3 class="section-title" >🏷️ 名人称谓</h3>
      <div class="tag-grid" v-if="tags.length">
        <div class="tag-card" v-for="t in tags" :key="t.id" :style="{ borderLeft: '3px solid ' + (t.color || '#409eff') }" @click="openTagCelebrities(t)">
          <div class="tag-badge" :style="{ background: t.color || '#409eff' }">{{ t.count }}</div>
          <div class="tag-name">{{ t.name }}</div>
          <div class="tag-desc">{{ t.description || '' }}</div>
        </div>
      </div>
      <el-empty v-else description="暂无称谓" :image-size="40" />
    </div>

    <!-- 称谓名人弹窗 -->
    <el-dialog v-model="tagDialog" :title="tagDialogTitle" width="500px">
      <div v-if="tagCelebrities.length" class="tag-celeb-list">
        <div class="tag-celeb-item" v-for="c in tagCelebrities" :key="c.id" @click="goCelebrity(c.id)">
          <div class="tag-celeb-avatar" :style="{ background: c.image_url ? 'transparent' : 'linear-gradient(135deg, #409eff, #6366f1)' }">
            <img v-if="c.image_url" :src="'/img/' + c.image_url" class="tag-celeb-img" />
            <span v-else>{{ (c.chinese_name || c.name).charAt(0) }}</span>
          </div>
          <div class="tag-celeb-info">
            <span class="tag-celeb-name">{{ c.chinese_name || c.name }}</span>
            <span class="tag-celeb-meta">{{ c.nationality?.replace('中国_', '') || c.nationality }} · {{ c.occupation }}</span>
          </div>
          <span class="tag-celeb-dates">{{ c.birth_date || '?' }} ~ {{ c.death_date || '?' }}</span>
        </div>
      </div>
      <el-empty v-else description="暂无关联名人" :image-size="40" />
    </el-dialog>

    <!-- 饼图区域 -->
    <div class="section">
      <div class="charts-row">
        <div class="chart-card">
          <h3 class="chart-title">🏯 中国历朝历代人数占比</h3>
          <v-chart class="pie-chart" :option="dynastyOption" autoresize />
        </div>
        <div class="chart-card">
          <h3 class="chart-title">🌍 世界各国人数占比</h3>
          <v-chart class="pie-chart" :option="countryOption" autoresize />
        </div>
      </div>
    </div>

    <!-- 最近添加 -->
    <div class="section">
      <h3 class="section-title">最近添加的名人</h3>
      <div class="table-wrap">
        <table class="native-table">
          <thead>
            <tr>
              <th>中文名</th>
              <th>英文名</th>
              <th>国籍</th>
              <th>职业</th>
              <th class="col-center">关联数</th>
              <th class="col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in recentCelebrities" :key="row.id" @click="$router.push('/admin/celebrities/' + row.id)">
              <td>{{ row.chinese_name }}</td>
              <td>{{ row.name }}</td>
              <td>{{ row.nationality }}</td>
              <td>{{ row.occupation }}</td>
              <td class="col-center">{{ row.relation_count ?? 0 }}</td>
              <td class="col-actions">
                <button class="table-btn" @click.stop="$router.push('/admin/celebrities/' + row.id)">编辑</button>
              </td>
            </tr>
            <tr v-if="!tableLoading && recentCelebrities.length === 0">
              <td colspan="6" class="td-empty">暂无数据</td>
            </tr>
          </tbody>
        </table>
        <div class="table-loading" v-if="tableLoading">
          <div class="loading-spinner"></div>
          <span>加载中...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { graphApi, celebrityApi, tagApi } from '../../api/index.js'
import { User, Setting, View, Share, Collection } from '@element-plus/icons-vue'
import WordCloud3D from '../../components/WordCloud3D.vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer])

const tableLoading = ref(false)
const recentCelebrities = ref([])
const statsData = ref({ celebrityCount: 0, relationshipCount: 0, typeCount: 0 })
const nationalityDist = ref([])
const topConnected = ref([])
const wordcloudData = ref([])
const tags = ref([])
const tagDialog = ref(false)
const tagDialogTitle = ref('')
const tagCelebrities = ref([])

const router = useRouter()

function saveScroll() {
  const el = document.querySelector('.admin-content')
  if (el) sessionStorage.setItem('dashboardScrollY', el.scrollTop)
}

function goCelebrity(id) {
  saveScroll()
  router.push('/admin/celebrity-view/' + id)
}

function goDetail(id) {
  saveScroll()
  router.push('/admin/celebrity-detail/' + id)
}

const stats = computed(() => [
  { label: '名人数', value: statsData.value.celebrityCount, icon: User, bg: 'linear-gradient(135deg, #3b82f6, #6366f1)', trend: null },
  { label: '关系数', value: statsData.value.relationshipCount, icon: Share, bg: 'linear-gradient(135deg, #10b981, #059669)', trend: null },
  { label: '关系类型', value: statsData.value.typeCount, icon: Collection, bg: 'linear-gradient(135deg, #f59e0b, #d97706)', trend: null },
  { label: '关系类别', value: statsData.value.categoryCount || 0, icon: Collection, bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', trend: null },
])

const dynastyColors = {
  '春秋': '#f97316', '战国': '#06b6d4',
  '秦': '#ef4444', '西汉': '#22c55e', '东汉': '#059669',
  '三国': '#dc2626', '西晋': '#3b82f6', '东晋': '#6366f1',
  '南北朝': '#a855f7', '隋': '#14b8a6',
  '唐': '#f59e0b', '北宋': '#0ea5e9', '南宋': '#8b5cf6',
  '元': '#1e293b', '明': '#e11d48', '清': '#7c3aed',
}

const dynastyOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
  legend: { bottom: 0, textStyle: { color: '#606266', fontSize: 12 } },
  selectedMode: 'single',
  series: [{
    type: 'pie',
    radius: '60%',
    center: ['50%', '45%'],
    avoidLabelOverlap: true,
    itemStyle: {
      borderRadius: 4,
      borderColor: '#fff',
      borderWidth: 2,
      shadowBlur: 8,
      shadowColor: 'rgba(0,0,0,0.1)',
    },
    label: {
      show: true,
      formatter: '{b}',
      color: '#606266',
      fontSize: 11,
    },
    emphasis: {
      label: { show: true, fontSize: 14, fontWeight: 'bold' },
      itemStyle: { shadowBlur: 16, shadowColor: 'rgba(0,0,0,0.2)' },
    },
    data: computed(() => {
      const raw = nationalityDist.value || []
      return raw
        .filter(d => d.name?.startsWith('中国_'))
        .map(d => {
          const label = d.name.replace('中国_', '')
          return { value: d.count, name: label, itemStyle: { color: dynastyColors[label] || '#909399' } }
        })
    }).value,
    animationDuration: 1200,
    animationEasing: 'cubicOut',
  }],
}))

const countryOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
  legend: { bottom: 0, textStyle: { color: '#606266', fontSize: 12 } },
  selectedMode: 'single',
  series: [{
    type: 'pie',
    radius: '60%',
    center: ['50%', '45%'],
    avoidLabelOverlap: true,
    itemStyle: {
      borderRadius: 4,
      borderColor: '#fff',
      borderWidth: 2,
      shadowBlur: 8,
      shadowColor: 'rgba(0,0,0,0.1)',
    },
    label: {
      show: true,
      formatter: '{b}',
      color: '#606266',
      fontSize: 11,
    },
    emphasis: {
      label: { show: true, fontSize: 14, fontWeight: 'bold' },
      itemStyle: { shadowBlur: 16, shadowColor: 'rgba(0,0,0,0.2)' },
    },
    data: computed(() => {
      const raw = nationalityDist.value || []
      const map = {}
      for (const d of raw) {
        const key = d.name?.startsWith('中国_') ? '中国' : d.name
        map[key] = (map[key] || 0) + d.count
      }
      return Object.entries(map).map(([name, value]) => ({ name, value }))
    }).value,
    animationDuration: 1200,
    animationEasing: 'cubicOut',
  }],
}))

onMounted(async () => {
  // 立即恢复滚动位置（抢在数据加载和渲染之前，避免闪白顶部）
  const saved = sessionStorage.getItem('dashboardScrollY')
  if (saved) {
    const el = document.querySelector('.admin-content')
    if (el) el.scrollTo(0, parseInt(saved))
  }

  tableLoading.value = true
  try {
    const [statsRes, listRes] = await Promise.all([
      graphApi.stats(),
      celebrityApi.list({ pageSize: 500 }),
    ])
    const data = statsRes.data || statsData.value
    statsData.value = data
    nationalityDist.value = data.nationalityDistribution || []
    topConnected.value = data.topConnected || []
    const wcRes = await graphApi.wordcloud()
    wordcloudData.value = wcRes.data || []
    const tagRes = await tagApi.list()
    tags.value = tagRes.data || []
    const all = listRes.data || []
    recentCelebrities.value = all.slice(0, 8)
  } catch (e) {
    console.error('加载仪表盘数据失败', e)
  } finally {
    tableLoading.value = false
  }

  // 数据加载完后再次恢复，补偿容器高度变化
  if (saved) {
    const el = document.querySelector('.admin-content')
    if (el) {
      await nextTick()
      el.scrollTo(0, parseInt(saved))
      await new Promise(r => setTimeout(r, 100))
      el.scrollTo(0, parseInt(saved))
    }
    sessionStorage.removeItem('dashboardScrollY')
  }
})

async function openTagCelebrities(t) {
  tagDialogTitle.value = t.name
  const res = await tagApi.celebrities(t.id)
  tagCelebrities.value = res.data || []
  tagDialog.value = true
}
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
}

/* ─── 统计卡片 ─── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
  margin-bottom: 32px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px 24px;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e4e7ed;
  position: relative;
  transition: box-shadow 0.2s;
}
.stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.stat-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}
.stat-label {
  font-size: 13px;
  color: #909399;
}
.stat-trend {
  position: absolute;
  top: 14px;
  right: 16px;
  font-size: 12px;
  font-weight: 600;
}
.stat-trend .up { color: #67c23a; }
.stat-trend .down { color: #f56c6c; }

/* ─── 区块 ─── */
.section {
  margin-bottom: 32px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

/* ─── 饼图区域 ─── */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.chart-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e4e7ed;
  padding: 20px;
}
.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}
.pie-chart {
  width: 100%;
  height: 300px;
}

/* ─── 热度排行 ─── */
.hot-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.hot-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e4e7ed;
  cursor: pointer;
  transition: all 0.15s;
  flex: 0 0 calc(20% - 8px);
  min-width: 180px;
  height: 84px;
  overflow: hidden;
}
.hot-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64,158,255,0.08);
}
.hot-rank {
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
  background: #f5f7fa;
  color: #909399;
}
.hot-rank.rank-1 { background: #fef3c7; color: #d97706; }
.hot-rank.rank-2 { background: #f3f4f6; color: #6b7280; }
.hot-rank.rank-3 { background: #fed7aa; color: #c2410c; }
.hot-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
}

.hot-en-name {
  font-size: 14px;
  color: #BABCBF;
}

.hot-count {
  margin-left: auto;
  font-size: 12px;
  color: #409eff;
  font-weight: 500;
  white-space: nowrap;
}

/* ─── 快速操作 ─── */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
}
.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 28px 16px 22px;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e4e7ed;
  color: #909399;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}
.action-card:hover {
  border-color: #409eff;
  color: #409eff;
  box-shadow: 0 4px 12px rgba(64,158,255,0.1);
  transform: translateY(-2px);
}

/* ─── 原生表格 ─── */
.native-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  font-size: 14px;
  border: 1px solid #e4e7ed;
}
.native-table thead { background: #f5f7fa; }
.native-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #909399;
  font-size: 13px;
  white-space: nowrap;
  border-bottom: 1px solid #ebeef5;
}
.native-table td {
  padding: 12px 16px;
  color: #606266;
  border-bottom: 1px solid #ebeef5;
}
.native-table tbody tr {
  cursor: pointer;
  transition: background 0.15s;
}
.native-table tbody tr:hover { background: #f5f7fa; }
.native-table tbody tr:last-child td { border-bottom: none; }
.native-table .col-center { text-align: center; }
.native-table .col-actions { text-align: center; width: 80px; }
.native-table .td-empty {
  text-align: center;
  color: #c0c4cc;
  padding: 32px 16px;
}
.table-btn {
  background: none;
  border: none;
  color: #409eff;
  cursor: pointer;
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 4px;
  transition: background 0.15s;
}
.table-btn:hover { background: #ecf5ff; }
.table-btn.danger { color: #f56c6c; }

/* ─── 加载状态 ─── */
.table-wrap { position: relative; }
.table-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.7);
  border-radius: 12px;
  gap: 8px;
  color: #909399;
  font-size: 13px;
  z-index: 2;
}
.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e4e7ed;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: lspin 0.7s linear infinite;
}
@keyframes lspin { to { transform: rotate(360deg); } }

/* --- 称谓卡片 --- */
.tag-grid { display: flex; flex-wrap: wrap; gap: 12px; }
.tag-card { display: flex; flex-direction: column; gap: 4px; padding: 14px 18px; background: #fff; border-radius: 10px; border: 1px solid #e4e7ed; cursor: pointer; transition: all 0.15s; min-width: 140px; position: relative; }
.tag-card:hover { border-color: #409eff; box-shadow: 0 2px 8px rgba(64,158,255,0.08); transform: translateY(-1px); }
.tag-badge { position: absolute; top: -6px; right: -6px; min-width: 20px; height: 20px; line-height: 20px; text-align: center; font-size: 11px; font-weight: 700; color: #fff; border-radius: 10px; padding: 0 6px; }
.tag-name { font-size: 14px; font-weight: 600; color: #303133; }
.tag-desc { font-size: 12px; color: #909399; }
.tag-celeb-list { display: flex; flex-direction: column; gap: 8px; }
.tag-celeb-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 8px; background: #f5f7fa; cursor: pointer; transition: background 0.15s; }
.tag-celeb-item:hover { background: #ecf5ff; }
.tag-celeb-avatar { width: 36px; height: 36px; line-height: 36px; border-radius: 50%; color: #fff; font-size: 14px; font-weight: 700; text-align: center; flex-shrink: 0; overflow: hidden; }
.tag-celeb-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.tag-celeb-info { display: flex; flex-direction: column; gap: 2px; }
.tag-celeb-name { font-size: 14px; font-weight: 500; color: #303133; }
.tag-celeb-meta { font-size: 12px; color: #909399; }
.tag-celeb-dates { margin-left: auto; font-size: 12px; color: #909399; white-space: nowrap; }
</style>
