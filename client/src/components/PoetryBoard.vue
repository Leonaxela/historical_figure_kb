<template>
  <div class="poetry-section">
    <div class="section-divider"></div>
    <div class="section-header">
      <h2 class="section-title">诗词雅集</h2>
      <div class="section-actions">
        <el-input v-model="searchText" placeholder="搜索作者/标题..." clearable style="width:180px" @input="onSearch">
          <template #suffix><span class="search-info" v-if="matchCount">{{ matchCount }} 首</span></template>
        </el-input>
        <div class="btn-group">
          <el-button @click="openAdd">+ 添加诗词</el-button>
          <el-badge :value="props.poems.length" :hidden="!props.poems.length" class="total-badge">
            <el-button @click="resetLayout">≡ 重新排列</el-button>
          </el-badge>
        </div>
      </div>
    </div>
    <div class="poetry-board" ref="boardRef">
      <div class="poem-card" v-for="p in poems" :key="p.id"
        :data-theme="p.theme || 'warm'"
        :data-id="p.id"
        :style="getCardStyle(p)"
        @mousedown="onMouseDown($event, p)"
        @touchstart="onTouchStart($event, p)"
        @dblclick="editPoem(p)">
        <button class="card-del-btn" title="删除" @click.stop="deletePoem(p)">✕</button>
        <div class="card-title">{{ p.title }}</div>
        <div class="card-author">{{ p.author }}</div>
        <div class="card-body" :class="isPoem(p.content) ? 'poem' : 'prose'" v-html="formatContent(p.content)"></div>
        <div class="card-seal">{{ p.seal || '雅' }}</div>
      </div>
      <div class="board-hint" v-if="!poems.length">暂无诗词，点击「+ 添加诗词」开始</div>
    </div>

    <el-dialog v-model="showForm" :title="editId ? '编辑诗词' : '添加诗词'" width="480px">
      <el-form :model="form" label-width="60px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="作者"><el-input v-model="form.author" /></el-form-item>
        <el-form-item label="正文"><el-input v-model="form.content" type="textarea" :rows="5" /></el-form-item>
        <el-form-item label="印章"><el-input v-model="form.seal" style="width:100px" /></el-form-item>
        <el-form-item label="色调">
          <el-select v-model="form.theme" style="width:100px">
            <el-option label="暖" value="warm" /><el-option label="冷" value="cool" />
            <el-option label="玉" value="jade" /><el-option label="玫" value="rose" />
            <el-option label="金" value="gold" /><el-option label="雾" value="mist" />
            <el-option label="青" value="cyan" /><el-option label="紫" value="purple" />
            <el-option label="橙" value="orange" /><el-option label="墨" value="ink" />
            <el-option label="茶" value="tea" /><el-option label="竹" value="bamboo" />
          </el-select>
          <span class="theme-preview" :style="{ background: themeColor(form.theme) }"></span>
        </el-form-item>
        <el-form-item label="宽高">
          <el-input v-model.number="form.card_width" style="width:80px" placeholder="宽" />
          <span style="margin:0 6px;color:#909399">×</span>
          <el-input v-model.number="form.card_height" style="width:80px" placeholder="高" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" @click="savePoem" :loading="saving">{{ editId ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { poemApi } from '../api/index.js'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({ poems: { type: Array, default: () => [] } })
const emit = defineEmits(['update'])
const boardRef = ref(null)
const showForm = ref(false)
const editId = ref(null)
const saving = ref(false)
const form = ref({ title: '', author: '', content: '', theme: 'warm', seal: '雅', card_width: 280, card_height: 320 })
const cardPositions = ref({})
const searchText = ref('')
const highlightId = ref(null)
const matchCount = ref(0)

const THEME_COLORS = {
  warm: '#f5e8d8', cool: '#d8e8f0', jade: '#d8ece0', rose: '#f0d8d8',
  gold: '#f0e8d0', mist: '#e0e8f0', cyan: '#d0ece8', purple: '#e8d8f0',
  orange: '#f0e0c8', ink: '#e0dcd8', tea: '#ece0d0', bamboo: '#d8e8d8',
}
function themeColor(v) { return THEME_COLORS[v] || '#f5e8d8' }

const CARD_W = 280, CARD_H = 320, PAD = 16, GAP = 20

function getCardStyle(p) {
  const pos = cardPositions.value[p.id]
  if (!pos) return { display: 'none' }
  return { left: pos.x + 'px', top: pos.y + 'px', width: pos.w + 'px', minHeight: pos.h + 'px' }
}

function computeLayout() {
  const board = boardRef.value
  if (!board) return
  const bw = board.clientWidth - PAD * 2
  const cols = Math.min(4, Math.max(1, Math.floor((bw + GAP) / (CARD_W + GAP))))
  const cw = Math.min(CARD_W, (bw - (cols - 1) * GAP) / cols)
  const sx = PAD + (bw - cols * cw - (cols - 1) * GAP) / 2 + (bw - cols * cw - (cols - 1) * GAP) / 2
  const pos = {}
  const reversed = [...props.poems].reverse()
  reversed.forEach((p, i) => {
    const col = i % cols, row = Math.floor(i / cols)
    pos[p.id] = { x: sx + col * (cw + GAP), y: PAD + 10 + row * ((p.card_height || CARD_H) + GAP), w: p.card_width || CARD_W, h: p.card_height || CARD_H }
  })
  cardPositions.value = { ...pos }
}

function resetLayout() { computeLayout() }

let dragState = null, isDragging = false, rafId = null
function onMouseDown(e, p) {
  if (e.target.closest('.card-del-btn')) return
  const el = e.currentTarget; const rect = el.getBoundingClientRect()
  dragState = { id: p.id, ox: e.clientX - rect.left, oy: e.clientY - rect.top, moved: false }
  isDragging = true; el.classList.add('dragging')
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e) {
  if (!isDragging || !dragState) return
  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => { moveCard(e.clientX, e.clientY) })
}
function onMouseUp() {
  if (!isDragging) return; isDragging = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
  const el = dragState?.id ? boardRef.value?.querySelector(`[data-id="${dragState.id}"]`) : null
  if (el) el.classList.remove('dragging')
  if (dragState?.moved && el) el.parentNode.appendChild(el)
  dragState = null
}
function onTouchStart(e, p) {
  const touch = e.touches[0]; if (!touch) return
  const el = e.currentTarget; const rect = el.getBoundingClientRect()
  const boardRect = boardRef.value.getBoundingClientRect()
  dragState = { id: p.id, ox: touch.clientX - rect.left, oy: touch.clientY - rect.top }
  isDragging = true; el.classList.add('dragging')
  document.addEventListener('touchmove', onTouchMove, { passive: false })
  document.addEventListener('touchend', onTouchEnd)
}
function onTouchMove(e) {
  if (!isDragging || !dragState) return; e.preventDefault()
  const touch = e.touches[0]; if (!touch) return
  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => moveCard(touch.clientX, touch.clientY))
}
function onTouchEnd() {
  if (!isDragging) return; isDragging = false
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchEnd)
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
  const el = dragState?.id ? boardRef.value?.querySelector(`[data-id="${dragState.id}"]`) : null
  if (el) el.classList.remove('dragging')
  if (dragState?.moved && el) el.parentNode.appendChild(el)
  dragState = null
}
function moveCard(cx, cy) {
  if (!dragState) return
  dragState.moved = true
  const boardRect = boardRef.value.getBoundingClientRect()
  const pos = cardPositions.value[dragState.id]
  if (pos) {
    pos.x = Math.max(2, Math.min(boardRect.width - pos.w - 2, cx - boardRect.left - dragState.ox))
    pos.y = cy - boardRect.top - dragState.oy
    pos.x = cx - boardRect.left - dragState.ox
    cardPositions.value = { ...cardPositions.value }
  }
}

function onSearch() {
  const q = searchText.value.trim().toLowerCase()
  // 清除旧高亮
  document.querySelectorAll('.poem-card.highlight, .poem-card.highlight-dim').forEach(el => el.classList.remove('highlight', 'highlight-dim', 'centered'))
  if (!q) { highlightId.value = null; matchCount.value = 0; return }
  const board = boardRef.value
  if (!board) return
  const matches = props.poems.filter(p =>
    (p.title || '').toLowerCase().includes(q) ||
    (p.author || '').toLowerCase().includes(q)
  )
  matchCount.value = matches.length
  if (matches.length) {
    // 所有匹配卡片淡高亮
    matches.forEach(p => {
      const el = board.querySelector(`[data-id="${p.id}"]`)
      if (el) el.classList.add('highlight-dim')
    })
    // 第一个匹配移到中央
    const first = matches[0]
    highlightId.value = first.id
    const pos = cardPositions.value[first.id]
    if (pos) {
      const bw = board.clientWidth, bh = board.clientHeight
      pos.x = (bw - pos.w) / 2; pos.y = (bh - pos.h) / 2
      const el = board.querySelector(`[data-id="${first.id}"]`)
      if (el) el.classList.add('highlight', 'centered')
      cardPositions.value = { ...cardPositions.value }
    }
  } else {
    highlightId.value = null
  }
}

function openAdd() {
  editId.value = null; form.value = { title: '', author: '', content: '', theme: 'warm', seal: '雅', card_width: 280, card_height: 320 }
  showForm.value = true
}
function editPoem(p) {
  editId.value = p.id
  form.value = { title: p.title, author: p.author || '', content: p.content || '', theme: p.theme || 'warm', seal: p.seal || '雅', card_width: p.card_width || 280, card_height: p.card_height || 320 }
  showForm.value = true
}
async function savePoem() {
  if (!form.value.title) return ElMessage.warning('请输入标题')
  saving.value = true
  try {
    if (editId.value) {
      await poemApi.update(editId.value, form.value)
      emit('update', { ...form.value, id: editId.value })
    } else {
      await poemApi.create(form.value)
      emit('update')
    }
    showForm.value = false
  } catch { ElMessage.error('操作失败') }
  finally { saving.value = false }
}

async function deletePoem(p) {
  try {
    await ElMessageBox.confirm(`确定删除「${p.title}」？`, '确认删除', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' })
  } catch { return }
  try {
    await poemApi.remove(p.id)
    ElMessage.success('已删除')
    emit('update')
  } catch { ElMessage.error('删除失败') }
}

function isPoem(text) { return !text || text.split('\n').length > 1 || text.length < 80 }
function formatContent(text) {
  if (!text) return ''
  if (text.split('\n').length > 1) return text.split('\n').filter(Boolean).map(l => `<span class="line">${l}</span>`).join('')
  return text.replace(/\n/g, '<br/>')
}

let resizeTimer = null
function onResize() {
  if (resizeTimer) cancelAnimationFrame(resizeTimer)
  resizeTimer = requestAnimationFrame(() => { computeLayout(); resizeTimer = null })
}
onMounted(() => { nextTick(() => { computeLayout(); setTimeout(computeLayout, 100) }); window.addEventListener('resize', onResize) })
watch(() => props.poems, () => { nextTick(() => { computeLayout() }) }, { deep: true })
onUnmounted(() => window.removeEventListener('resize', onResize))
</script>

<style scoped>
.poetry-section { margin-top: 40px; }
.section-divider { height: 1px; background: #e4e7ed; margin-bottom: 24px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.section-title { font-size: 20px; font-weight: 600; color: #303133; letter-spacing: 2px; }
.section-actions { display: flex; align-items: center; }
.btn-group { display: flex; gap: 4px; }
.section-actions :deep(.el-button) { margin-left: 8px; }
.poetry-board { position: relative; width: 100%; min-height: 800px; background: #f5efe6; border-radius: 24px; border: 1px solid rgba(210,195,180,0.35); padding: 8px; overflow: hidden; }
.poem-card { position: absolute; width: 280px; min-height: 320px; padding: 28px 24px 24px; background: rgba(255,250,242,0.92); backdrop-filter: blur(6px); border-radius: 24px 20px 24px 20px; box-shadow: 0 6px 28px rgba(140,120,100,0.12), 0 2px 8px rgba(140,120,100,0.06); border: 1px solid rgba(210,195,180,0.35); cursor: grab; display: flex; flex-direction: column; will-change: transform; user-select: none; }
.poem-card::before { content: ''; position: absolute; top: 12px; right: 16px; width: 50px; height: 50px; background: radial-gradient(circle at 30% 30%, rgba(180,160,140,0.06), transparent 70%); border-radius: 50%; pointer-events: none; }
.poem-card.dragging { cursor: grabbing; box-shadow: 0 20px 60px rgba(100,80,60,0.25), 0 8px 24px rgba(100,80,60,0.12); transform: scale(1.04) rotate(0.5deg); z-index: 1000; border-color: rgba(180,160,140,0.5); background: rgba(255,252,248,0.96); }
.poem-card[data-theme="warm"] { background: linear-gradient(145deg, rgba(255,248,240,0.92), rgba(248,240,232,0.92)); }
.poem-card[data-theme="cool"] { background: linear-gradient(145deg, rgba(242,248,250,0.92), rgba(235,242,245,0.92)); }
.poem-card[data-theme="jade"] { background: linear-gradient(145deg, rgba(240,248,242,0.92), rgba(232,242,235,0.92)); }
.poem-card[data-theme="rose"] { background: linear-gradient(145deg, rgba(252,244,244,0.92), rgba(248,238,238,0.92)); }
.poem-card[data-theme="gold"] { background: linear-gradient(145deg, rgba(252,248,238,0.92), rgba(248,242,232,0.92)); }
.poem-card[data-theme="mist"] { background: linear-gradient(145deg, rgba(245,248,250,0.92), rgba(238,242,245,0.92)); }
.poem-card[data-theme="cyan"] { background: linear-gradient(145deg, rgba(230,248,248,0.92), rgba(220,242,242,0.92)); }
.poem-card[data-theme="purple"] { background: linear-gradient(145deg, rgba(245,240,250,0.92), rgba(238,232,245,0.92)); }
.poem-card[data-theme="orange"] { background: linear-gradient(145deg, rgba(252,245,235,0.92), rgba(248,238,225,0.92)); }
.poem-card[data-theme="ink"] { background: linear-gradient(145deg, rgba(242,240,238,0.92), rgba(235,232,230,0.92)); }
.poem-card[data-theme="tea"] { background: linear-gradient(145deg, rgba(248,242,235,0.92), rgba(242,235,225,0.92)); }
.poem-card[data-theme="bamboo"] { background: linear-gradient(145deg, rgba(238,245,238,0.92), rgba(228,240,228,0.92)); }
.card-title { font-size: 20px; font-weight: 600; color: #3d3228; text-align: center; letter-spacing: 3px; font-family: 'STKaiti','楷体',serif; padding-bottom: 10px; position: relative; margin-bottom: 2px; }
.card-title::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 40px; height: 1px; background: linear-gradient(90deg, transparent, #b8a088, transparent); }
.card-author { text-align: center; font-size: 14px; color: #8a7a6a; letter-spacing: 6px; margin: 6px 0 14px; font-weight: 300; }
.card-author::before { content: '—— '; color: #b8a898; }
.card-author::after { content: ' ——'; color: #b8a898; }
.card-body { flex: 1; font-size: 16px; line-height: 1.9; color: #4a3f35; text-align: center; padding: 4px 2px; font-family: 'STKaiti','楷体',serif; letter-spacing: 1.2px; display: flex; flex-direction: column; justify-content: center; min-height: 120px; }
.card-body.poem { line-height: 2.2; }
.card-body.poem .line { display: block; }
.card-body.prose { text-align: justify; line-height: 2; font-size: 15px; }
.card-seal { position: absolute; bottom: 16px; right: 18px; font-size: 11px; color: rgba(180,80,60,0.35); writing-mode: vertical-rl; transform: rotate(-6deg); pointer-events: none; opacity: 0.6; }
.card-del-btn { position: absolute; top: 8px; right: 8px; width: 22px; height: 22px; padding: 0; border: none; border-radius: 50%; background: transparent; color: rgba(0,0,0,0.08); font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; z-index: 5; transition: all 0.15s; }
.card-del-btn:hover { background: rgba(245,108,108,0.12); color: #f56c6c; }
.board-hint { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); color: #b0a090; font-size: 13px; letter-spacing: 4px; opacity: 0.4; }
.poem-card.highlight.centered { box-shadow: 0 0 0 3px #409eff, 0 12px 48px rgba(64,158,255,0.35) !important; z-index: 100; transition: left 0.4s ease, top 0.4s ease; }
.poem-card.highlight-dim { box-shadow: 0 0 0 2px rgba(64,158,255,0.3), 0 4px 16px rgba(64,158,255,0.1) !important; }
.search-info { margin-left: 8px; font-size: 12px; color: #909399; white-space: nowrap; }
.total-badge { margin-left: 4px; }
.total-badge :deep(.el-badge__content) { font-size: 10px; height: 16px; line-height: 16px; padding: 0 4px; }
.theme-preview { display: inline-block; width: 20px; height: 20px; border-radius: 4px; margin-left: 8px; vertical-align: middle; border: 1px solid rgba(0,0,0,0.06); }
</style>
