<template>
  <div class="admin-settings">
    <el-card class="edit-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="关系类型" name="types">
          <template #label><span>📋 关系类型 ({{ relationTypes.length }})</span></template>
          <div class="card-actions"><el-button size="small" type="primary" :icon="Plus" @click="openAdd">添加类型</el-button></div>
          <div class="table-wrap" style="margin-top:12px">
            <table class="native-table types-table">
              <thead><tr><th>名称</th><th>分类</th><th>描述</th><th class="col-center">使用次数</th><th class="col-actions">操作</th></tr></thead>
              <tbody>
                <tr v-for="row in relationTypes" :key="row.id">
                  <td><span class="type-tag" :style="{ background: row.color || '#409EFF' }">{{ row.name }}</span></td>
                  <td>{{ row.category }}</td><td>{{ row.description }}</td>
                  <td class="col-center">{{ row.count ?? 0 }}</td>
                  <td class="col-actions"><button class="table-btn" @click="editType(row)">编辑</button><button class="table-btn danger" @click="deleteType(row)">删除</button></td>
                </tr>
                <tr v-if="relationTypes.length === 0"><td colspan="5" class="td-empty">暂无关系类型</td></tr>
              </tbody>
            </table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="名人称谓" name="tags">
          <template #label><span>🏷️ 名人称谓 ({{ tags.length }})</span></template>
          <div class="card-actions"><el-button size="small" type="primary" :icon="Plus" @click="openTagAdd">添加称谓</el-button></div>
          <div class="table-wrap" style="margin-top:12px">
            <table class="native-table tags-table">
              <thead><tr><th>名称</th><th>描述</th><th>颜色</th><th class="col-center">关联人数</th><th class="col-actions">操作</th></tr></thead>
              <tbody>
                <tr v-for="row in tags" :key="row.id">
                  <td ><span class="type-tag" :style="{ background: row.color || '#409EFF' }">{{ row.name }}</span></td>
                  <td class="td-desc" :title="row.description">{{ row.description }}</td>
                  <td><span class="color-dot" :style="{ background: row.color || '#409eff' }"></span></td>
                  <td class="col-center">{{ row.count ?? 0 }}</td>
                  <td class="col-actions">
                    <button class="table-btn" @click="openTagCelebrities(row)">关联名人</button>
                    <button class="table-btn" @click="editTag(row)">编辑</button>
                    <button class="table-btn danger" @click="deleteTag(row)">删除</button>
                  </td>
                </tr>
                <tr v-if="tags.length === 0"><td colspan="5" class="td-empty">暂无称谓</td></tr>
              </tbody>
            </table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-card class="edit-card" style="margin-top:16px">
      <template #header><span>ℹ️ 关于系统</span></template>
      <div class="about-grid">
        <div class="about-row"><span class="about-label">版本</span><span class="about-value">1.0.0</span></div>
        <div class="about-row"><span class="about-label">技术栈</span><span class="about-value">Vue 3 + Element Plus + Node.js + SQLite</span></div>
        <div class="about-row"><span class="about-label">数据库引擎</span><span class="about-value">sql.js (SQLite WebAssembly)</span></div>
        <div class="about-row"><span class="about-label">图谱引擎</span><span class="about-value">D3-force</span></div>
        <div class="about-row"><span class="about-label">数据来源</span><span class="about-value">Wikipedia / Wikidata API</span></div>
      </div>
      <p class="about-text">本系统支持：名人信息管理、关系类型扩展、多数据源导入、可视化关系图谱、以人为中心的子图探索、最短路径查询。所有关系类型和数据均可动态扩展。</p>
    </el-card>

    <!-- 关系类型对话框 -->
    <el-dialog v-model="showDialog" :title="editingType ? '编辑关系类型' : '添加关系类型'" width="500px" class="dark-dialog">
      <el-form :model="typeForm" label-width="60px" size="small">
        <el-form-item label="名称" required><el-input v-model="typeForm.name" /></el-form-item>
        <el-form-item label="分类"><el-input v-model="typeForm.category" placeholder="如：家庭、学术、职业、社交" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="typeForm.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="颜色"><el-color-picker v-model="typeForm.color" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="saveType" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 称谓对话框 -->
    <el-dialog v-model="tagDialog" :title="tagEditTitle" width="500px" class="dark-dialog">
      <el-form :model="tagForm" label-width="60px" size="small">
        <el-form-item label="名称" required><el-input v-model="tagForm.name" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="tagForm.description" type="textarea" :rows="4" /></el-form-item>
        <el-form-item label="颜色"><el-color-picker v-model="tagForm.color" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tagDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTag" :loading="tagSaving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 关联名人对话框 -->
    <el-dialog v-model="tagCelebDialog" :title="'关联名人 - ' + (tagCelebTag?.name || '')" width="600px" class="dark-dialog">
      <el-select v-model="tagCelebInput" filterable placeholder="搜索选择名人，选中自动添加" style="width:100%" @change="onTagCelebSelect">
        <el-option v-for="c in allCelebrities" :key="c.id" :label="c.chinese_name || c.name" :value="c.id" />
      </el-select>
      <el-divider />
      <div class="tag-celeb-cards" v-if="tagCelebList.length">
        <div class="tag-celeb-card" v-for="(c, i) in tagCelebList" :key="c.id"
          draggable="true"
          @dragstart="onDragStart(i, $event)"
          @dragover.prevent="onDragOver(i, $event)"
          @drop="onDrop(i)">
          <div class="card-avatar" :style="{ background: 'linear-gradient(135deg, #409eff, #6366f1)' }">{{ (c.chinese_name || c.name).charAt(0) }}</div>
          <span class="card-name">{{ c.chinese_name || c.name }}</span>
          <el-button size="small" type="danger" text @click="removeTagCelebrity(c.id)">✕</el-button>
        </div>
      </div>
      <el-empty v-else description="暂无关联名人" :image-size="40" />
      <template #footer>
        <el-button @click="tagCelebDialog = false">取消</el-button>
        <el-button type="primary" @click="attachTagCelebrities" :loading="tagCelebSaving">确认关联</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { relationApi, tagApi, celebrityApi } from '../../api/index.js'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('types')

// ── 关系类型 ──
const relationTypes = ref([])
const showDialog = ref(false)
const editingType = ref(null)
const saving = ref(false)
const typeForm = ref({ name: '', category: '', description: '', color: '#409EFF' })

async function fetchTypes() { try { const res = await relationApi.types(); relationTypes.value = res.data || [] } catch {} }
function openAdd() { editingType.value = null; typeForm.value = { name: '', category: '', description: '', color: '#409EFF' }; showDialog.value = true }
function editType(row) { editingType.value = row; typeForm.value = { name: row.name, category: row.category || '', description: row.description || '', color: row.color || '#409EFF' }; showDialog.value = true }
async function saveType() {
  saving.value = true
  try {
    if (editingType.value) { await relationApi.updateType(editingType.value.id, typeForm.value); ElMessage.success('已更新') }
    else { await relationApi.createType(typeForm.value); ElMessage.success('已创建') }
    showDialog.value = false; fetchTypes()
  } catch { ElMessage.error('操作失败') }
  finally { saving.value = false }
}
async function deleteType(row) {
  try { await ElMessageBox.confirm(`确定删除关系类型「${row.name}」？`, '确认删除', { type: 'warning' }) } catch { return }
  try { await relationApi.removeType(row.id); ElMessage.success('已删除'); fetchTypes() } catch { ElMessage.error('删除失败') }
}

// ── 名人称谓 ──
const tags = ref([])
const tagDialog = ref(false)
const tagEditTitle = ref('添加称谓')
const tagSaving = ref(false)
const tagForm = ref({ id: null, name: '', description: '', color: '#409eff' })
const tagCelebDialog = ref(false)
const tagCelebTag = ref(null)
const tagCelebInput = ref(null)
const tagCelebSelected = ref([])
const tagCelebList = ref([])
const tagCelebRemoved = ref([])
const tagCelebSaving = ref(false)
let orderChanged = false
const allCelebrities = ref([])

async function fetchTags() { try { const res = await tagApi.list(); tags.value = res.data || [] } catch {} }
function openTagAdd() { tagEditTitle.value = '添加称谓'; tagForm.value = { id: null, name: '', description: '', color: '#409eff' }; tagDialog.value = true }
function editTag(row) { tagEditTitle.value = '编辑称谓'; tagForm.value = { id: row.id, name: row.name, description: row.description || '', color: row.color || '#409eff' }; tagDialog.value = true }
async function saveTag() {
  tagSaving.value = true
  try {
    if (tagForm.value.id) { await tagApi.update(tagForm.value.id, tagForm.value) }
    else { await tagApi.create(tagForm.value) }
    ElMessage.success('已保存'); tagDialog.value = false; fetchTags()
  } catch { ElMessage.error('操作失败') }
  finally { tagSaving.value = false }
}
async function deleteTag(row) {
  try { await ElMessageBox.confirm(`确定删除称谓「${row.name}」？`, '确认删除', { type: 'warning' }) } catch { return }
  try { await tagApi.remove(row.id); ElMessage.success('已删除'); fetchTags() } catch { ElMessage.error('删除失败') }
}
async function openTagCelebrities(tag) {
  tagCelebTag.value = tag; tagCelebInput.value = null; tagCelebSelected.value = []; tagCelebRemoved.value = []; orderChanged = false
  const [celebRes, allRes] = await Promise.all([tagApi.celebrities(tag.id), celebrityApi.list({ pageSize: 9999 })])
  tagCelebList.value = celebRes.data || []; allCelebrities.value = allRes.data || []; tagCelebDialog.value = true
}
let dragIdx = null

async function attachTagCelebrities() {
  if (!tagCelebSelected.value.length && !tagCelebRemoved.value.length && !orderChanged) return ElMessage.warning('请先选择或移除名人')
  tagCelebSaving.value = true
  try {
    for (const cid of tagCelebSelected.value) { await tagApi.attach(cid, tagCelebTag.value.id) }
    for (const cid of tagCelebRemoved.value) { await tagApi.detach(cid, tagCelebTag.value.id) }
    // 保存排序
    const ids = tagCelebList.value.map(c => c.id)
    if (ids.length) await tagApi.sort(tagCelebTag.value.id, ids)
    ElMessage.success('已保存'); tagCelebSelected.value = []; tagCelebRemoved.value = []; orderChanged = false; tagCelebDialog.value = false
    const res = await tagApi.celebrities(tagCelebTag.value.id)
    tagCelebList.value = res.data || []; fetchTags()
  } catch { ElMessage.error('保存失败') }
  finally { tagCelebSaving.value = false }
}
function onDragStart(idx, e) {
  dragIdx = idx
  e.dataTransfer.effectAllowed = 'move'
}
function onDragOver(idx, e) {
  e.dataTransfer.dropEffect = 'move'
}
function onDrop(idx) {
  if (dragIdx == null || dragIdx === idx) return
  const item = tagCelebList.value.splice(dragIdx, 1)[0]
  tagCelebList.value.splice(idx, 0, item)
  dragIdx = null; orderChanged = true
}
function removeTagCelebrity(celebrityId) {
  // 如果是在本次新增的（已在 tagCelebSelected），直接从选中移除
  const idx = tagCelebSelected.value.indexOf(celebrityId)
  if (idx >= 0) { tagCelebSelected.value.splice(idx, 1); return }
  // 如果是已有的，标记为待移除
  tagCelebList.value = tagCelebList.value.filter(c => c.id !== celebrityId)
  tagCelebRemoved.value.push(celebrityId)
}
function onTagCelebSelect(id) {
  if (!id) return
  // 重复添加检查
  if (tagCelebList.value.some(c => c.id === id)) { tagCelebInput.value = null; return }
  const celeb = allCelebrities.value.find(c => c.id === id)
  if (celeb) { tagCelebList.value.push(celeb); tagCelebSelected.value.push(id) }
  tagCelebInput.value = null
}

onMounted(() => { fetchTypes(); fetchTags() })
</script>

<style scoped>
.edit-card { background: #fff; border: 1px solid #e4e7ed; border-radius: 12px; }
:deep(.edit-card .el-card__header) { border-bottom: 1px solid #ebeef5; color: #303133; font-weight: 600; }
.card-actions { display: flex; justify-content: flex-end; }
.table-wrap { position: relative; }
.native-table { width: 100%; table-layout: fixed; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; font-size: 14px; border: 1px solid #e4e7ed; }
.td-desc { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 0; }
.native-table.tags-table th:nth-child(1) { width: 15%; }
.native-table.tags-table th:nth-child(2) { width: 45%; }
.native-table.tags-table th:nth-child(3) { width: 10%; }
.native-table.tags-table th:nth-child(4) { width: 10%; }
.native-table.tags-table th:nth-child(5) { width: 20%; }
.native-table thead { background: #f5f7fa; }
.native-table th { padding: 12px 16px; text-align: left; font-weight: 600; color: #909399; font-size: 13px; white-space: nowrap; border-bottom: 1px solid #ebeef5; }
.native-table td { padding: 12px 16px; color: #606266; border-bottom: 1px solid #ebeef5; }
.native-table tbody tr { transition: background 0.15s; }
.native-table tbody tr:hover { background: #f5f7fa; }
.native-table tbody tr:last-child td { border-bottom: none; }
.native-table .col-center { text-align: center; }
.native-table .col-actions { text-align: center; white-space: nowrap; }
.native-table .td-empty { text-align: center; color: #c0c4cc; padding: 32px 16px; }
.type-tag { display: inline-block; padding: 2px 10px; border-radius: 4px; color: #fff; font-size: 12px; font-weight: 500; }
.color-dot { display: inline-block; width: 16px; height: 16px; border-radius: 50%; vertical-align: middle; }
.table-btn { background: none; border: none; color: #409eff; cursor: pointer; font-size: 13px; padding: 2px 8px; border-radius: 4px; transition: background 0.15s; }
.table-btn:hover { background: #ecf5ff; }
.table-btn.danger { color: #f56c6c; }
:deep(.dark-dialog) { --el-dialog-bg-color: #fff; --el-dialog-title-text-color: #303133; }
:deep(.dark-dialog .el-input__wrapper) { background: #fff; box-shadow: 0 0 0 1px #dcdfe6 inset; }
:deep(.dark-dialog .el-input__wrapper:hover) { box-shadow: 0 0 0 1px #409eff inset; }
:deep(.dark-dialog .el-input__wrapper.is-focus) { box-shadow: 0 0 0 1px #409eff inset; }
:deep(.dark-dialog .el-input__inner) { color: #303133; }
:deep(.dark-dialog .el-form-item__label) { color: #303133; }
:deep(.el-color-picker__panel .el-color-dropdown__btn) { background: #409eff !important; color: #fff !important; border: none !important; }
:deep(.el-color-picker__panel .el-color-dropdown__btn:hover) { background: #66b1ff !important; }
.about-grid { display: flex; flex-direction: column; background: #f5f7fa; border-radius: 8px; overflow: hidden; }
.about-row { display: flex; border-bottom: 1px solid #e4e7ed; }
.about-row:last-child { border-bottom: none; }
.about-label { width: 120px; flex-shrink: 0; padding: 10px 16px; background: #f5f7fa; color: #909399; font-size: 13px; font-weight: 500; }
.about-value { flex: 1; padding: 10px 16px; color: #606266; font-size: 13px; }
.about-text { margin-top: 16px; line-height: 1.8; color: #909399; font-size: 14px; }
.tag-celeb-cards { display: flex; flex-wrap: wrap; gap: 8px; }
.tag-celeb-card { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f7fa; border-radius: 8px; font-size: 14px; cursor: grab; user-select: none; }
.tag-celeb-card:active { cursor: grabbing; }
.card-avatar { width: 28px; height: 28px; line-height: 28px; border-radius: 50%; color: #fff; font-size: 12px; font-weight: 700; text-align: center; flex-shrink: 0; }
.card-name { color: #303133; }
</style>
