<template>
  <div class="works-page">
    <div class="works-grid">
      <div class="work-card" @click="$router.push('/admin/fourier')">
        <div class="work-icon">∑</div>
        <div class="work-name">傅里叶分析</div>
        <div class="work-desc">傅里叶级数 · 连续傅里叶变换 · 交互演示</div>
      </div>
    </div>
  </div>
</template>
<script setup>
</script>
<style scoped>
.works-page { max-width: 900px; }
.page-header { margin-bottom: 20px; }
.page-title { font-size: 24px; font-weight: 700; }
.works-grid { display: flex; flex-wrap: wrap; gap: 16px; }
.work-card {
  width: 220px; padding: 28px 20px; background: #fff; border-radius: 14px;
  border: 1px solid #e4e7ed; cursor: pointer; text-align: center;
  transition: all 0.2s;
}
.work-card:hover { border-color: #409eff; box-shadow: 0 4px 16px rgba(64,158,255,0.1); transform: translateY(-2px); }
.work-icon { font-size: 36px; color: #409eff; margin-bottom: 10px; }
.work-name { font-size: 16px; font-weight: 600; color: #303133; margin-bottom: 4px; }
.work-desc { font-size: 12px; color: #909399; }
</style>
