<template>
  <div class="admin-view">
    <div class="detail-header">
      <button class="back-arrow" @click="goBack">&lt;</button>
      <h2 class="detail-title" v-if="celebrity"><span class="title-name">{{ celebrity.chinese_name || celebrity.name }}</span> 信息详情</h2>
      <h2 class="detail-title" v-else>信息详情</h2>
    </div>

    <template v-if="celebrity">
      <el-row :gutter="20">
        <!-- 基本信息 -->
        <el-col :span="8">
          <el-card class="view-card">
            <template #header><span>{{ celebrity.chinese_name || celebrity.name }}</span></template>
            <div class="avatar-section">
              <div class="view-avatar">
                <img v-if="celebrity.image_url" :src="'/img/' + celebrity.image_url" />
                <span v-else>{{ (celebrity.chinese_name || celebrity.name).charAt(0) }}</span>
              </div>
            </div>
            <div class="info-list">
              <div class="info-row"><span class="info-label">英文名</span><span class="info-value">{{ celebrity.name }}</span></div>
              <div class="info-row" v-if="celebrity.chinese_name"><span class="info-label">中文名</span><span class="info-value">{{ celebrity.chinese_name }}</span></div>
              <div class="info-row"><span class="info-label">{{ celebrity.nationality?.includes('中国_') ? '朝代' : '国籍' }}</span><span class="info-value">{{ celebrity.nationality?.includes('中国_') ? celebrity.nationality.replace('中国_', '') : celebrity.nationality }}</span></div>
              <div class="info-row"><span class="info-label">职业</span><span class="info-value">{{ celebrity.occupation }}</span></div>
              <div class="info-row"><span class="info-label">出生</span><span class="info-value">{{ celebrity.birth_date || '未知' }}</span></div>
              <div class="info-row"><span class="info-label">逝世</span><span class="info-value">{{ celebrity.death_date || '未知' }}</span></div>
              <div class="info-row" v-if="celebrity.his_id"><span class="info-label">his_id</span><code class="info-value">{{ celebrity.his_id }}</code></div>
              <div class="info-row" v-if="celebrity.biography"><span class="info-label">简介</span><span class="info-value">{{ celebrity.biography }}</span></div>
            </div>
          </el-card>
        </el-col>

        <!-- 关系 + 内容 -->
        <el-col :span="16">
          <!-- 关系网络 -->
          <el-card class="view-card">
            <template #header><span>🔗 关系网络 ({{ relationsList.length }} 条)</span></template>
            <div class="rel-list" v-if="relationsList.length">
              <div v-for="r in relationsList" :key="r.key" class="rel-item" :style="{ borderLeftColor: r.type_color }">
                <div class="rel-info">
                  <span class="rel-arrow">
                    <ArrowFrom v-if="r.arrow === 'from'" />
                    <ArrowBoth v-else-if="r.arrow === 'both'" />
                    <ArrowNone v-else />
                  </span>
                  <span class="rel-name">{{ r.otherName }}</span>
                  <el-tag :color="r.type_color" size="small" effect="dark">{{ r.type_name }}</el-tag>
                  <span class="rel-desc" v-if="r.description">{{ r.description }}</span>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无关系" :image-size="40" />
          </el-card>

          <!-- 扩展内容 -->
          <el-card class="view-card" style="margin-top:16px">
            <template #header><span>📝 详细内容</span></template>
            <div v-if="hasContents" class="content-tabs">
              <div class="content-tab" v-for="tab in contentTabs" :key="tab.key" :class="{ active: contentActive === tab.key }" @click="contentActive = tab.key">{{ tab.label }}</div>
            </div>
            <div v-if="currentContent" class="md-preview" v-html="currentContent"></div>
            <el-empty v-else description="暂无详细内容" :image-size="40" />
          </el-card>

          <!-- 时间线 -->
          <el-card class="view-card" style="margin-top:16px">
            <template #header><span>⏱ 时间线 ({{ timeline.length }} 条)</span></template>
            <div class="tl-list" v-if="timeline.length">
              <div class="tl-item" v-for="ev in timeline" :key="ev.id">
                <div class="tl-info">
                  <span class="tl-date">{{ ev.event_date }}</span>
                  <strong class="tl-title">{{ ev.title }}</strong>
                  <el-tag size="small" class="tl-type" :color="tlTypeColor(ev.event_type)" effect="dark">{{ ev.event_type }}</el-tag>
                  <span class="tl-desc" v-if="ev.description">{{ ev.description }}</span>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无时间线事件" :image-size="40" />
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { celebrityApi, relationApi, contentApi } from '../../api/index.js'
import MarkdownIt from 'markdown-it'
import ArrowFrom from '../../components/ArrowFrom.vue'
import ArrowNone from '../../components/ArrowNone.vue'
import ArrowBoth from '../../components/ArrowBoth.vue'

const md = new MarkdownIt({ html: true, linkify: true })

const route = useRoute()
const router = useRouter()

function goBack() {
  router.push('/admin/dashboard')
}

const celebrity = ref(null)
const relationsList = ref([])
const timeline = ref([])
const contents = ref({ biography: '', works: '', influence: '', anecdotes: '' })
const contentActive = ref('biography')

const contentTabs = [
  { key: 'biography', label: '📜 生平' },
  { key: 'works', label: '📖 著作' },
  { key: 'influence', label: '💡 影响' },
  { key: 'anecdotes', label: '🎭 轶事' },
]

const hasContents = computed(() =>
  Object.values(contents.value).some(v => v && v.length > 0)
)

const currentContent = computed(() => {
  const text = contents.value[contentActive.value]
  return text ? md.render(text) : ''
})

function renderMd(text) { return text ? md.render(text) : '' }

function tlTypeColor(type) {
  const map = { '升迁': '#67c23a', '贬谪': '#f56c6c', '创作': '#409eff', '婚丧': '#909399' }
  return map[type] || '#909399'
}

async function loadRelations() {
  const res = await relationApi.list({ celebrityId: route.params.id })
  const rels = res.data || []
  const id = Number(route.params.id)
  relationsList.value = rels.filter(r => {
    // from 方向只显示当前人为 source 的记录（反方向由对应的关系类型处理）
    if (r.type_direction === 'from') return r.source_id === id
    return true
  }).map(r => {
    const isSource = r.source_id === id
    const otherId = isSource ? r.target_id : r.source_id
    const otherName = isSource ? (r.target_chinese_name || r.target_name) : (r.source_chinese_name || r.source_name)
    return {
      key: r.id + '-' + r.type_id,
      otherId,
      otherName,
      arrow: r.type_direction || 'from',
      type_name: r.type_name || '',
      type_color: r.type_color || '#409eff',
      description: r.description,
    }
  })
}

async function loadTimeline() {
  const res = await contentApi.timeline(route.params.id)
  const raw = res.data || []
  raw.sort((a, b) => {
    const toYear = (s) => {
      const m = (s || '').match(/(?:公元前)?(\d+)/)
      if (!m) return 0
      return (s||'').includes('前') ? -Number(m[1]) : Number(m[1])
    }
    return toYear(a.event_date) - toYear(b.event_date)
  })
  timeline.value = raw
}

async function loadContents() {
  const res = await contentApi.get(route.params.id)
  contents.value = res.data || { biography: '', works: '', influence: '', anecdotes: '' }
}

async function load() {
  const res = await celebrityApi.get(route.params.id)
  celebrity.value = res.data
}

onMounted(async () => {
  await load()
  loadRelations()
  loadContents()
  loadTimeline()
})
</script>

<style scoped>
.admin-view { max-width: 1200px; }

/* ── 头部 ── */
.detail-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.back-arrow { width: 28px; height: 28px; border-radius: 50%; background: #fff; border: 1px solid #e4e7ed; color: #606266; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0; }
.back-arrow:hover { border-color: #409eff; color: #409eff; }
.detail-title { font-size: 18px; font-weight: 600; color: #303133; margin: 0; }
.title-name { color: #d97706; }

.view-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  margin-bottom: 0;
}
:deep(.view-card .el-card__header) {
  border-bottom: 1px solid #ebeef5;
  color: #303133;
  font-weight: 600;
  font-size: 15px;
}

/* ── 头像 ── */
.avatar-section { text-align: center; margin-bottom: 20px; }
.view-avatar {
  display: inline-block;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #6366f1);
  color: #fff;
  font-size: 36px;
  font-weight: 700;
  line-height: 100px;
  text-align: center;
  overflow: hidden;
}
.view-avatar img { width: 100%; height: 100%; object-fit: cover; }

/* ── 信息列表 ── */
.info-list { display: flex; flex-direction: column; gap: 8px; }
.info-row {
  display: flex;
  padding: 6px 0;
  border-bottom: 1px solid #f5f7fa;
}
.info-row:last-child { border-bottom: none; }
.info-label {
  width: 70px;
  flex-shrink: 0;
  color: #909399;
  font-size: 13px;
}
.info-value {
  flex: 1;
  color: #303133;
  font-size: 14px;
  word-break: break-word;
}
.info-value code {
  font-family: inherit;
  color: #606266;
}

/* ── 关系 ── */
.rel-list { display: flex; flex-direction: column; gap: 6px; }
.rel-item {
  display: flex; align-items: center;
  padding: 10px 14px; border-radius: 8px; border-left: 3px solid #409eff;
  background: #f5f7fa;
}
.rel-info { display: flex; align-items: center; gap: 8px; flex: 1; }
.rel-arrow { font-size: 13px; color: #909399; white-space: nowrap; }
.rel-name { font-weight: 500; color: #303133; }
.rel-desc { font-size: 12px; color: #909399; }

/* ── 内容标签页 ── */
.content-tabs {
  display: flex; gap: 0; margin-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}
.content-tab {
  padding: 8px 16px; cursor: pointer; font-size: 14px;
  color: #909399; border-bottom: 2px solid transparent;
  transition: all 0.2s;
}
.content-tab:hover { color: #409eff; }
.content-tab.active { color: #409eff; border-bottom-color: #409eff; }
.md-preview {
  padding: 8px 0; min-height: 120px;
  line-height: 1.8; font-size: 14px; color: #303133;
}
.md-preview h1, .md-preview h2, .md-preview h3 { margin: 16px 0 8px; font-weight: 600; }
.md-preview p { margin: 0 0 8px; }
.md-preview ul, .md-preview ol { padding-left: 20px; margin: 4px 0 8px; }
.md-preview code { background: #f0f2f5; padding: 1px 5px; border-radius: 3px; font-size: 13px; }

/* ── 时间线 ── */
.tl-list { display: flex; flex-direction: column; gap: 8px; }
.tl-item {
  display: flex; align-items: flex-start;
  padding: 10px 14px; border-radius: 8px; background: #f5f7fa;
}
.tl-info { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; flex: 1; }
.tl-date { font-size: 12px; color: #409eff; font-weight: 600; white-space: nowrap; }
.tl-title { font-size: 14px; color: #303133; }
.tl-desc { font-size: 12px; color: #909399; width: 100%; margin-top: 4px; }
.tl-type { border: none !important; font-size: 11px; padding: 0 6px; line-height: 18px; border-radius: 3px; }
</style>
