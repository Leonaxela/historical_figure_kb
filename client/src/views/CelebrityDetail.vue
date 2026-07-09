<template>
  <div class="detail" v-loading="loading">
    <el-button text :icon="ArrowLeft" @click="$router.push('/celebrities')" class="back-btn">返回列表</el-button>

    <template v-if="celebrity">
      <el-card shadow="never" class="profile-card">
        <div class="profile">
          <div class="avatar-wrap">
            <div class="avatar">
              <img v-if="celebrity.image_url" :src="'/img/' + celebrity.image_url" :alt="celebrity.chinese_name || celebrity.name" />
              <span v-else>{{ (celebrity.chinese_name || celebrity.name).charAt(0) }}</span>
            </div>
          </div>
          <div class="info">
            <h1 class="name">{{ celebrity.chinese_name || celebrity.name }}</h1>
            <div class="en-name" v-if="celebrity.chinese_name">{{ celebrity.name }}</div>
            <div class="meta">
              <el-tag v-if="celebrity.nationality">{{ displayNationality(celebrity) }}</el-tag>
              <template v-for="occ in (celebrity.occupation || '').split('、')" :key="occ">
                <el-tag type="success" v-if="occ" style="margin-left:6px">{{ occ }}</el-tag>
              </template>
            </div>
            <div class="dates" v-if="celebrity.birth_date">
              <span>{{ celebrity.birth_date }} ~ {{ celebrity.death_date || '至今' }}</span>
            </div>
          </div>
          <div class="profile-img" v-if="celebrity.image_url">
            <img :src="'/img/' + celebrity.image_url" :alt="celebrity.chinese_name || celebrity.name" />
          </div>
        </div>
        <p class="bio" v-if="celebrity.biography">{{ celebrity.biography }}</p>
      </el-card>

      <el-card shadow="never" class="rel-card">
        <template #header>
          <div class="card-header">
            <span>🔗关系网络 ({{ relationsList.length }} 条)</span>
            <div class="header-actions">
              <el-button size="small" type="primary" @click="$router.push('/graph?centerId=' + celebrity.id)">展开完整图谱</el-button>
            </div>
          </div>
        </template>
        <div class="rel-list" v-if="relationsList.length">
          <div v-for="r in relationsList" :key="r.key" class="rel-item" :style="{ borderLeftColor: r.type_color }">
            <div class="rel-info">
              <span class="rel-arrow">{{ r.arrow }}</span>
              <span class="rel-name" @click="$router.push('/celebrities/' + r.otherId)">{{ r.otherName }}</span>
              <el-tag :color="r.type_color" class="rel-tag" size="small" effect="dark">{{ r.type_name }}</el-tag>
              <span class="rel-desc" v-if="r.description">{{ r.description }}</span>
            </div>
          </div>
        </div>
        <el-empty v-if="!relationsList.length" description="暂无关系" :image-size="60" />
      </el-card>
    </template>

    <!-- 生平、著作、影响、轶事 -->
    <el-card shadow="never" class="rel-card" v-if="celebrity">
      <el-collapse v-model="activeSections" class="content-collapse">
        <el-collapse-item title="📜生平" name="bio">
          <div class="content-text md" v-if="contents.biography" v-html="renderMd(contents.biography)"></div>
          <el-empty v-else description="暂无内容" :image-size="40" />
        </el-collapse-item>
        <el-collapse-item title="📖著作" name="works">
          <div class="content-text md" v-if="contents.works" v-html="renderMd(contents.works)"></div>
          <el-empty v-else description="暂无内容" :image-size="40" />
        </el-collapse-item>
        <el-collapse-item title="💡影响" name="influence">
          <div class="content-text md" v-if="contents.influence" v-html="renderMd(contents.influence)"></div>
          <el-empty v-else description="暂无内容" :image-size="40" />
        </el-collapse-item>
        <el-collapse-item title="🎭轶事" name="anecdotes">
          <div class="content-text md" v-if="contents.anecdotes" v-html="renderMd(contents.anecdotes)"></div>
          <el-empty v-else description="暂无内容" :image-size="40" />
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <!-- 时间线 -->
    <el-card shadow="never" class="rel-card" v-if="celebrity">
      <template #header>
        <div class="card-header">
          <span>时间线</span>
        </div>
      </template>
      <div class="timeline-wrap" v-if="timeline.length">
        <div class="tl-item" v-for="ev in timeline" :key="ev.id">
          <div class="tl-dot" :class="'tl-' + ev.event_type"></div>
          <div class="tl-line"></div>
          <div class="tl-body">
            <div class="tl-date">{{ ev.event_date }}</div>
            <div class="tl-title">{{ ev.title }}</div>
            <div class="tl-desc" v-if="ev.description">{{ ev.description }}</div>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无时间线事件" :image-size="40" />
    </el-card>

    <el-empty v-if="!loading && !celebrity" description="未找到该名人" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { celebrityApi, relationApi, contentApi } from '../api/index.js'
import { ArrowLeft } from '@element-plus/icons-vue'
import { displayNationality } from '../utils/dynasty.js'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({ html: true, linkify: true })

function renderMd(text) {
  return text ? md.render(text) : ''
}

const route = useRoute()
const router = useRouter()
const celebrity = ref(null)
const loading = ref(false)

const relationsList = computed(() => {
  const raw = celebrity.value?.relations || []
  const seen = new Set()
  const result = []
  for (const r of raw) {
    const isSource = Number(r.source_id) === celebrity.value.id
    if (r.type_direction === 'from' && !isSource) continue

    const a = Math.min(Number(r.source_id), Number(r.target_id))
    const b = Math.max(Number(r.source_id), Number(r.target_id))
    const key = a + '-' + b + '-' + r.type_id
    if (seen.has(key)) continue
    seen.add(key)

    result.push({
      ...r,
      key,
      arrow: isSource ? '→' : '←',
      otherId: isSource ? Number(r.target_id) : Number(r.source_id),
      otherName: isSource ? (r.target_chinese_name || r.target_name) : (r.source_chinese_name || r.source_name),
    })
  }
  return result
})

// ── 扩展内容 ──
const contents = ref({ biography: '', works: '', influence: '', anecdotes: '' })
const activeSections = ref([])

async function loadContents() {
  const res = await contentApi.get(route.params.id)
  contents.value = res.data || { biography: '', works: '', influence: '', anecdotes: '' }
  const sections = []
  if (contents.value.biography) sections.push('bio')
  if (contents.value.works) sections.push('works')
  if (contents.value.influence) sections.push('influence')
  if (contents.value.anecdotes) sections.push('anecdotes')
  activeSections.value = sections
}

// ── 时间线 ──
const timeline = ref([])

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

async function load() {
  loading.value = true
  try {
    const res = await celebrityApi.get(route.params.id)
    celebrity.value = res.data
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  load()
  loadContents()
  loadTimeline()
})
</script>

<style scoped>
.detail { max-width: 800px; margin: 0 auto; }
.back-btn { margin-bottom: 16px; }
.profile-card { border-radius: 12px; margin-bottom: 20px; }
.profile { display: flex; gap: 20px; align-items: flex-start; padding: 12px 0; }
.profile-img { width: 140px; height: 140px; flex-shrink: 0; border-radius: 8px; overflow: hidden; margin-left: auto; background: #f0f2f5; }
.profile-img img { width: 100%; height: 100%; object-fit: cover; }
.avatar { width: 72px; height: 72px; line-height: 72px; border-radius: 50%; background: linear-gradient(135deg, #409eff, #6366f1); color: #fff; font-size: 28px; font-weight: 700; text-align: center; overflow: hidden; }
.avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.avatar-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; }
.info { flex: 1; }
.name { font-size: 26px; font-weight: 700; margin-bottom: 4px; }
.en-name { font-size: 14px; color: #909399; margin-bottom: 6px; }
.meta { margin-bottom: 6px; }
.dates { font-size: 13px; color: #909399; }
.bio { margin-top: 12px; line-height: 1.7; color: #606266; }
.rel-card { border-radius: 12px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-actions { display: flex; gap: 8px; }
.rel-list { display: flex; flex-direction: column; gap: 6px; }
.rel-item { display: flex; align-items: center; padding: 10px 12px; border-radius: 8px; border-left: 3px solid #409eff; background: #f8f9fb; transition: background 0.2s; }
.rel-item:hover { background: #f0f2f5; }
.rel-info { display: flex; align-items: center; gap: 8px; flex: 1; }
.rel-arrow { font-size: 16px; color: #c0c4cc; width: 18px; text-align: center; }
.rel-name { font-weight: 500; cursor: pointer; }
.rel-name:hover { color: #409eff; }
.rel-tag { font-size: 11px; }
.rel-desc { font-size: 12px; color: #909399; }

.content-collapse { border-top: none; }
.content-text { white-space: pre-wrap; line-height: 1.8; font-size: 14px; color: #303133; }
.content-text.md { white-space: normal; }
.content-text.md h1, .content-text.md h2, .content-text.md h3 { margin: 16px 0 8px; font-weight: 600; }
.content-text.md p { margin: 0 0 8px; }
.content-text.md ul, .content-text.md ol { padding-left: 20px; margin: 4px 0 8px; }
.content-text.md li { margin-bottom: 2px; }
.content-text.md strong { font-weight: 600; }
.content-text.md em { font-style: italic; }
.content-text.md blockquote { border-left: 3px solid #409eff; padding: 6px 12px; margin: 8px 0; background: #f8f9fb; border-radius: 4px; color: #606266; }
.content-text.md code { background: #f0f2f5; padding: 1px 5px; border-radius: 3px; font-size: 13px; }

.timeline-wrap { position: relative; padding-left: 28px; }
.tl-item { position: relative; padding-bottom: 24px; }
.tl-item:last-child { padding-bottom: 0; }
.tl-item:last-child .tl-line { display: none; }
.tl-dot {
  position: absolute; left: -20px; top: 4px;
  width: 12px; height: 12px; border-radius: 50%;
  border: 2px solid #409eff; background: #fff; z-index: 1;
}
.tl-dot.tl-升迁 { border-color: #67c23a; }
.tl-dot.tl-贬谪 { border-color: #f56c6c; }
.tl-dot.tl-创作 { border-color: #e6a23c; }
.tl-dot.tl-婚丧 { border-color: #f89898; }
.tl-line {
  position: absolute; left: -15px; top: 16px; bottom: 0;
  width: 2px; background: #e4e7ed;
}
.tl-body { padding-left: 4px; }
.tl-date { font-size: 12px; color: #909399; margin-bottom: 2px; }
.tl-title { font-size: 15px; font-weight: 600; color: #303133; margin-bottom: 4px; }
.tl-desc { font-size: 13px; color: #606266; line-height: 1.6; white-space: pre-wrap; }
</style>
