<template>
  <div class="detail" v-loading="loading">
    <el-button text :icon="ArrowLeft" @click="$router.push('/celebrities')" class="back-btn">返回列表</el-button>

    <template v-if="celebrity">
      <el-card shadow="never" class="profile-card">
        <div class="profile">
        <div class="avatar-wrap">
          <div class="avatar" @click="auth.isLoggedIn && triggerUpload()">
            <img v-if="celebrity.image_url" :src="'/img/' + celebrity.image_url" :alt="celebrity.chinese_name || celebrity.name" />
            <span v-else>{{ (celebrity.chinese_name || celebrity.name).charAt(0) }}</span>
          </div>
          <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="uploadImage" />
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
              <el-button size="small" type="primary" @click="openAdd" v-if="auth.isLoggedIn">新增</el-button>
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
            <div class="rel-actions">
              <el-button text size="small" @click="openEdit(r)" v-if="auth.isLoggedIn">修改</el-button>
              <el-popconfirm title="确定删除此关系？" @confirm="deleteRel(r)" v-if="auth.isLoggedIn">
                <template #reference>
                  <el-button text size="small" type="danger">删除</el-button>
                </template>
              </el-popconfirm>
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
          <el-button text size="small" type="primary" @click="editContent('biography')" style="margin-top:8px" v-if="auth.isLoggedIn">编辑</el-button>
        </el-collapse-item>
        <el-collapse-item title="📖著作" name="works">
          <div class="content-text md" v-if="contents.works" v-html="renderMd(contents.works)"></div>
          <el-empty v-else description="暂无内容" :image-size="40" />
          <el-button text size="small" type="primary" @click="editContent('works')" style="margin-top:8px" v-if="auth.isLoggedIn">编辑</el-button>
        </el-collapse-item>
        <el-collapse-item title="💡影响" name="influence">
          <div class="content-text md" v-if="contents.influence" v-html="renderMd(contents.influence)"></div>
          <el-empty v-else description="暂无内容" :image-size="40" />
          <el-button text size="small" type="primary" @click="editContent('influence')" style="margin-top:8px" v-if="auth.isLoggedIn">编辑</el-button>
        </el-collapse-item>
        <el-collapse-item title="🎭轶事" name="anecdotes">
          <div class="content-text md" v-if="contents.anecdotes" v-html="renderMd(contents.anecdotes)"></div>
          <el-empty v-else description="暂无内容" :image-size="40" />
          <el-button text size="small" type="primary" @click="editContent('anecdotes')" style="margin-top:8px" v-if="auth.isLoggedIn">编辑</el-button>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <!-- 时间线 -->
    <el-card shadow="never" class="rel-card" v-if="celebrity">
      <template #header>
        <div class="card-header">
          <span>时间线</span>
          <el-button size="small" type="primary" @click="openTimelineAdd" v-if="auth.isLoggedIn">新增事件</el-button>
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
            <div class="tl-actions">
              <el-button text size="small" @click="openTimelineEdit(ev)" v-if="auth.isLoggedIn">编辑</el-button>
              <el-popconfirm title="确定删除？" @confirm="deleteTimelineEv(ev.id)" v-if="auth.isLoggedIn">
                <template #reference>
                  <el-button text size="small" type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无时间线事件" :image-size="40" />
    </el-card>

    <el-empty v-if="!loading && !celebrity" description="未找到该名人" />

    <el-dialog v-model="relDialog" :title="editingRel ? '修改关系' : '新增关系'" width="420px">
      <el-form :model="relForm" label-width="70px" size="small">
        <el-form-item label="人物">
          <el-select v-model="relForm.targetId" filterable placeholder="选择人物" style="width:100%">
            <el-option v-for="c in allCelebrities" :key="c.id" :label="c.chinese_name || c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="关系">
          <el-select v-model="relForm.typeId" placeholder="选择关系" style="width:100%">
            <el-option v-for="t in allTypes" :key="t.id" :label="t.name" :value="t.id">
              <span>{{ t.name }}</span>
              <span style="float:right;font-size:12px;color:#909399">({{ t.category }})</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="relForm.description" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="relDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRel" :loading="relSaving">确定</el-button>
      </template>
    </el-dialog>

    <!-- 内容编辑对话框 -->
    <el-dialog v-model="contentDialog" :title="contentTitle" width="560px">
      <el-input v-model="contentText" type="textarea" :rows="10" />
      <template #footer>
        <el-button @click="contentDialog = false">取消</el-button>
        <el-button type="primary" @click="saveContent" :loading="contentSaving">确定</el-button>
      </template>
    </el-dialog>

    <!-- 时间线事件对话框 -->
    <el-dialog v-model="tlDialog" :title="editingTl ? '编辑事件' : '新增事件'" width="480px">
      <el-form :model="tlForm" label-width="70px" size="small">
        <el-form-item label="日期">
          <el-input v-model="tlForm.event_date" placeholder="如：1037年 / 元丰二年" />
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="tlForm.title" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="tlForm.event_type" style="width:100%">
            <el-option label="升迁" value="升迁" />
            <el-option label="贬谪" value="贬谪" />
            <el-option label="创作" value="创作" />
            <el-option label="婚丧" value="婚丧" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="tlForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tlDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTimelineEv" :loading="tlSaving">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { celebrityApi, relationApi, contentApi } from '../api/index.js'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { displayNationality } from '../utils/dynasty.js'
import api from '../api/index.js'
import MarkdownIt from 'markdown-it'
import { useAuthStore } from '../stores/auth.js'

const auth = useAuthStore()

const md = new MarkdownIt({ html: true, linkify: true })

function renderMd(text) {
  return text ? md.render(text) : ''
}

const route = useRoute()
const router = useRouter()
const celebrity = ref(null)
const loading = ref(false)
const allCelebrities = ref([])
const allTypes = ref([])
const fileInput = ref(null)
const uploading = ref(false)

function triggerUpload() {
  fileInput.value?.click()
}

async function uploadImage(event) {
  const file = event.target.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('avatar', file)
    const res = await api.post('/upload/' + route.params.id, fd)
    if (res.data.success) {
      ElMessage.success('头像上传成功')
      load()
    }
  } catch (e) {
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
    event.target.value = ''
  }
}

const relationsList = computed(() => {
  const raw = celebrity.value?.relations || []
  const seen = new Set()
  const result = []
  for (const r of raw) {
    // from 方向的关系只显示当前人物作为 source 的条目（"苏轼的老师"而非"欧阳修的学生"）
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

const relDialog = ref(false)
const editingRel = ref(null)
const relSaving = ref(false)
const relForm = ref({ targetId: null, typeId: null, description: '' })

function openAdd() {
  editingRel.value = null
  relForm.value = { targetId: null, typeId: null, description: '' }
  relDialog.value = true
}

function openEdit(r) {
  editingRel.value = r
  relForm.value = {
    targetId: r.otherId,
    typeId: r.type_id,
    description: r.description || '',
  }
  relDialog.value = true
}

async function saveRel() {
  if (!relForm.value.targetId || !relForm.value.typeId) {
    return ElMessage.warning('请选择人物和关系')
  }
  relSaving.value = true
  try {
    if (editingRel.value) {
      await relationApi.remove(editingRel.value.id)
      await relationApi.create({
        source_id: celebrity.value.id,
        target_id: relForm.value.targetId,
        type_id: relForm.value.typeId,
        description: relForm.value.description || undefined,
      })
      ElMessage.success('关系已更新')
    } else {
      await relationApi.create({
        source_id: celebrity.value.id,
        target_id: relForm.value.targetId,
        type_id: relForm.value.typeId,
        description: relForm.value.description || undefined,
      })
      ElMessage.success('关系已添加')
    }
    relDialog.value = false
    load()
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    relSaving.value = false
  }
}

async function deleteRel(r) {
  await relationApi.remove(r.id)
  ElMessage.success('已删除')
  load()
}

// ── 扩展内容 ──
const contents = ref({ biography: '', works: '', influence: '', anecdotes: '' })
const activeSections = ref([])
const contentDialog = ref(false)
const editingField = ref('')
const contentText = ref('')
const contentSaving = ref(false)

const contentTitle = computed(() => {
  const map = { biography: '编辑生平', works: '编辑著作', influence: '编辑影响', anecdotes: '编辑轶事' }
  return map[editingField.value] || '编辑'
})

function editContent(field) {
  editingField.value = field
  contentText.value = contents.value[field] || ''
  contentDialog.value = true
}

async function saveContent() {
  contentSaving.value = true
  try {
    const payload = {}
    payload[editingField.value] = contentText.value
    await contentApi.save(route.params.id, payload)
    contents.value[editingField.value] = contentText.value
    ElMessage.success('保存成功')
    contentDialog.value = false
  } finally {
    contentSaving.value = false
  }
}

// ── 时间线 ──
const timeline = ref([])
const tlDialog = ref(false)
const editingTl = ref(null)
const tlSaving = ref(false)
const tlForm = ref({ event_date: '', title: '', event_type: '其他', description: '' })

function openTimelineAdd() {
  editingTl.value = null
  tlForm.value = { event_date: '', title: '', event_type: '其他', description: '' }
  tlDialog.value = true
}

function openTimelineEdit(ev) {
  editingTl.value = ev
  tlForm.value = {
    event_date: ev.event_date,
    title: ev.title,
    event_type: ev.event_type,
    description: ev.description,
  }
  tlDialog.value = true
}

async function saveTimelineEv() {
  if (!tlForm.value.event_date || !tlForm.value.title) {
    return ElMessage.warning('日期和标题为必填项')
  }
  tlSaving.value = true
  try {
    if (editingTl.value) {
      await contentApi.updateTimeline(editingTl.value.id, tlForm.value)
      ElMessage.success('已更新')
    } else {
      await contentApi.addTimeline(route.params.id, tlForm.value)
      ElMessage.success('已添加')
    }
    tlDialog.value = false
    loadTimeline()
  } finally {
    tlSaving.value = false
  }
}

async function deleteTimelineEv(id) {
  await contentApi.deleteTimeline(id)
  ElMessage.success('已删除')
  loadTimeline()
}

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

async function loadTimeline() {
  const res = await contentApi.timeline(route.params.id)
  const raw = res.data || []
  // 年份转数值用于排序：公元前551 → -551，1037 → 1037
  raw.sort((a, b) => {
    const toYear = (s) => {
      const m = (s || '').match(/(?:公元前)?(\d+)/)
      if (!m) return 0
      return (s||'').includes('公元前') ? -Number(m[1]) : Number(m[1])
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
  const [typesRes, listRes] = await Promise.all([
    relationApi.types(),
    celebrityApi.list({ pageSize: 200 }),
  ])
  allTypes.value = typesRes.data || []
  allCelebrities.value = listRes.data || []
})
</script>

<style scoped>
.detail { max-width: 800px; margin: 0 auto; }
.back-btn { margin-bottom: 16px; }
.profile-card { border-radius: 12px; margin-bottom: 20px; }
.profile { display: flex; gap: 20px; align-items: flex-start; padding: 12px 0; }
.profile-img { width: 140px; height: 140px; flex-shrink: 0; border-radius: 8px; overflow: hidden; margin-left: auto; background: #f0f2f5; }
.profile-img img { width: 100%; height: 100%; object-fit: cover; }
.avatar { width: 72px; height: 72px; line-height: 72px; border-radius: 50%; background: linear-gradient(135deg, #409eff, #6366f1); color: #fff; font-size: 28px; font-weight: 700; text-align: center; cursor: pointer; overflow: hidden; }
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
.rel-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 8px; border-left: 3px solid #409eff; background: #f8f9fb; transition: background 0.2s; }
.rel-item:hover { background: #f0f2f5; }
.rel-info { display: flex; align-items: center; gap: 8px; flex: 1; }
.rel-arrow { font-size: 16px; color: #c0c4cc; width: 18px; text-align: center; }
.rel-name { font-weight: 500; cursor: pointer; }
.rel-name:hover { color: #409eff; }
.rel-tag { font-size: 11px; }
.rel-desc { font-size: 12px; color: #909399; }
.rel-actions { display: flex; gap: 4px; flex-shrink: 0; }

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
.tl-actions { margin-top: 6px; }
</style>
