<template>
  <div class="note-section">
    <div class="section-divider"></div>
    <div class="section-header">
      <h2 class="section-title">📌 随心便签</h2>
      <div class="section-actions">
        <el-button @click="openAdd">+ 添加便签</el-button>
        <el-badge :value="props.notes.length" :hidden="!props.notes.length" class="total-badge">
          <el-button @click="resetLayout">≡ 重新排列</el-button>
        </el-badge>
      </div>
    </div>
    <div class="note-board" ref="boardRef">
      <div class="note-card" v-for="n in notes" :key="n.id"
        :style="getCardStyle(n)"
        :data-id="n.id"
        @mousedown="onMouseDown($event, n)"
        @touchstart="onTouchStart($event, n)"
        @dblclick="editNote(n)">
        <!-- 图钉 -->
        <div class="pushpin" :style="{ '--pin-color': pinColor(n.bg_color) }">
          <div class="pin-head"></div>
          <div class="pin-shadow"></div>
        </div>
        <button class="card-del-btn" title="删除" @click.stop="deleteNote(n)">✕</button>
        <div class="note-content" v-text="n.content || '双击编辑...'"></div>
      </div>
      <div class="board-hint" v-if="!notes.length">暂无便签，点击「+ 添加便签」开始</div>
    </div>

    <el-dialog v-model="showForm" :title="editId ? '编辑便签' : '添加便签'" width="500px">
      <el-form :model="form" label-width="70px">
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="写点什么..." />
        </el-form-item>
        <el-form-item label="背景色">
          <div style="width:100%">
            <div class="color-presets">
              <div v-for="c in presetColors" :key="c"
                class="color-dot"
                :class="{ active: form.bg_color === c }"
                :style="{ background: c }"
                @click="form.bg_color = c"
                :title="c"></div>
            </div>
            <div class="color-input-row">
              <el-input v-model="form.bg_color" style="width:100px" placeholder="#HEX" />
              <input type="color" v-model="form.bg_color" class="native-color-picker" />
            </div>
          </div>
        </el-form-item>
        <el-form-item label="宽 × 高">
          <el-input v-model.number="form.card_width" style="width:90px" placeholder="宽" />
          <span style="margin:0 8px;color:#909399">×</span>
          <el-input v-model.number="form.card_height" style="width:90px" placeholder="高" />
          <span style="margin-left:8px;font-size:12px;color:#909399">px</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" @click="saveNote" :loading="saving">{{ editId ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>

    <!-- 自定义删除确认弹窗 -->
    <div class="delete-overlay" v-if="deletingNote" @click.self="deletingNote = null">
      <div class="delete-dialog">
        <div class="delete-icon">🗑️</div>
        <p class="delete-msg">确定要撕掉这张便签吗？</p>
        <div class="delete-actions">
          <button class="del-btn cancel" @click="deletingNote = null">取消</button>
          <button class="del-btn confirm" @click="confirmDelete">撕掉</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { noteApi } from '../api/index.js'
import { ElMessage } from 'element-plus'

const props = defineProps({ notes: { type: Array, default: () => [] } })
const emit = defineEmits(['update'])
const boardRef = ref(null)
const showForm = ref(false)
const editId = ref(null)
const saving = ref(false)
const form = ref({ content: '', bg_color: '#FFF9C4', card_width: 220, card_height: 220 })
const cardPositions = ref({})
const deletingNote = ref(null)

const presetColors = [
  '#FFF9C4', '#FFE0B2', '#FFCDD2', '#F8BBD0', '#E1BEE7',
  '#C5CAE9', '#BBDEFB', '#B3E5FC', '#B2DFDB', '#C8E6C9',
  '#DCEDC8', '#FFF3E0', '#E0F7FA', '#F3E5F5', '#E8EAF6',
  '#FFECB3', '#FFE082', '#FFCC80', '#EF9A9A', '#CE93D8',
]

const CARD_W = 220, CARD_H = 220, PAD = 24, GAP = 24

function getCardStyle(p) {
  const pos = cardPositions.value[p.id]
  if (!pos) return { display: 'none' }
  return {
    left: pos.x + 'px',
    top: pos.y + 'px',
    width: pos.w + 'px',
    minHeight: pos.h + 'px',
    background: p.bg_color || '#FFF9C4',
    '--sway-delay': (p.id * 0.13 % 3).toFixed(2) + 's',
    '--sway-amount': (p.id * 37 % 3 - 1).toFixed(1) + 'deg',
    '--initial-rot': ((p.id * 23 % 5 - 2)) + 'deg',
  }
}

function pinColor(bg) {
  const dark = ['#CE93D8', '#EF9A9A', '#F8BBD0', '#E1BEE7', '#C5CAE9']
  return dark.includes(bg) ? '#e74c3c' : '#e67e22'
}

function computeLayout() {
  const board = boardRef.value
  if (!board) return
  const bw = board.clientWidth - PAD * 2
  const cols = Math.min(5, Math.max(1, Math.floor((bw + GAP) / (CARD_W + GAP))))
  const cw = Math.min(CARD_W, (bw - (cols - 1) * GAP) / cols)
  const sx = PAD + (bw - cols * cw - (cols - 1) * GAP) / 2
  const pos = {}
  const reversed = [...props.notes].reverse()
  reversed.forEach((p, i) => {
    const col = i % cols, row = Math.floor(i / cols)
    pos[p.id] = {
      x: sx + col * (cw + GAP),
      y: PAD + 10 + row * ((p.card_height || CARD_H) + GAP),
      w: p.card_width || CARD_W,
      h: p.card_height || CARD_H,
    }
  })
  cardPositions.value = { ...pos }
}

function resetLayout() { computeLayout() }

// 拖拽
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
    cardPositions.value = { ...cardPositions.value }
  }
}

// CRUD
function openAdd() {
  editId.value = null
  form.value = { content: '', bg_color: '#FFF9C4', card_width: 220, card_height: 220 }
  showForm.value = true
}
function editNote(n) {
  editId.value = n.id
  form.value = {
    content: n.content || '',
    bg_color: n.bg_color || '#FFF9C4',
    card_width: n.card_width || 220,
    card_height: n.card_height || 220,
  }
  showForm.value = true
}
async function saveNote() {
  saving.value = true
  try {
    if (editId.value) {
      await noteApi.update(editId.value, form.value)
      emit('update', { ...form.value, id: editId.value })
    } else {
      await noteApi.create(form.value)
      emit('update')
    }
    showForm.value = false
  } catch { ElMessage.error('操作失败') }
  finally { saving.value = false }
}
function deleteNote(n) {
  deletingNote.value = n
}

function confirmDelete() {
  const n = deletingNote.value
  if (!n) return
  deletingNote.value = null
  noteApi.remove(n.id).then(() => { emit('update') }).catch(() => ElMessage.error('删除失败'))
}

// 窗口大小变化
let resizeTimer = null
function onResize() {
  if (resizeTimer) cancelAnimationFrame(resizeTimer)
  resizeTimer = requestAnimationFrame(() => { computeLayout(); resizeTimer = null })
}
onMounted(() => { nextTick(() => { computeLayout(); setTimeout(computeLayout, 100) }); window.addEventListener('resize', onResize) })
watch(() => props.notes, () => { nextTick(() => { computeLayout() }) }, { deep: true })
onUnmounted(() => window.removeEventListener('resize', onResize))
</script>

<style scoped>
.note-section { margin-top: 40px; }
.section-divider { height: 1px; background: #e4e7ed; margin-bottom: 24px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.section-title { font-size: 20px; font-weight: 600; color: #303133; letter-spacing: 2px; }
.section-actions { display: flex; align-items: center; gap: 4px; }
.section-actions :deep(.el-button) { margin-left: 8px; }

/* 软木看板 */
.note-board {
  position: relative;
  width: 100%;
  min-height: 700px;
  background:
    repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(180,150,100,0.04) 40px, rgba(180,150,100,0.04) 41px),
    repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(180,150,100,0.04) 40px, rgba(180,150,100,0.04) 41px),
    linear-gradient(135deg, #f0e6d0 0%, #e8dbbd 40%, #ebddc0 70%, #e6d5b0 100%);
  border-radius: 16px;
  border: 1px solid rgba(180,150,100,0.25);
  padding: 8px;
  overflow: hidden;
  box-shadow: inset 0 2px 20px rgba(140,110,60,0.08), 0 4px 16px rgba(140,110,60,0.06);
}

/* 便签卡片 */
.note-card {
  position: absolute;
  width: 220px;
  min-height: 220px;
  padding: 32px 18px 18px;
  background: #FFF9C4;
  border-radius: 4px 4px 8px 8px;
  box-shadow:
    0 4px 16px rgba(0,0,0,0.10),
    0 1px 4px rgba(0,0,0,0.06),
    inset 0 1px 0 rgba(255,255,255,0.6);
  cursor: grab;
  display: flex;
  flex-direction: column;
  will-change: transform;
  user-select: none;
  animation: noteSway 2s ease-in-out infinite alternate;
  animation-delay: var(--sway-delay, 0s);
  --sway-amount: 1.2deg;
  transform-origin: top center;
}

@keyframes noteSway {
  0%   { transform: rotate(calc(var(--initial-rot, 0deg) + var(--sway-amount, 1deg) * -1)); }
  100% { transform: rotate(calc(var(--initial-rot, 0deg) + var(--sway-amount, 1deg))); }
}

.note-card.dragging {
  cursor: grabbing;
  box-shadow: 0 20px 60px rgba(0,0,0,0.20), 0 8px 24px rgba(0,0,0,0.12);
  transform: scale(1.06) rotate(0deg) !important;
  z-index: 1000;
  animation: none !important;
}

.pushpin {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
}
.pin-head {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ff6b6b, var(--pin-color, #e67e22));
  box-shadow:
    0 2px 4px rgba(0,0,0,0.25),
    inset 0 1px 2px rgba(255,255,255,0.5);
  position: relative;
}
.pin-head::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 4px;
  width: 5px;
  height: 4px;
  background: radial-gradient(circle, rgba(255,255,255,0.6), transparent);
  border-radius: 50%;
}
.pin-shadow {
  width: 20px;
  height: 6px;
  background: radial-gradient(ellipse, rgba(0,0,0,0.12), transparent);
  border-radius: 50%;
  margin: -2px auto 0;
}

.card-del-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: rgba(0,0,0,0.10);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  z-index: 5;
  transition: all 0.15s;
}
.card-del-btn:hover {
  background: rgba(245,108,108,0.15);
  color: #f56c6c;
}

.note-content {
  flex: 1;
  font-size: 15px;
  line-height: 1.7;
  color: #3a3a3a;
  word-break: break-word;
  white-space: pre-wrap;
  font-family: 'PingFang SC','Microsoft YaHei',sans-serif;
  overflow: hidden;
}

.board-hint {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(80,60,30,0.30);
  font-size: 14px;
  letter-spacing: 4px;
  pointer-events: none;
}

/* 颜色选择器 */
.color-presets { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
.color-input-row { display: flex; align-items: center; gap: 6px; }
.color-dot {
  width: 24px; height: 24px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.15s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.color-dot:hover { transform: scale(1.15); }
.color-dot.active { border-color: #409eff; box-shadow: 0 0 0 2px rgba(64,158,255,0.3); }
.native-color-picker { width: 32px; height: 32px; border: none; border-radius: 4px; cursor: pointer; background: none; padding: 0; flex-shrink: 0; }
.native-color-picker::-webkit-color-swatch-wrapper { padding: 2px; }
.native-color-picker::-webkit-color-swatch { border: 1px solid #dcdfe6; border-radius: 3px; }

/* 自定义删除弹窗 */
.delete-overlay {
  position: fixed; inset: 0; z-index: 99999;
  background: rgba(0,0,0,0.25);
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(2px);
}
.delete-dialog {
  background: #fff; border-radius: 16px; padding: 32px 40px 24px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
  animation: dialogPop 0.25s ease-out;
}
@keyframes dialogPop {
  0% { transform: scale(0.85); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.delete-icon { font-size: 40px; line-height: 1; margin-bottom: 12px; }
.delete-msg { font-size: 15px; color: #303133; margin: 0 0 20px; line-height: 1.5; }
.delete-actions { display: flex; gap: 12px; justify-content: center; }
.del-btn {
  min-width: 80px; padding: 8px 24px; border-radius: 8px; border: none;
  font-size: 14px; cursor: pointer; transition: all 0.15s; font-weight: 500;
}
.del-btn.cancel { background: #f0f0f0; color: #606266; }
.del-btn.cancel:hover { background: #e4e4e4; }
.del-btn.confirm { background: linear-gradient(135deg, #f56c6c, #e74c3c); color: #fff; }
.del-btn.confirm:hover { box-shadow: 0 4px 12px rgba(245,108,108,0.4); transform: translateY(-1px); }
.del-btn:active { transform: scale(0.96); }

.total-badge { margin-left: 4px; }
.total-badge :deep(.el-badge__content) { font-size: 10px; height: 16px; line-height: 16px; padding: 0 4px; }
</style>
