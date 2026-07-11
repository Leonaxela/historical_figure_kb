<template>
  <div class="admin-celebrities">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="showCreate = true">新增名人</el-button>
      <div class="toolbar-right">
        <el-input v-model="searchText" placeholder="搜索..." clearable style="width:220px" @input="debounceSearch">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </div>
    </div>

    <!-- 表格 -->
    <div class="table-wrap">
      <table class="native-table celebrities-table">
        <thead>
          <tr>
            <th>中文名</th>
            <th>英文名</th>
            <th>国籍</th>
            <th>职业</th>
            <th>生卒</th>
            <th class="col-center">状态</th>
            <th class="col-center">关系</th>
            <th class="col-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in list" :key="row.id" @click="goEdit(row)">
            <td class="td-clip">{{ row.chinese_name }}</td>
            <td class="td-clip">{{ row.name }}</td>
            <td class="td-clip">{{ row.nationality }}</td>
            <td>{{ row.occupation }}</td>
            <td>{{ row.birth_date || '?' }} ~ {{ row.death_date || '?' }}</td>
            <td class="col-center"><span class="status-dot" :class="row.status === 0 ? 'off' : 'on'"></span></td>
            <td class="col-center">{{ row.relation_count ?? 0 }}</td>
            <td class="col-actions">
              <button class="table-btn" @click.stop="goEdit(row)">编辑</button>
              <button class="table-btn danger" @click.stop="handleDelete(row)">删除</button>
              <button class="table-btn" @click.stop="handleToggleStatus(row)">{{ row.status === 0 ? '显示' : '隐藏' }}</button>
            </td>
          </tr>
          <tr v-if="!loading && list.length === 0">
            <td colspan="8" class="td-empty">暂无数据</td>
          </tr>
        </tbody>
      </table>
      <div class="table-loading" v-if="loading">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrap" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        background
        @current-change="loadList"
      />
    </div>

    <!-- 新增对话框 -->
    <el-dialog v-model="showCreate" title="新增名人" width="560px" @close="resetForm" class="dark-dialog">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px" size="small">
        <el-form-item label="英文名" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="中文名" prop="chinese_name">
          <el-input v-model="form.chinese_name" @input="onChineseNameInput" />
          <span v-if="chineseNameStatus.msg" :style="{ color: chineseNameStatus.color, fontSize: '12px', lineHeight: '1.4' }">{{ chineseNameStatus.msg }}</span>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="出生日期">
              <el-input v-model="form.birth_date" placeholder="YYYY-MM-DD 或 公元前551年" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="逝世日期">
              <el-input v-model="form.death_date" placeholder="YYYY-MM-DD 或 至今" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="国籍">
          <el-input v-model="form.nationality" placeholder="中国人物：中国_春秋。非中国：古希腊" />
        </el-form-item>
        <el-form-item label="朝代" v-if="form.nationality?.includes('中国')">
          <el-select v-model="form.displayDynasty" placeholder="选择朝代" clearable style="width:100%" @change="onDynastyChange">
            <el-option v-for="d in dynasties" :key="d.id" :label="d.label" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="职业">
          <el-input v-model="form.occupation" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.biography" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="creating">确定创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { celebrityApi } from '../../api/index.js'
import { Search, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const searchText = ref('')
const loading = ref(false)
const creating = ref(false)
const showCreate = ref(false)
const formRef = ref(null)

const DYNASTY_LABELS = {
  chunqiu: '春秋', zhanguo: '战国', qin: '秦', xihan: '西汉', donghan: '东汉',
  sanguo: '三国', xijin: '西晋', dongjin: '东晋', nanbei: '南北朝', sui: '隋',
  tang: '唐', beisong: '北宋', nansong: '南宋', yuan: '元', ming: '明', qing: '清',
}
const dynasties = Object.entries(DYNASTY_LABELS).map(([id, label]) => ({ id, label }))

const form = ref({
  name: '', chinese_name: '', birth_date: '', death_date: '',
  nationality: '', occupation: '', biography: '',
})

const displayDynasty = ref('')
const chineseNameStatus = ref({ msg: '', color: '' })
let nameCheckTimer = null

function onChineseNameInput(val) {
  clearTimeout(nameCheckTimer)
  if (!val) { chineseNameStatus.value = { msg: '', color: '' }; return }
  nameCheckTimer = setTimeout(async () => {
    const res = await celebrityApi.list({ search: val, pageSize: 10 })
    const found = (res.data || []).some(c => c.chinese_name === val)
    chineseNameStatus.value = found
      ? { msg: '该名人名字已存在', color: '#f56c6c' }
      : { msg: '', color: '' }
  }, 500)
}

function onDynastyChange(val) {
  if (val && DYNASTY_LABELS[val]) {
    form.value.nationality = '中国_' + DYNASTY_LABELS[val]
  } else {
    form.value.nationality = '中国'
  }
}

const rules = {
  name: [{ required: true, message: '英文名为必填项', trigger: 'blur' }],
  chinese_name: [{ required: true, message: '中文名为必填项', trigger: 'blur' }],
}

function resetForm() {
  form.value = { name: '', chinese_name: '', birth_date: '', death_date: '', nationality: '', occupation: '', biography: '' }
  displayDynasty.value = ''
}

async function handleCreate() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  creating.value = true
  try {
    await celebrityApi.create(form.value)
    ElMessage.success('创建成功')
    showCreate.value = false
    resetForm()
    loadList()
  } finally {
    creating.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除「${row.chinese_name || row.name}」？此操作不可恢复。`, '确认删除', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' })
  } catch { return }
  try {
    await celebrityApi.remove(row.id)
    ElMessage.success('已删除')
    loadList()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

function goEdit(row) {
  router.push('/admin/celebrities/' + row.id)
}

async function handleToggleStatus(row) {
  const newStatus = row.status === 0 ? 1 : 0
  try {
    await celebrityApi.update(row.id, { status: newStatus })
    ElMessage.success(newStatus ? '已恢复显示' : '已隐藏（游客不可见）')
    loadList()
  } catch {
    ElMessage.error('操作失败')
  }
}

let debounceTimer = null
function debounceSearch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    loadList()
  }, 400)
}

async function loadList() {
  loading.value = true
  try {
    const res = await celebrityApi.list({
      page: page.value,
      pageSize: pageSize.value,
      search: searchText.value || undefined,
      includeHidden: true,
    })
    list.value = res.data || []
    total.value = res.total || 0
  } catch (e) {
    console.error('加载列表失败', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadList())
</script>

<style scoped>
.admin-celebrities { max-width: 1200px; }

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.toolbar-right :deep(.el-input__wrapper) {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}
.toolbar-right :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #409eff inset;
}
.toolbar-right :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset;
}
.toolbar-right :deep(.el-input__inner) {
  color: #303133;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
:deep(.el-pagination.is-background .btn-prev),
:deep(.el-pagination.is-background .btn-next),
:deep(.el-pagination.is-background .el-pager li) {
  background: #fff;
  color: #606266;
  border: 1px solid #dcdfe6;
}
:deep(.el-pagination.is-background .el-pager li.is-active) {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

/* ─── 原生表格 ─── */
.table-wrap { position: relative; }
.native-table {
  width: 100%;
  table-layout: fixed;
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
.native-table .col-actions { text-align: center; white-space: nowrap; }
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
.td-clip { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.native-table.celebrities-table th:nth-child(1) { width: 10%; }
.native-table.celebrities-table th:nth-child(2) { width: 10%; }
.native-table.celebrities-table th:nth-child(3) { width: 10%; }
.native-table.celebrities-table th:nth-child(4) { width: 25%; }
.native-table.celebrities-table th:nth-child(5) { width: 20%; }
.native-table.celebrities-table th:nth-child(6) { width: 5%; }
.native-table.celebrities-table th:nth-child(7) { width: 5%; }
.native-table.celebrities-table th:nth-child(8) { width: 15%; }

.status-dot {
  display: inline-block;
  width: 8px; height: 8px;
  border-radius: 50%;
}
.status-dot.on { background: #67c23a; }
.status-dot.off { background: #c0c4cc; }

/* ─── 加载状态 ─── */
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

/* ─── 对话框（保持深色） ─── */
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
:deep(.dark-dialog .el-textarea__inner) {
  background: #fff;
  color: #303133;
  border: 1px solid #dcdfe6;
}
:deep(.dark-dialog .el-select__wrapper) { background: #fff; box-shadow: 0 0 0 1px #dcdfe6 inset; }
:deep(.dark-dialog .el-select__placeholder) { color: #606266; }
:deep(.dark-dialog .el-select__selected-value) { color: #303133; }
:deep(.dark-dialog .el-form-item__label) { color: #303133; }
</style>
