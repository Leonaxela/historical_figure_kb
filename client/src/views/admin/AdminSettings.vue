<template>
  <div class="admin-settings">
    <el-card class="edit-card">
      <template #header>
        <div class="card-header">
          <span>📋 关系类型管理 ({{ relationTypes.length }})</span>
          <el-button size="small" type="primary" :icon="Plus" @click="openAdd">添加类型</el-button>
        </div>
      </template>
      <div class="table-wrap">
        <table class="native-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>分类</th>
              <th>描述</th>
              <th class="col-center">使用次数</th>
              <th class="col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in relationTypes" :key="row.id">
              <td>
                <span class="type-tag" :style="{ background: row.color || '#409EFF' }">{{ row.name }}</span>
              </td>
              <td>{{ row.category }}</td>
              <td>{{ row.description }}</td>
              <td class="col-center">{{ row.count ?? 0 }}</td>
              <td class="col-actions">
                <button class="table-btn" @click="editType(row)">编辑</button>
                <button class="table-btn danger" @click="deleteType(row)">删除</button>
              </td>
            </tr>
            <tr v-if="relationTypes.length === 0">
              <td colspan="5" class="td-empty">暂无关系类型</td>
            </tr>
          </tbody>
        </table>
      </div>
    </el-card>

    <el-card class="edit-card" style="margin-top:16px">
      <template #header><span>ℹ️ 关于系统</span></template>
      <div class="about-grid">
        <div class="about-row">
          <span class="about-label">版本</span>
          <span class="about-value">1.0.0</span>
        </div>
        <div class="about-row">
          <span class="about-label">技术栈</span>
          <span class="about-value">Vue 3 + Element Plus + Node.js + SQLite</span>
        </div>
        <div class="about-row">
          <span class="about-label">数据库引擎</span>
          <span class="about-value">sql.js (SQLite WebAssembly)</span>
        </div>
        <div class="about-row">
          <span class="about-label">图谱引擎</span>
          <span class="about-value">D3-force</span>
        </div>
        <div class="about-row">
          <span class="about-label">数据来源</span>
          <span class="about-value">Wikipedia / Wikidata API</span>
        </div>
      </div>
      <p class="about-text">
        本系统支持：名人信息管理、关系类型扩展、多数据源导入、可视化关系图谱、
        以人为中心的子图探索、最短路径查询。所有关系类型和数据均可动态扩展。
      </p>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog v-model="showDialog" :title="editingType ? '编辑关系类型' : '添加关系类型'" width="500px" class="dark-dialog">
      <el-form :model="typeForm" label-width="60px" size="small">
        <el-form-item label="名称" required>
          <el-input v-model="typeForm.name" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="typeForm.category" placeholder="如：家庭、学术、职业、社交" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="typeForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="typeForm.color" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="saveType" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { relationApi } from '../../api/index.js'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const relationTypes = ref([])
const showDialog = ref(false)
const editingType = ref(null)
const saving = ref(false)
const typeForm = ref({ name: '', category: '', description: '', color: '#409EFF' })

async function fetchTypes() {
  try {
    const res = await relationApi.types()
    relationTypes.value = res.data || []
  } catch (e) { console.error(e) }
}

function openAdd() {
  editingType.value = null
  typeForm.value = { name: '', category: '', description: '', color: '#409EFF' }
  showDialog.value = true
}

function editType(row) {
  editingType.value = row
  typeForm.value = { name: row.name, category: row.category || '', description: row.description || '', color: row.color || '#409EFF' }
  showDialog.value = true
}

async function saveType() {
  saving.value = true
  try {
    if (editingType.value) {
      await relationApi.updateType(editingType.value.id, typeForm.value)
      ElMessage.success('已更新')
    } else {
      await relationApi.createType(typeForm.value)
      ElMessage.success('已创建')
    }
    showDialog.value = false
    fetchTypes()
  } catch { ElMessage.error('操作失败') }
  finally { saving.value = false }
}

async function deleteType(row) {
  try {
    await ElMessageBox.confirm(`确定删除关系类型「${row.name}」？`, '确认删除', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' })
  } catch { return }
  try {
    await relationApi.removeType(row.id)
    ElMessage.success('已删除')
    fetchTypes()
  } catch { ElMessage.error('删除失败') }
}

onMounted(() => fetchTypes())
</script>

<style scoped>

.edit-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
}
:deep(.edit-card .el-card__header) {
  border-bottom: 1px solid #ebeef5;
  color: #303133;
  font-weight: 600;
}

.card-header { display: flex; justify-content: space-between; align-items: center; }

/* ─── 原生表格 ─── */
.table-wrap { position: relative; }
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
.native-table tbody tr { transition: background 0.15s; }
.native-table tbody tr:hover { background: #f5f7fa; }
.native-table tbody tr:last-child td { border-bottom: none; }
.native-table .col-center { text-align: center; }
.native-table .col-actions { text-align: center; white-space: nowrap; }
.native-table .td-empty {
  text-align: center;
  color: #c0c4cc;
  padding: 32px 16px;
}
.type-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
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

:deep(.dark-dialog) {
  --el-dialog-bg-color: #fff;
  --el-dialog-title-text-color: #303133;
}
:deep(.dark-dialog .el-input__wrapper) { background: #fff; box-shadow: 0 0 0 1px #dcdfe6 inset; }
:deep(.dark-dialog .el-input__wrapper:hover) { box-shadow: 0 0 0 1px #409eff inset; }
:deep(.dark-dialog .el-input__wrapper.is-focus) { box-shadow: 0 0 0 1px #409eff inset; }
:deep(.dark-dialog .el-input__inner) { color: #303133; }
:deep(.dark-dialog .el-select .el-input__wrapper) { background: #fff; box-shadow: 0 0 0 1px #dcdfe6 inset; }
:deep(.dark-dialog .el-form-item__label) { color: #303133; }


/* ─── 关于系统 ─── */
.about-grid {
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
}
.about-row {
  display: flex;
  border-bottom: 1px solid #e4e7ed;
}
.about-row:last-child { border-bottom: none; }
.about-label {
  width: 120px;
  flex-shrink: 0;
  padding: 10px 16px;
  background: #f5f7fa;
  color: #909399;
  font-size: 13px;
  font-weight: 500;
}
.about-value {
  flex: 1;
  padding: 10px 16px;
  color: #606266;
  font-size: 13px;
}
.about-text { margin-top: 16px; line-height: 1.8; color: #909399; font-size: 14px; }
</style>
