<template>
  <div class="celebrity-list">
    <div class="page-header">
      <h1 class="page-title">名人库</h1>
    </div>

    <el-card shadow="never" class="filter-card">
      <el-row :gutter="16" align="middle">
        <el-col :span="8">
          <el-input v-model="store.search" placeholder="搜索中文名、英文名..." clearable
            @input="debounceSearch" @clear="store.setSearch('')">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </el-col>
        <el-col :span="5">
          <el-select v-model="store.tagId" placeholder="称谓" clearable filterable
            @change="store.setFilter('tagId', $event || '')" style="width:100%">
            <el-option v-for="t in store.tags" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-col>
        <el-col :span="5">
          <el-select v-model="store.nationality" placeholder="国籍/朝代" clearable filterable
            @change="store.setFilter('nationality', $event || '')" style="width:100%">
            <el-option v-for="n in store.nationalities" :key="n" :label="n.replace('中国_', '')" :value="n" />
          </el-select>
        </el-col>
        <el-col :span="5">
          <el-select v-model="store.occupation" placeholder="职业" clearable filterable
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
      <span class="pagination-total">共 {{ store.total }} 人</span>
      <el-pagination
        v-model:current-page="store.page"
        :page-size="store.pageSize"
        :total="store.total"
        layout="prev, pager, next"
        @current-change="store.setPage"
      />
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCelebrityStore } from '../stores/celebrities.js'
import { Search } from '@element-plus/icons-vue'
import { displayNationality } from '../utils/dynasty.js'

const route = useRoute()
const store = useCelebrityStore()

let debounceTimer = null
function debounceSearch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => store.setSearch(store.search), 400)
}

onMounted(() => {
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
.pagination-wrap { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 24px; }
.pagination-total { font-size: 13px; color: #909399; white-space: nowrap; }
</style>
