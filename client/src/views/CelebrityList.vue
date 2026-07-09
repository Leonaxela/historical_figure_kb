<template>
  <div class="celebrity-list">
    <div class="page-header">
      <h1 class="page-title">名人库</h1>
      <el-button type="primary" @click="showDialog = true" :icon="Plus" v-if="auth.isLoggedIn">新增名人</el-button>
    </div>

    <el-card shadow="never" class="filter-card">
      <el-row :gutter="16" align="middle">
        <el-col :span="8">
          <el-input v-model="store.search" placeholder="搜索姓名、中文名、简介..." clearable
            @input="debounceSearch" @clear="store.setSearch('')">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </el-col>
        <el-col :span="5">
          <el-select v-model="store.nationality" placeholder="国籍" clearable
            @change="store.setFilter('nationality', $event || '')" style="width:100%">
            <el-option v-for="n in store.nationalities" :key="n" :label="n" :value="n" />
          </el-select>
        </el-col>
        <el-col :span="5">
          <el-select v-model="store.occupation" placeholder="职业" clearable
            @change="store.setFilter('occupation', $event || '')" style="width:100%">
            <el-option v-for="o in store.occupations" :key="o" :label="o" :value="o" />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="16" v-loading="store.loading">
      <el-col :xs="12" :sm="8" :md="6" :lg="4" v-for="c in store.list" :key="c.id">
        <el-card shadow="hover" class="celeb-card" @click="$router.push('/celebrities/' + c.id)">
          <div class="card-avatar">
            <img v-if="c.image_url" :src="'/img/' + c.image_url" :alt="c.chinese_name || c.name" />
            <span v-else>{{ (c.chinese_name || c.name).charAt(0) }}</span>
          </div>
          <div class="card-name">{{ c.chinese_name || c.name }}</div>
          <div class="card-en-name" v-if="c.chinese_name">{{ c.name }}</div>
          <div class="card-info">
            <el-tag size="small" v-if="c.nationality">{{ displayNationality(c) }}</el-tag>
            <el-tag size="small" type="success" v-if="c.occupation" style="margin-left:4px">{{ c.occupation.split('、')[0] }}</el-tag>
          </div>
          <div class="card-rels" v-if="c.relation_count > 0">{{ c.relation_count }} 条关联</div>
          <div class="card-rels" v-else style="color:#c0c4cc">暂无关联</div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-if="!store.loading && store.list.length === 0" description="暂无数据" />

    <div class="pagination-wrap" v-if="store.total > store.pageSize">
      <el-pagination
        v-model:current-page="store.page"
        :page-size="store.pageSize"
        :total="store.total"
        layout="total, prev, pager, next"
        @current-change="store.setPage"
      />
    </div>

    <!-- 新增名人对话框 -->
    <el-dialog v-model="showDialog" title="新增名人" width="560px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px" size="small">
        <el-form-item label="英文名" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="中文名" prop="chinese_name">
          <el-input v-model="form.chinese_name" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="出生日期" prop="birth_date">
              <el-input v-model="form.birth_date" placeholder="YYYY-MM-DD 或 公元前551年" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="逝世日期" prop="death_date">
              <el-input v-model="form.death_date" placeholder="YYYY-MM-DD 或 至今" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="国籍" prop="nationality">
          <el-input v-model="form.nationality" placeholder="如：中国、美国、古希腊" />
        </el-form-item>
        <el-form-item label="朝代" v-if="isChinese" prop="dynasty">
          <el-select v-model="form.dynasty" placeholder="选择朝代（用于生成 his_id）" clearable style="width:100%">
            <el-option v-for="d in dynasties" :key="d.id" :label="d.label" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="职业">
          <el-input v-model="form.occupation" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.biography" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="his_id" v-if="previewHisId">
          <el-tag>{{ previewHisId }}</el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCelebrityStore } from '../stores/celebrities.js'
import { celebrityApi } from '../api/index.js'
import { Search, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { displayNationality } from '../utils/dynasty.js'
import { useAuthStore } from '../stores/auth.js'

const auth = useAuthStore()

const router = useRouter()
const route = useRoute()
const store = useCelebrityStore()
const showDialog = ref(false)
const formRef = ref(null)

const dynasties = [
  { id: 'chunqiu', label: '春秋' }, { id: 'zhanguo', label: '战国' },
  { id: 'qin', label: '秦' }, { id: 'xihan', label: '西汉' }, { id: 'donghan', label: '东汉' },
  { id: 'sanguo', label: '三国' }, { id: 'xijin', label: '西晋' }, { id: 'dongjin', label: '东晋' },
  { id: 'nanbei', label: '南北朝' }, { id: 'sui', label: '隋' },
  { id: 'tang', label: '唐' }, { id: 'beisong', label: '北宋' }, { id: 'nansong', label: '南宋' },
  { id: 'yuan', label: '元' }, { id: 'ming', label: '明' }, { id: 'qing', label: '清' },
]

const form = ref({
  name: '', chinese_name: '', birth_date: '', death_date: '',
  nationality: '', dynasty: '', occupation: '', biography: '',
})

const rules = {
  name: [{ required: true, message: '英文名为必填项', trigger: 'blur' }],
  chinese_name: [{ required: true, message: '中文名为必填项', trigger: 'blur' }],
}

const isChinese = computed(() => {
  return form.value.nationality && form.value.nationality.includes('中国')
})

const previewHisId = computed(() => {
  if (!form.value.name && !form.value.chinese_name) return ''
  if (form.value.dynasty) return form.value.dynasty + '_XXXXXX'
  if (isChinese.value && !form.value.dynasty) return '请选择朝代'
  return 'F_XXXXXX'
})

watch(() => form.value.nationality, () => {
  if (!isChinese.value) form.value.dynasty = ''
})

function resetForm() {
  form.value = { name: '', chinese_name: '', birth_date: '', death_date: '', nationality: '', dynasty: '', occupation: '', biography: '' }
}

async function handleCreate() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  const rand = String(Math.floor(100000 + Math.random() * 900000))
  const his_id = form.value.dynasty
    ? form.value.dynasty + '_' + rand
    : 'F_' + rand
  await celebrityApi.create({ ...form.value, his_id })
  ElMessage.success('创建成功')
  showDialog.value = false
  resetForm()
  store.fetchList()
}

let debounceTimer = null
function debounceSearch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => store.setSearch(store.search), 400)
}

onMounted(() => {
  // 从 URL 读取搜索参数
  const q = route.query.search
  if (q) {
    store.search = q
    store.setSearch(q)
  } else {
    store.fetchList()
  }
  store.fetchFilters()
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-title { font-size: 24px; font-weight: 700; }
.filter-card { margin-bottom: 20px; border-radius: 12px; }
.celeb-card { margin-bottom: 16px; cursor: pointer; border-radius: 12px; transition: all 0.25s ease; }
.celeb-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
.card-avatar { width: 48px; height: 48px; line-height: 48px; border-radius: 50%; background: linear-gradient(135deg, #409eff, #6366f1); color: #fff; font-size: 18px; font-weight: 700; margin: 0 auto 8px; text-align: center; overflow: hidden; }
.card-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.card-name { font-size: 15px; font-weight: 600; text-align: center; margin-bottom: 2px; }
.card-en-name { font-size: 11px; color: #909399; text-align: center; margin-bottom: 6px; }
.card-info { text-align: center; margin-bottom: 4px; }
.card-rels { font-size: 12px; color: #409eff; text-align: center; }
.pagination-wrap { display: flex; justify-content: center; margin-top: 24px; }
</style>
