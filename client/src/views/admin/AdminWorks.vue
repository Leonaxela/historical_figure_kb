<template>
  <div class="works-page">
    <div class="page-header">
      <h1 class="page-title">名人卡片</h1>
      <div class="header-actions">
        <el-select v-model="addCelebId" placeholder="添加大卡片..." filterable style="width:200px" @change="onAddBigCard">
          <el-option v-for="c in celebOptions" :key="c.id" :label="c.chinese_name || c.name" :value="c.id" />
        </el-select>
      </div>
    </div>

    <div class="kanban">
      <div v-for="(group, ci) in columnGroups" :key="group.celebrity_id"
        class="kanban-col"
        :style="{ borderTop: '5px solid ' + colColors[ci % colColors.length], borderColor: colColors[ci % colColors.length] + '80' }"
        @dragover.prevent
        @drop="onDropCard($event, group.celebrity_id)">

        <div class="kanban-header"
          draggable="true"
          @dragstart="onDragColStart($event, ci)"
          @dragover.prevent
          @drop.prevent="onDropCol($event, ci)">
          <div class="col-avatar" :style="{ background: colColors[ci % colColors.length] }">
            <img v-if="group.avatar" :src="'/img/' + group.avatar" />
            <span v-else>{{ group.name.charAt(0) }}</span>
          </div>
          <div class="col-info">
            <div class="col-name-row">
              <span class="col-name">{{ group.name }}</span>
              <el-tag size="small" v-if="group.nationality">{{ group.nationality }}</el-tag>
              <el-tag size="small" type="success" style="margin-left:4px" v-if="group.occupation">{{ group.occupation }}</el-tag>
            </div>
            <div class="col-count">{{ group.cards.length }} 部</div>
          </div>
        </div>

        <div class="kanban-body">
          <div class="kanban-card" v-for="w in group.cards" :key="w.id"
            draggable="true"
            @dragstart="onDragCard($event, w)"
            @dragover.prevent
            @drop.stop="onDropOnCard($event, w)"
            @click="onCardClick(w)"
            @dblclick="onCardDblClick(w)">
            <div class="card-title-row">
              <span class="card-title">{{ w.title }}</span>
              <button class="card-del" title="删除" @click.stop="deleteWork(w)">✕</button>
            </div>
          </div>
          <div class="card-add" @click="openAddWork(group.celebrity_id)">+ 添加</div>
        </div>
      </div>
    </div>

    <PoetryBoard :poems="poems" @update="onPoemsUpdate" />

    <NoteBoard :notes="notes" @update="onNotesUpdate" />

    <EBookShelf :ebooks="ebooks" />

    <!-- 编辑弹窗 -->
    <el-dialog v-model="showForm" :title="editId ? '编辑著作' : '新增著作'" width="480px">
      <el-form :model="form" label-width="70px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="作者"><el-input :model-value="form.author" disabled /></el-form-item>
        <el-form-item label="VUE 页面"><el-input v-model="form.vue_url" placeholder="页面路径，如 /admin/fourier" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" @click="saveWork" :loading="saving">{{ editId ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { workApi, celebrityApi, poemApi, noteApi, ebookApi } from '../../api/index.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import PoetryBoard from '../../components/PoetryBoard.vue'
import NoteBoard from '../../components/NoteBoard.vue'
import EBookShelf from '../../components/EBookShelf.vue'
import { displayNationality } from '../../utils/dynasty.js'

const router = useRouter()
const works = ref([])
const poems = ref([])
const notes = ref([])
const ebooks = ref([])
const allCelebrities = ref([])
const addCelebId = ref(null)
const showForm = ref(false)
const editId = ref(null)
const saving = ref(false)
const form = ref({ title: '', vue_url: '' })
const dragCard = ref(null)
let clickTimer = null

const colColors = ['#409eff', '#67c23a', '#f56c6c', '#e6a23c', '#8b5cf6', '#10b981', '#909399', '#db66b0']

const celebMap = computed(() => {
  const map = {}
  allCelebrities.value.forEach(c => { map[c.id] = c })
  return map
})

const celebOptions = computed(() =>
  allCelebrities.value.filter(c => !columnGroups.value.some(g => g.celebrity_id === c.id))
)

const columnGroups = computed(() => {
  const cols = {}
  works.value.forEach(w => {
    const cid = w.celebrity_id
    if (cid == null) return
    if (!cols[cid]) cols[cid] = { celebrity_id: cid, cards: [] }
    cols[cid].cards.push(w)
  })
  const groups = []
  Object.values(cols).forEach(group => {
    const colCard = group.cards.find(w => w.title === '__col__' && w.status == 1)
    const celeb = celebMap.value[group.celebrity_id]
    if (!colCard || !celeb) return
    const cards = group.cards.filter(w => w.title !== '__col__').sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    groups.push({
      celebrity_id: group.celebrity_id,
      name: celeb.chinese_name || celeb.name,
      nationality: celeb.nationality?.replace('中国_', ''),
      occupation: celeb.occupation?.split('、')[0],
      avatar: celeb.image_url,
      sort_order: colCard.sort_order || 0,
      colWorkId: colCard.id,
      cards,
    })
  })
  return groups.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
})

// ── 添加大卡片 ──
async function onAddBigCard(id) {
  if (!id) return
  addCelebId.value = null
  const celeb = celebMap.value[id]
  const name = celeb ? (celeb.chinese_name || celeb.name) : ''
  await workApi.create({ title: '__col__', celebrity_id: id, author: name, status: '1' })
  ElMessage.success('已添加')
  loadWorks()
}

// ── 大卡片拖拽排序 ──
let dragColIdx = null
function onDragColStart(e, idx) { dragColIdx = idx; e.dataTransfer.effectAllowed = 'move' }
function onDropCol(e, idx) {
  if (dragColIdx == null || dragColIdx === idx) return
  const groups = columnGroups.value
  const fromId = groups[dragColIdx].celebrity_id
  const toId = groups[idx].celebrity_id
  dragColIdx = null
  const fromWork = works.value.find(w => w.celebrity_id === fromId && w.title === '__col__')
  const toWork = works.value.find(w => w.celebrity_id === toId && w.title === '__col__')
  if (fromWork && toWork) {
    const tmp = fromWork.sort_order || 0
    fromWork.sort_order = toWork.sort_order || 0
    toWork.sort_order = tmp
    Promise.all([
      workApi.update(fromWork.id, { sort_order: fromWork.sort_order }),
      workApi.update(toWork.id, { sort_order: toWork.sort_order }),
    ])
  }
}

// ── 小卡片拖拽 ──
function onDragCard(e, w) { dragCard.value = w; e.dataTransfer.effectAllowed = 'move' }
async function onDropCard(e, targetCelebId) {
  if (!dragCard.value) return
  const id = dragCard.value.id
  if (dragCard.value.celebrity_id === targetCelebId) { dragCard.value = null; return }
  await workApi.update(id, { celebrity_id: targetCelebId })
  dragCard.value = null
  loadWorks()
}
async function onDropOnCard(e, targetCard) {
  if (!dragCard.value || dragCard.value.id === targetCard.id) return
  const dragId = dragCard.value.id
  const dragSort = dragCard.value.sort_order || 0
  const targetSort = targetCard.sort_order || 0
  dragCard.value = null
  await Promise.all([
    workApi.update(dragId, { sort_order: targetSort }),
    workApi.update(targetCard.id, { sort_order: dragSort }),
  ])
  loadWorks()
}

// ── 单击/双击 ──
function onCardClick(w) {
  if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; return }
  clickTimer = setTimeout(() => { clickTimer = null; editWork(w) }, 250)
}
function onCardDblClick(w) {
  if (clickTimer) { clearTimeout(clickTimer); clickTimer = null }
  if (w.vue_url) router.push(w.vue_url)
}

// ── 小卡片弹窗 ──
function openAddWork(celebrityId) {
  editId.value = null
  const celeb = celebMap.value[celebrityId]
  form.value = { title: '', vue_url: '', author: celeb ? (celeb.chinese_name || celeb.name) : '' }
  form.value._celebrityId = celebrityId
  showForm.value = true
}
function editWork(w) {
  editId.value = w.id
  const celeb = celebMap.value[w.celebrity_id]
  form.value = { title: w.title, vue_url: w.vue_url || '', author: celeb ? (celeb.chinese_name || celeb.name) : '' }
  showForm.value = true
}
async function saveWork() {
  if (!form.value.title) return ElMessage.warning('请输入标题')
  saving.value = true
  try {
    const { _celebrityId, ...data } = form.value
    if (editId.value) {
      await workApi.update(editId.value, data)
      ElMessage.success('已更新')
    } else {
      await workApi.create({ ...data, celebrity_id: _celebrityId })
      ElMessage.success('已创建')
    }
    showForm.value = false
    loadWorks()
  } catch { ElMessage.error('操作失败') }
  finally { saving.value = false }
}

async function deleteWork(w) {
  try {
    await ElMessageBox.confirm(`确定删除「${w.title}」？`, '确认删除', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' })
  } catch { return }
  try {
    await workApi.remove(w.id)
    ElMessage.success('已删除')
    loadWorks()
  } catch { ElMessage.error('删除失败') }
}

function onPoemsUpdate(updated) {
  if (updated && updated.id) {
    const p = poems.value.find(x => x.id === updated.id)
    if (p) Object.assign(p, updated)
  } else {
    loadWorks()
  }
}

function onNotesUpdate(updated) {
  if (updated && updated.id) {
    const n = notes.value.find(x => x.id === updated.id)
    if (n) Object.assign(n, updated)
  } else {
    loadWorks()
  }
}

async function loadWorks() {
  const [wr, cr, pr, nr, er] = await Promise.all([workApi.list(), celebrityApi.list({ pageSize: 9999 }), poemApi.list(), noteApi.list(), ebookApi.list()])
  if (wr.success) works.value = wr.data || []
  if (cr.success) allCelebrities.value = cr.data || []
  if (pr.success) poems.value = pr.data || []
  if (nr.success) notes.value = nr.data || []
  if (er.success) ebooks.value = er.data || []
}

onMounted(loadWorks)
</script>

<style scoped>
.works-page { max-width: 1200px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-title { font-size: 20px; font-weight: 600; color: #303133; letter-spacing: 2px; }
.header-actions { display: flex; gap: 8px; align-items: center; }
.kanban { display: flex; flex-wrap: wrap; gap: 14px; }
.kanban-col { flex: 0 0 calc(25% - 11px); min-width: 200px; background: #f5f7fa; border-radius: 12px; border: 2px solid #e4e7ed; display: flex; flex-direction: column; }
.kanban-header { display: flex; align-items: center; gap: 10px; padding: 14px; cursor: default; border-bottom: 1px solid #e4e7ed; user-select: none; }
.col-avatar { width: 44px; height: 44px; line-height: 44px; border-radius: 50%; color: #fff; font-size: 18px; font-weight: 700; text-align: center; flex-shrink: 0; overflow: hidden; }
.col-avatar img { width: 100%; height: 100%; object-fit: cover; }
.col-info { flex: 1; }
.col-name-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.col-name { font-size: 14px; font-weight: 600; color: #303133; }
.col-count { font-size: 11px; color: #909399; margin-top: 4px; }
.kanban-body { flex: 1; padding: 10px; display: flex; flex-direction: column; gap: 6px; min-height: 150px; }
.kanban-card { background: #fff; border-radius: 8px; padding: 10px 12px; border: 1px solid #e4e7ed; cursor: pointer; transition: all 0.15s; }
.kanban-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.05); border-color: #409eff; }
.card-title-row { display: flex; align-items: center; justify-content: space-between; }
.card-title { font-size: 13px; font-weight: 600; color: #303133; }
.card-del { background:none; border:none; cursor:pointer; color:#c0c4cc; font-size:12px; padding:2px 4px; flex-shrink:0; }
.card-del:hover { color:#f56c6c; }
.card-add { font-size: 12px; color: #c0c4cc; text-align: center; padding: 8px; border: 1px dashed #dcdfe6; border-radius: 8px; cursor: pointer; transition: all 0.15s; }
.card-add:hover { border-color: #409eff; color: #409eff; }
</style>
