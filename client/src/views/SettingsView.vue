<template>
  <div class="settings-view">
    <h2 class="page-title">⚙️ 系统设置</h2>

    <el-tabs v-model="activeTab">
      <!-- 关系类型管理 -->
      <el-tab-pane label="关系类型管理" name="relationTypes">
        <el-card shadow="never">
          <template #header>
            <span>📋 关系类型 ({{ relationTypes.length }})</span>
            <el-button type="primary" size="small" style="float:right" @click="showAddDialog = true">
              添加关系类型
            </el-button>
          </template>

          <el-table :data="relationTypes" stripe>
            <el-table-column label="名称" width="120">
              <template #default="{ row }">
                <el-tag :color="row.color" style="color:#fff">{{ row.name }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="category" label="分类" width="120" />
            <el-table-column prop="description" label="描述" min-width="200" />
            <el-table-column prop="count" label="使用次数" width="80" align="center" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="editType(row)">编辑</el-button>
                <el-button text type="danger" size="small" @click="deleteType(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 关于系统 -->
      <el-tab-pane label="关于系统" name="about">
        <el-card shadow="never">
          <h3>🌐 中外名人关系图谱系统</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="版本">1.0.0</el-descriptions-item>
            <el-descriptions-item label="技术栈">Vue 3 + Element Plus + Node.js + SQLite</el-descriptions-item>
            <el-descriptions-item label="数据库引擎">sql.js (SQLite WebAssembly)</el-descriptions-item>
            <el-descriptions-item label="图谱引擎">vis-network</el-descriptions-item>
            <el-descriptions-item label="数据来源">Wikipedia / Wikidata API</el-descriptions-item>
          </el-descriptions>
          <p class="about-text">
            本系统支持：名人信息管理、关系类型扩展、多数据源导入、可视化关系图谱、
            以人为中心的子图探索、最短路径查询。所有关系类型和数据均可动态扩展。
          </p>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 添加/编辑对话框 -->
    <el-dialog v-model="showAddDialog" :title="editingType ? '编辑关系类型' : '添加关系类型'" width="500px">
      <el-form :model="typeForm" label-width="80px">
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
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveType">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { getRelationTypes, createRelationType, updateRelationType, deleteRelationType } from '@/api/index.js'

const activeTab = ref('relationTypes')
const relationTypes = ref([])
const showAddDialog = ref(false)
const editingType = ref(null)
const typeForm = reactive({
  name: '',
  category: '',
  description: '',
  color: '#409EFF'
})

async function fetchTypes() {
  try {
    const res = await getRelationTypes()
    relationTypes.value = res.data.data || []
  } catch (err) {
    console.error(err)
  }
}

function editType(row) {
  editingType.value = row
  typeForm.name = row.name
  typeForm.category = row.category || ''
  typeForm.description = row.description || ''
  typeForm.color = row.color || '#409EFF'
  showAddDialog.value = true
}

async function saveType() {
  try {
    if (editingType.value) {
      await updateRelationType(editingType.value.id, typeForm)
    } else {
      await createRelationType(typeForm)
    }
    showAddDialog.value = false
    editingType.value = null
    typeForm.name = ''
    typeForm.category = ''
    typeForm.description = ''
    typeForm.color = '#409EFF'
    fetchTypes()
  } catch (err) {
    console.error(err)
  }
}

async function deleteType(row) {
  try {
    await deleteRelationType(row.id)
    fetchTypes()
  } catch (err) {
    console.error(err)
  }
}

onMounted(() => {
  fetchTypes()
})
</script>

<style scoped>
.settings-view { max-width: 1000px; margin: 0 auto; }
.page-title { margin: 0 0 16px; }
.about-text { margin-top: 16px; line-height: 1.8; color: #606266; }
</style>
