<template>
  <div class="marquee-wrapper" @mouseenter="paused = true" @mouseleave="paused = false">
    <div class="marquee-track" ref="trackRef">
      <div class="marquee-content" ref="contentRef" :style="{ transform: 'translateX(' + offset + 'px)' }">
        <div v-for="(item, i) in items" :key="i" class="marquee-item" @click="goDetail(item)">
          <div class="marq-avatar">
            <img v-if="item.image_url" :src="'/img/' + item.image_url" />
            <span v-else>{{ (item.chinese_name || item.name).charAt(0) }}</span>
          </div>
          <span class="marq-name">{{ item.chinese_name || item.name }}</span>
        </div>
      </div>
    </div>
    <p class="marquee-hint">白驹过隙，星光流转</p>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  celebrities: { type: Array, default: () => [] },
})

const paused = ref(false)
const router = useRouter()

function goDetail(item) {
  router.push('/admin/encyclopedia/' + item.id)
}
const offset = ref(0)
const trackRef = ref(null)
const contentRef = ref(null)
let animId = null
let speed = 0.6

function parseYear(dateStr) {
  if (!dateStr) return Infinity
  let s = dateStr.trim()
  let negative = false
  if (s.includes('公元前') || s.startsWith('前')) negative = true
  const m = s.match(/(\d+)/)
  if (!m) return Infinity
  return negative ? -parseInt(m[1]) : parseInt(m[1])
}

const sorted = computed(() => {
  return [...props.celebrities].sort((a, b) => parseYear(a.birth_date) - parseYear(b.birth_date))
})

const items = computed(() => sorted.value)

function tick() {
  if (!paused.value) {
    offset.value -= speed
    const trackW = trackRef.value?.clientWidth || 0
    const contentW = contentRef.value?.scrollWidth || 0
    if (offset.value < -contentW) {
      offset.value = trackW
    }
  }
  animId = requestAnimationFrame(tick)
}

onMounted(async () => {
  await nextTick()
  const trackW = trackRef.value?.clientWidth || 0
  offset.value = trackW
  animId = requestAnimationFrame(tick)
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
})
</script>

<style scoped>
.marquee-wrapper {
  margin: 0 0 32px;
  width: 100%;
  overflow: hidden;
}
.marquee-track {
  width: 100%;
  overflow: hidden;
}
.marquee-content {
  display: flex;
  gap: 24px;
  width: fit-content;
}

.marquee-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  transition: transform 0.2s;
}
.marquee-item:hover {
  transform: translateY(-4px);
}

.marq-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #6366f1);
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 3px 10px rgba(64, 158, 255, 0.2);
}
.marq-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.marq-name {
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.marquee-hint {
  text-align: center;
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 12px;
}
</style>
