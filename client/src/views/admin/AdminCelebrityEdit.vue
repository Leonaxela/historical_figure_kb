<template>
  <div class="admin-edit" v-loading="loading">
    <el-button text :icon="ArrowLeft" @click="$router.push('/admin/celebrities')" class="back-btn">返回列表</el-button>

    <template v-if="celebrity">
      <el-row :gutter="20">
        <!-- 基本信息 -->
        <el-col :span="8">
          <el-card class="edit-card">
            <template #header><span>基本信息</span></template>
            <div class="avatar-section">
              <div class="edit-avatar" @click="triggerUpload">
                <img v-if="celebrity.image_url" :src="'/img/' + celebrity.image_url" />
                <span v-else>{{ (celebrity.chinese_name || celebrity.name).charAt(0) }}</span>
                <div class="avatar-overlay">更换头像</div>
              </div>
              <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="uploadImage" />
            </div>
            <el-form :model="editForm" label-width="70px" size="small">
              <el-form-item label="英文名">
                <el-input v-model="editForm.name" />
              </el-form-item>
              <el-form-item label="中文名">
                <el-input v-model="editForm.chinese_name" />
              </el-form-item>
              <el-form-item label="国籍">
                <el-input v-model="editForm.nationality" />
              </el-form-item>
              <el-form-item label="朝代" v-if="editForm.nationality === '中国'">
                <el-select v-model="editDynasty" placeholder="选择朝代" clearable style="width:100%" @change="onEditDynastyChange">
                  <el-option v-for="d in dynasties" :key="d.id" :label="d.label" :value="d.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="职业">
                <el-input v-model="editForm.occupation" />
              </el-form-item>
              <el-form-item label="出生">
                <el-input v-model="editForm.birth_date" />
              </el-form-item>
              <el-form-item label="逝世">
                <el-input v-model="editForm.death_date" />
              </el-form-item>
              <el-form-item label="his_id">
                <code class="his-id">{{ editForm.his_id }}</code>
              </el-form-item>
              <el-form-item label="简介">
                <el-input v-model="editForm.biography" type="textarea" :rows="4" />
              </el-form-item>
              <el-form-item>
                <div style="text-align:right;width:100%">
                  <el-button type="primary" @click="saveProfile" :loading="saving">保存修改</el-button>
                </div>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>

        <!-- 关系管理 + 内容管理 -->
        <el-col :span="16">
          <!-- 关系网络 -->
          <el-card class="edit-card">
            <template #header>
              <div class="card-header">
                <span>🔗 关系网络 ({{ relationsList.length }} 条)</span>
                <el-button size="small" type="primary" @click="openRelAdd">添加关系</el-button>
              </div>
            </template>
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
                <div class="rel-actions">
                  <el-button size="small" @click="openRelEdit(r)">修改</el-button>
                  <el-popconfirm title="确定删除此关系？" :width="160" @confirm="deleteRel(r)">
                    <template #reference><el-button size="small" type="danger">删除</el-button></template>
                  </el-popconfirm>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无关系" :image-size="40" />
          </el-card>

          <!-- 内容管理 -->
          <el-card class="edit-card" style="margin-top:16px">
            <template #header><span>📝 扩展内容</span></template>
            <el-tabs v-model="contentTab">
              <el-tab-pane label="📜生平" name="biography">
                <div v-if="previewTab === 'biography'" class="md-preview" v-html="renderMd(contents.biography)"></div>
                <el-input v-else v-model="contents.biography" type="textarea" :rows="8" />
                <div class="tab-footer">
                  <el-button size="small" @click="openFullscreen('biography')">全屏</el-button>
                  <el-button size="small" @click="togglePreview('biography')">{{ previewTab === 'biography' ? '编辑' : '预览' }}</el-button>
                  <el-button size="small" type="primary" @click="saveContents" :loading="contentSaving">保存全部内容</el-button>
                </div>
              </el-tab-pane>
              <el-tab-pane label="📖著作" name="works">
                <div v-if="previewTab === 'works'" class="md-preview" v-html="renderMd(contents.works)"></div>
                <el-input v-else v-model="contents.works" type="textarea" :rows="8" />
                <div class="tab-footer">
                  <el-button size="small" @click="openFullscreen('works')">全屏</el-button>
                  <el-button size="small" @click="togglePreview('works')">{{ previewTab === 'works' ? '编辑' : '预览' }}</el-button>
                  <el-button size="small" type="primary" @click="saveContents" :loading="contentSaving">保存全部内容</el-button>
                </div>
              </el-tab-pane>
              <el-tab-pane label="💡影响" name="influence">
                <div v-if="previewTab === 'influence'" class="md-preview" v-html="renderMd(contents.influence)"></div>
                <el-input v-else v-model="contents.influence" type="textarea" :rows="8" />
                <div class="tab-footer">
                  <el-button size="small" @click="openFullscreen('influence')">全屏</el-button>
                  <el-button size="small" @click="togglePreview('influence')">{{ previewTab === 'influence' ? '编辑' : '预览' }}</el-button>
                  <el-button size="small" type="primary" @click="saveContents" :loading="contentSaving">保存全部内容</el-button>
                </div>
              </el-tab-pane>
              <el-tab-pane label="🎭轶事" name="anecdotes">
                <div v-if="previewTab === 'anecdotes'" class="md-preview" v-html="renderMd(contents.anecdotes)"></div>
                <el-input v-else v-model="contents.anecdotes" type="textarea" :rows="8" />
                <div class="tab-footer">
                  <el-button size="small" @click="openFullscreen('anecdotes')">全屏</el-button>
                  <el-button size="small" @click="togglePreview('anecdotes')">{{ previewTab === 'anecdotes' ? '编辑' : '预览' }}</el-button>
                  <el-button size="small" type="primary" @click="saveContents" :loading="contentSaving">保存全部内容</el-button>
                </div>
              </el-tab-pane>
            </el-tabs>
          </el-card>

          <!-- 时间线 -->
          <el-card class="edit-card" style="margin-top:16px">
            <template #header>
              <div class="card-header">
                <span>⏱ 时间线</span>
                <el-button size="small" type="primary" @click="openTimelineAdd">新增事件</el-button>
              </div>
            </template>
            <div class="tl-list" v-if="timeline.length">
              <div class="tl-item" v-for="ev in timeline" :key="ev.id">
                <div class="tl-info">
                  <span class="tl-date">{{ ev.event_date }}</span>
                  <strong class="tl-title">{{ ev.title }}</strong>
                  <el-tag size="small" class="tl-type" :color="tlTypeColor(ev.event_type)" effect="dark">{{ ev.event_type }}</el-tag>
                  <span class="tl-desc" v-if="ev.description">{{ ev.description }}</span>
                </div>
                <div class="tl-actions">
                  <el-button size="small" @click="openTimelineEdit(ev)">修改</el-button>
                  <el-popconfirm title="确定删除？" @confirm="deleteTimelineEv(ev.id)">
                    <template #reference><el-button size="small" type="danger">删除</el-button></template>
                  </el-popconfirm>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无时间线事件" :image-size="40" />
          </el-card>
        </el-col>
      </el-row>
    </template>

    <!-- 关系对话框 -->
    <el-dialog v-model="relDialog" :title="editingRel ? '修改关系' : '添加关系'" width="420px" class="dark-dialog">
      <el-form :model="relForm" label-width="60px" size="small">
        <el-form-item label="人物">
          <el-select v-model="relForm.targetId" filterable placeholder="选择人物" style="width:100%">
            <el-option v-for="c in allCelebrities" :key="c.id" :label="c.chinese_name || c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="关系">
          <el-select v-model="relForm.typeId" placeholder="选择关系" style="width:100%">
            <el-option v-for="t in allTypes" :key="t.id" :label="t.name" :value="t.id">
              <span>{{ t.name }}</span>
              <span style="float:right;font-size:12px;color:#5a5f6e">({{ t.category }})</span>
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

    <!-- 时间线对话框 -->
    <el-dialog v-model="tlDialog" :title="editingTl ? '编辑事件' : '新增事件'" width="480px" class="dark-dialog">
      <el-form :model="tlForm" label-width="60px" size="small">
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

    <!-- 全屏编辑器 -->
    <div class="fs-overlay" v-if="fullscreenTab" @keydown.esc="closeFullscreen" tabindex="0">
      <div class="fs-header">
        <span class="fs-title">编辑 <span class="fs-name">{{ (celebrity?.chinese_name || celebrity?.name) }}</span> {{ tabLabels[fullscreenTab] }}</span>
        <div class="fs-actions">
          <el-button size="small" @click="fsPreview = !fsPreview">{{ fsPreview ? '编辑' : '预览' }}</el-button>
          <el-button size="small" @click="saveContents" :loading="contentSaving">保存</el-button>
          <span class="fs-toast" :class="fsToastType" v-if="fsToast">{{ fsToast }}</span>
          <el-button size="small" @click="closeFullscreen">退出全屏</el-button>
        </div>
      </div>
      <div class="fs-body">
        <div v-if="fsPreview" class="fs-preview md-preview" v-html="renderMd(contents[fullscreenTab])"></div>
        <textarea v-else class="fs-textarea" v-model="contents[fullscreenTab]"></textarea>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { celebrityApi, relationApi, contentApi } from '../../api/index.js'
import api from '../../api/index.js'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'
import ArrowFrom from '../../components/ArrowFrom.vue'
import ArrowNone from '../../components/ArrowNone.vue'
import ArrowBoth from '../../components/ArrowBoth.vue'

const md = new MarkdownIt({ html: true, linkify: true })

const route = useRoute()
const router = useRouter()
const celebrity = ref(null)
const loading = ref(false)
const saving = ref(false)
const fileInput = ref(null)

const editForm = ref({})
const editDynasty = ref('')
const dynasties = Object.entries({ chunqiu:'春秋', zhanguo:'战国', qin:'秦', xihan:'西汉', donghan:'东汉', sanguo:'三国', xijin:'西晋', dongjin:'东晋', nanbei:'南北朝', sui:'隋', tang:'唐', beisong:'北宋', nansong:'南宋', yuan:'元', ming:'明', qing:'清' }).map(([id, label]) => ({ id, label }))

function onEditDynastyChange(val) {
  if (val) {
    editForm.value.nationality = '中国'
  }
}

async function saveProfile() {
  saving.value = true
  try {
    const data = { ...editForm.value }
    // 如果有朝代，组合成 中国_春秋 格式保存
    if (editDynasty.value && data.nationality === '中国') {
      const found = dynasties.find(d => d.id === editDynasty.value)
      data.nationality = '中国_' + (found ? found.label : editDynasty.value)
    }
    await celebrityApi.update(route.params.id, data)
    ElMessage.success('保存成功')
    load()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// ── 头像上传 ──
function triggerUpload() { fileInput.value?.click() }
async function uploadImage(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const fd = new FormData()
  fd.append('avatar', file)
  try {
    await api.post('/upload/' + route.params.id, fd)
    ElMessage.success('头像上传成功')
    load()
  } catch { ElMessage.error('上传失败') }
  e.target.value = ''
}

// ── 关系 ──
const relationsList = computed(() => {
  const raw = celebrity.value?.relations || []
  const seen = new Set()
  const result = []
  for (const r of raw) {
    const isSource = Number(r.source_id) === Number(celebrity.value.id)
    if (r.type_direction === 'from' && !isSource) continue
    const a = Math.min(Number(r.source_id), Number(r.target_id))
    const b = Math.max(Number(r.source_id), Number(r.target_id))
    const key = a + '-' + b + '-' + r.type_id
    if (seen.has(key)) continue
    seen.add(key)
    result.push({
      ...r, key,
      arrow: r.type_direction || 'from',
      otherId: isSource ? Number(r.target_id) : Number(r.source_id),
      otherName: isSource ? (r.target_chinese_name || r.target_name) : (r.source_chinese_name || r.source_name),
    })
  }
  return result
})

const allCelebrities = ref([])
const allTypes = ref([])
const relDialog = ref(false)
const editingRel = ref(null)
const relSaving = ref(false)
const relForm = ref({ targetId: null, typeId: null, description: '' })

function openRelAdd() {
  editingRel.value = null
  relForm.value = { targetId: null, typeId: null, description: '' }
  relDialog.value = true
}
async function openRelEdit(r) {
  editingRel.value = r
  relForm.value = { targetId: r.otherId, typeId: r.type_id, description: r.description || '' }
  relDialog.value = true
  // 如果 allCelebrities 中缺目标人物，单独补充
  if (!allCelebrities.value.some(c => c.id === r.otherId)) {
    const res = await celebrityApi.get(r.otherId)
    if (res.data) allCelebrities.value.push(res.data)
  }
}
async function saveRel() {
  if (!relForm.value.targetId || !relForm.value.typeId)
    return ElMessage.warning('请选择人物和关系')
  relSaving.value = true
  try {
    if (editingRel.value) {
      await relationApi.remove(editingRel.value.id)
      await relationApi.create({ source_id: celebrity.value.id, target_id: relForm.value.targetId, type_id: relForm.value.typeId, description: relForm.value.description || undefined })
      ElMessage.success('关系已更新')
    } else {
      await relationApi.create({ source_id: celebrity.value.id, target_id: relForm.value.targetId, type_id: relForm.value.typeId, description: relForm.value.description || undefined })
      ElMessage.success('关系已添加')
    }
    relDialog.value = false
    load()
  } catch (e) { ElMessage.error(e?.response?.data?.message || '操作失败') }
  finally { relSaving.value = false }
}
async function deleteRel(r) {
  await relationApi.remove(r.id)
  ElMessage.success('已删除')
  load()
}

// ── 内容管理 ──
const contentTab = ref('biography')
const contents = ref({ biography: '', works: '', influence: '', anecdotes: '' })
const contentSaving = ref(false)
const previewTab = ref(null)
const fullscreenTab = ref(null)
const fsPreview = ref(false)
const tabLabels = { biography: '生平', works: '著作', influence: '影响', anecdotes: '轶事' }

const TL_COLORS = { '升迁': '#67c23a', '贬谪': '#f56c6c', '创作': '#e6a23c', '婚丧': '#909399', '其他': '#409eff' }
function tlTypeColor(type) { return TL_COLORS[type] || '#909399' }

function renderMd(text) { return text ? md.render(text) : '' }
function togglePreview(tab) { previewTab.value = previewTab.value === tab ? null : tab }
function openFullscreen(tab) { fullscreenTab.value = tab; fsPreview.value = false; document.body.style.overflow = 'hidden' }
function closeFullscreen() { fullscreenTab.value = null; document.body.style.overflow = '' }

async function saveContents() {
  contentSaving.value = true
  try {
    await contentApi.save(route.params.id, contents.value)
    ElMessage.success('内容已保存')
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '保存失败')
  } finally { contentSaving.value = false }
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
  tlForm.value = { event_date: ev.event_date, title: ev.title, event_type: ev.event_type, description: ev.description }
  tlDialog.value = true
}
async function saveTimelineEv() {
  if (!tlForm.value.event_date || !tlForm.value.title) return ElMessage.warning('日期和标题为必填项')
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
  } finally { tlSaving.value = false }
}
async function deleteTimelineEv(id) {
  await contentApi.deleteTimeline(id)
  ElMessage.success('已删除')
  loadTimeline()
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
  loading.value = true
  try {
    const res = await celebrityApi.get(route.params.id)
    celebrity.value = res.data
    editForm.value = { ...res.data }
    // 解析 nationality 用于展示：中国_春秋 → 国籍=中国 + 下拉=春秋
    if (editForm.value.nationality?.startsWith('中国_')) {
      const label = editForm.value.nationality.replace('中国_', '')
      const found = dynasties.find(d => d.label === label)
      if (found) {
        editDynasty.value = found.id
        editForm.value.nationality = '中国'
      }
    }
  } finally { loading.value = false }
}

onMounted(async () => {
  load()
  loadContents()
  loadTimeline()
  const [typesRes, listRes] = await Promise.all([
    relationApi.types(),
    celebrityApi.list({ pageSize: 9999 }),
  ])
  allTypes.value = typesRes.data || []
  allCelebrities.value = listRes.data || []
})
</script>

<style scoped>
.admin-edit { max-width: 1200px; }
.back-btn { margin-bottom: 16px; margin-left: -15px; color: #909399 !important; }
.back-btn:hover { color: #409eff !important; background: transparent !important; }

.edit-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  margin-bottom: 0;
}
:deep(.edit-card .el-card__header) {
  border-bottom: 1px solid #ebeef5;
  color: #303133;
  font-weight: 600;
  font-size: 14px;
}

.avatar-section { text-align: center; margin-bottom: 16px; }
.edit-avatar {
  position: relative;
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
  cursor: pointer;
}
.edit-avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: #fff; font-weight: 500;
  opacity: 0; transition: opacity 0.2s;
}
.edit-avatar:hover .avatar-overlay { opacity: 1; }

:deep(.edit-card .el-form-item__label) { color: #909399; }
:deep(.edit-card .el-input__wrapper) {
  background: #fff;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}
:deep(.edit-card .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #409eff inset;
}
:deep(.edit-card .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset;
}
:deep(.edit-card .el-input__inner) { color: #303133; }
:deep(.edit-card .el-textarea__inner) {
  background: #fff;
  color: #303133;
  border: 1px solid #dcdfe6;
  cursor: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%2216%22%3E%3Crect x=%222%22 y=%220%22 width=%226%22 height=%221%22 fill=%22%23333%22/%3E%3Crect x=%222%22 y=%2215%22 width=%226%22 height=%221%22 fill=%22%23333%22/%3E%3Crect x=%224.5%22 y=%221%22 width=%221%22 height=%2214%22 fill=%22%23333%22/%3E%3C/svg%3E') 5 0, text;
}
:deep(.edit-card .el-select__wrapper) {
  background: #fff;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}
:deep(.edit-card .el-select__selected-value) {
  font-size: inherit;
  font-family: inherit;
  color: #303133;
}

.card-header { display: flex; justify-content: space-between; align-items: center; }

.rel-list { display: flex; flex-direction: column; gap: 6px; }
.rel-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; border-radius: 8px; border-left: 3px solid #409eff;
  background: #f5f7fa;
}
.rel-info { display: flex; align-items: center; gap: 8px; flex: 1; }
.rel-arrow { font-size: 14px; color: #c0c4cc; }
.rel-name { font-weight: 500; color: #303133; }
.rel-desc { font-size: 12px; color: #909399; }

.tl-list { display: flex; flex-direction: column; gap: 10px; }
.tl-item {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 10px 14px; border-radius: 8px; background: #f5f7fa;
}
.tl-info { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; flex: 1; }
.tl-date { font-size: 12px; color: #409eff; font-weight: 600; white-space: nowrap; }
.tl-title { font-size: 14px; color: #303133; }
.tl-desc { font-size: 12px; color: #909399; width: 100%; margin-top: 4px; }
.tl-actions { display: flex; gap: 4px; flex-shrink: 0; }

/* ─── 闪白修复 ─── */
:deep(.el-card) {
  --el-card-bg-color: #fff !important;
  --el-card-border-color: #e4e7ed;
}
:deep(.el-tabs__header) {
  background: #fff;
}
:deep(.el-tabs) {
  background: #fff;
}

/* ─── 加载遮罩、空状态 ─── */
:deep(.el-loading-mask) {
  background: rgba(255,255,255,0.7) !important;
}
:deep(.el-loading-spinner .el-icon-loading) {
  color: #409eff;
}
:deep(.el-loading-spinner .el-loading-text) {
  color: #909399;
}
:deep(.el-empty__image svg) {
  display: none;
}
:deep(.el-empty__description p) {
  color: #c0c4cc;
}

:deep(.el-button--text) {
  color: #409eff;
  background: transparent !important;
}
:deep(.el-button--text.is-danger) {
  color: #f56c6c;
  background: transparent !important;
}
:deep(.el-button--text:hover),
:deep(.el-button--text:active),
:deep(.el-button--text:focus) {
  background: #ecf5ff !important;
  outline: none !important;
}

/* ─── 按钮 ─── */
:deep(.edit-card .el-button) {
  --el-button-bg-color: #fff;
  --el-button-border-color: #dcdfe6;
  --el-button-hover-bg-color: #ecf5ff;
  --el-button-hover-border-color: #409eff;
  --el-button-active-bg-color: #ecf5ff;
  --el-button-text-color: #606266;
  --el-button-hover-text-color: #409eff;
  --el-button-active-text-color: #409eff;
  background-color: #fff;
}
:deep(.edit-card .el-button:hover) {
  background-color: #ecf5ff;
}
:deep(.edit-card .el-button--danger) {
  --el-button-text-color: #f56c6c;
  --el-button-hover-text-color: #f56c6c;
  --el-button-border-color: #f56c6c;
}
:deep(.edit-card .el-button--primary) {
  --el-button-bg-color: #409eff;
  --el-button-border-color: #409eff;
  --el-button-text-color: #fff;
  --el-button-hover-bg-color: #66b1ff;
  --el-button-hover-border-color: #66b1ff;
  --el-button-hover-text-color: #fff;
  --el-button-active-bg-color: #3a8ee6;
  background-color: #409eff;
}
:deep(.edit-card .el-button--primary:hover) {
  background-color: #66b1ff;
}

/* ─── 时间线标签 ─── */
.tl-type {
  border: none !important;
  font-size: 11px;
  padding: 0 6px;
  line-height: 18px;
  border-radius: 3px;
}
:deep(.el-tag) { border: none; }

.his-id {
  display: inline-block;
  padding: 0 8px;
  font-family: inherit;
  font-size: 13px;
  color: #606266;
  background: transparent;
}

:deep(.dark-dialog) {
  --el-dialog-bg-color: #fff;
  --el-dialog-title-text-color: #303133;
  --el-dialog-border-color: #e4e7ed;
}
:deep(.dark-dialog .el-input__wrapper) {
  background: #fff;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}
:deep(.dark-dialog .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #409eff inset;
}
:deep(.dark-dialog .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset;
}
:deep(.dark-dialog .el-input__inner) { color: #303133; }
:deep(.dark-dialog .el-form-item__label) { color: #303133; }
:deep(.dark-dialog .el-select__wrapper) {
  background: #fff;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}
:deep(.dark-dialog .el-select__placeholder) {
  color: #606266;
}
:deep(.dark-dialog .el-select__selected-value) {
  color: #303133;
}
:deep(.dark-dialog .el-textarea__inner) {
  background: #fff;
  color: #303133;
  border: 1px solid #dcdfe6;
}

:deep(.el-tabs__item) { color: #909399; background: transparent; }
:deep(.el-tabs__item.is-active) { color: #409eff; }
:deep(.el-tabs__active-bar) { background: #409eff; }
:deep(.el-tabs__nav-wrap::after) { background: transparent; }
:deep(.el-tabs__nav) { background: #fff; }

.md-preview {
  padding: 12px;
  min-height: 200px;
  line-height: 1.8;
  font-size: 14px;
  color: #303133;
  background: #fff;
  border-radius: 4px;
  white-space: normal;
}
.md-preview h1, .md-preview h2, .md-preview h3 { margin: 16px 0 8px; font-weight: 600; }
.md-preview p { margin: 0 0 8px; }
.md-preview ul, .md-preview ol { padding-left: 20px; margin: 4px 0 8px; }
.md-preview li { margin-bottom: 2px; }
.md-preview strong { font-weight: 600; }
.md-preview code { background: #f0f2f5; padding: 1px 5px; border-radius: 3px; font-size: 13px; }
.md-preview blockquote { border-left: 3px solid #409eff; padding: 6px 12px; margin: 8px 0; background: #f8f9fb; border-radius: 4px; color: #606266; }
.tab-footer { margin-top: 6px; text-align: right; }

/* ─── 全屏编辑器 ─── */
.fs-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: #f5f7fa; display: flex; flex-direction: column;
}
.fs-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px; background: #fff;
  border-bottom: 1px solid #e4e7ed; flex-shrink: 0;
}
.fs-title { font-size: 16px; font-weight: 600; color: #303133; }
.fs-name { color: #d97706; }
.fs-actions { display: flex; align-items: center; gap: 8px; }
.fs-body { flex: 1; padding: 16px 20px; overflow: auto; display: flex; }
.fs-textarea {
  width: 100%; height: 100%; min-height: 300px;
  border: 1px solid #dcdfe6; border-radius: 8px;
  padding: 14px; font-size: 14px; line-height: 1.7;
  font-family: 'SF Mono', Menlo, 'Courier New', monospace;
  resize: none; outline: none;
  color: #303133;
  background: #fff; box-sizing: border-box;
  cursor: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%2216%22%3E%3Crect x=%222%22 y=%220%22 width=%226%22 height=%221%22 fill=%22%23333%22/%3E%3Crect x=%222%22 y=%2215%22 width=%226%22 height=%221%22 fill=%22%23333%22/%3E%3Crect x=%224.5%22 y=%221%22 width=%221%22 height=%2214%22 fill=%22%23333%22/%3E%3C/svg%3E') 5 0, text;
  caret-color: #000;
}
.fs-textarea:focus { border-color: #409eff; }
.fs-preview {
  flex: 1; overflow: auto;
}
</style>

<!-- 全局覆盖 -->
<style>
:root {
  --el-bg-color-overlay: #fff;
}
.edit-card .el-select * {
  color: #303133 !important;
}
.el-select-dropdown {
  background: #fff !important;
  border: 1px solid #e4e7ed !important;
}
.el-select-dropdown__item {
  color: #606266 !important;
  background: #fff !important;
}
.el-select-dropdown__item.hover,
.el-select-dropdown__item:hover {
  background: #f5f7fa !important;
  color: #409eff !important;
}
.el-select-dropdown__item.selected {
  color: #409eff !important;
  font-weight: 600;
}
.el-popper {
  background: #fff !important;
  border: 1px solid #e4e7ed !important;
}
.el-popper .el-popconfirm__main {
  color: #606266;
}
.el-popper .el-button--small {
  --el-button-bg-color: #fff;
  --el-button-border-color: #dcdfe6;
  --el-button-text-color: #606266;
  --el-button-hover-bg-color: #ecf5ff;
  --el-button-hover-border-color: #409eff;
}
.el-popper .el-button--small.is-danger {
  --el-button-bg-color: #fff;
  --el-button-border-color: #f56c6c;
  --el-button-text-color: #f56c6c;
  --el-button-hover-bg-color: #fef0f0;
}
</style>
