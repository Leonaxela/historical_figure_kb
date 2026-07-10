<template>
  <div ref="container" class="wc3d-container">
    <div v-if="!data.length" class="wc3d-empty">加载中…</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'

const props = defineProps({
  data: { type: Array, default: () => [] },
  width: { type: Number, default: 800 },
  height: { type: Number, default: 380 },
  onLabelClick: { type: Function, default: null },
})

const container = ref(null)
let scene, camera, renderer, controls, animId
let labelItems = []

const colors = ['#4f8cf7','#06d6a0','#ffd166','#ef476f','#b980f0','#00bbf9','#fe7f2d','#7bdff2','#e07be0','#43aa8b','#f9a03f','#577590','#f25c54','#7b2cbf','#3c6e71']

function getSize(weight) {
  const items = props.data
  if (!items.length) return 16
  const maxW = Math.max(...items.map(d => d.weight), 1)
  return 14 + (weight / maxW) * 24
}

function init() {
  if (!container.value) return
  const w = container.value.clientWidth || props.width
  const h = container.value.clientHeight || props.height

  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(45, w / h, 1, 1000)
  camera.position.set(0, 0, 260)

  renderer = new CSS2DRenderer()
  renderer.setSize(w, h)
  renderer.domElement.style.background = 'transparent'
  container.value.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.autoRotate = true
  controls.autoRotateSpeed = 2.0
  controls.minDistance = 100
  controls.maxDistance = 500

  buildCloud()
  animate()
}

function buildCloud() {
  labelItems.forEach(l => scene.remove(l))
  labelItems = []

  const items = props.data
  if (!items.length) return

  const radius = 110
  const total = items.length

  items.forEach((item, i) => {
    const el = document.createElement('span')
    el.textContent = item.chinese_name || item.name
    el.style.color = colors[i % colors.length]
    el.style.fontSize = getSize(item.weight) + 'px'
    el.style.fontFamily = '"Microsoft YaHei", "PingFang SC", sans-serif'
    el.style.fontWeight = '700'
    el.style.cursor = 'pointer'
    el.style.userSelect = 'none'
    el.style.textShadow = '0 2px 8px rgba(0,0,0,0.15)'
    el.dataset.wcId = String(item.id)

    const label = new CSS2DObject(el)

    const phi = Math.acos(1 - 2 * (i + 0.5) / total)
    const theta = Math.PI * (1 + Math.sqrt(5)) * i

    label.position.x = radius * Math.sin(phi) * Math.cos(theta)
    label.position.y = radius * Math.sin(phi) * Math.sin(theta)
    label.position.z = radius * Math.cos(phi)

    scene.add(label)
    labelItems.push(label)
  })
}

function animate() {
  animId = requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

function resize() {
  if (!container.value || !renderer) return
  const w = container.value.clientWidth
  const h = container.value.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

// ── 点击处理：不依赖 Three.js 事件，通过 elementsFromPoint 查找 ──
let downX = 0, downY = 0
function onPointerDown(e) {
  downX = e.clientX
  downY = e.clientY
}
function onPointerUp(e) {
  const dx = Math.abs(e.clientX - downX)
  const dy = Math.abs(e.clientY - downY)
  if (dx > 6 || dy > 6) return // 拖拽，忽略

  // 从鼠标位置找所有元素
  const els = document.elementsFromPoint(e.clientX, e.clientY)
  for (const el of els) {
    const span = el.closest?.('span[data-wc-id]')
    if (span) {
      props.onLabelClick?.(Number(span.dataset.wcId))
      return
    }
  }
}

watch(() => props.data, () => {
  buildCloud()
  if (renderer) renderer.render(scene, camera)
})

onMounted(() => {
  init()
  window.addEventListener('resize', resize)
  // capture 阶段先于 OrbitControls 处理，elementsFromPoint 独立检测点击
  container.value?.addEventListener('pointerdown', onPointerDown, true)
  container.value?.addEventListener('pointerup', onPointerUp, true)
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
  window.removeEventListener('resize', resize)
  renderer?.domElement?.remove()
})
</script>

<style scoped>
.wc3d-container {
  width: 100%;
  height: 380px;
  overflow: hidden;
  border-radius: 10px;
  position: relative;
  background: radial-gradient(ellipse at center, #f8faff 0%, #f0f4ff 100%);
}
.wc3d-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba(64,158,255,0.04) 0%, transparent 60%);
  pointer-events: none;
}
.wc3d-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 14px;
}
</style>
