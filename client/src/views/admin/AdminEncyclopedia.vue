<template>
  <div class="encyclopedia">
    <div v-if="favorites.length" class="fav-grid">
      <div class="fav-card" v-for="c in favorites" :key="c.id">
        <div class="fav-avatar">
          <img v-if="c.image_url" :src="'/img/' + c.image_url" />
          <span v-else>{{ (c.chinese_name || c.name).charAt(0) }}</span>
        </div>
        <div class="fav-name">{{ c.chinese_name || c.name }}</div>
        <div class="fav-en" v-if="c.chinese_name">{{ c.name }}</div>
        <div class="fav-meta">
          <el-tag size="small">{{ c.nationality?.replace('中国_', '') || c.nationality }}</el-tag>
          <el-tag size="small" type="success" style="margin-left:4px">{{ c.occupation?.split('、')[0] }}</el-tag>
        </div>
        <div class="fav-dates" v-if="c.birth_date">{{ c.birth_date }} ~ {{ c.death_date || '至今' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { celebrityApi } from '../../api/index.js'

const favorites = ref([])

onMounted(async () => {
  const res = await celebrityApi.favorites()
  if (res.success) favorites.value = res.data || []
})
</script>

<style scoped>
.encyclopedia { max-width: 1200px; width: 100%; margin: 0 auto; }
.page-header { margin-bottom: 20px; }
.page-title { font-size: 24px; font-weight: 700; }
.fav-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}
.fav-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 14px;
  padding: 28px 14px 20px;
  text-align: center;
  transition: all 0.25s ease;
  cursor: default;
}
.fav-card:hover {
  box-shadow: 0 8px 28px rgba(0,0,0,0.07);
  transform: translateY(-3px);
  border-color: transparent;
}
.fav-avatar {
  width: 64px; height: 64px; line-height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #6366f1);
  color: #fff; font-size: 26px; font-weight: 700;
  margin: 0 auto 12px; overflow: hidden;
}
.fav-avatar img { width: 100%; height: 100%; object-fit: cover; }
.fav-name { font-size: 16px; font-weight: 600; color: #303133; margin-bottom: 2px; }
.fav-en { font-size: 11px; color: #c0c4cc; margin-bottom: 6px; }
.fav-meta { margin-bottom: 6px; }
.fav-dates { font-size: 11px; color: #909399; }
</style>
