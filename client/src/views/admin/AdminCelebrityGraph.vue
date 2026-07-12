<template>
  <div class="graph-page" v-loading="loading">
    <div class="detail-header">
      <button class="back-arrow" @click="goBack">&lt;</button>
      <h2 class="detail-title" v-if="celebrity"><span class="title-name">{{ celebrity.chinese_name || celebrity.name }}</span> 关系图谱</h2>
      <h2 class="detail-title" v-else>关系图谱</h2>
    </div>
    <template v-if="celebrity">
      <!-- 上方：基本信息 -->
      <el-card shadow="never" class="profile-card">
        <div class="profile-row">
          <div class="profile-avatar">
            <img v-if="celebrity.image_url" :src="'/img/' + celebrity.image_url" />
            <span v-else>{{ (celebrity.chinese_name || celebrity.name).charAt(0) }}</span>
          </div>
          <div class="profile-body">
            <div class="profile-name">{{ celebrity.chinese_name || celebrity.name }}</div>
            <div class="profile-en" v-if="celebrity.chinese_name">{{ celebrity.name }}</div>
            <div class="profile-meta">
              <el-tag size="small" v-if="celebrity.nationality">{{ displayNationality(celebrity) }}</el-tag>
              <el-tag size="small" type="success" v-for="occ in (celebrity.occupation || '').split('、').filter(Boolean)" :key="occ" style="margin-left:4px">{{ occ }}</el-tag>
            </div>
            <div class="profile-dates" v-if="celebrity.birth_date">{{ celebrity.birth_date }} ~ {{ celebrity.death_date || '至今' }}</div>
          </div>
        </div>
      </el-card>

      <!-- 图谱工具栏 -->
      <div class="graph-toolbar">
        <el-select v-model="depth" style="width:160px" @change="loadGraph">
          <el-option label="仅关联自己" :value="1" />
          <el-option label="扩展至2层" :value="2" />
          <el-option label="扩展至3层" :value="3" />
        </el-select>
        <el-button @click="resetZoom" style="min-width:82px">重置视角</el-button>
        <el-button @click="resetState" style="min-width:82px">重置状态</el-button>
        <button class="toolbar-icon-btn" title="全屏" @click="toggleFullscreen">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="16" height="16"><path fill="currentColor" d="M160 480a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h288a32 32 0 0 1 0 64H192v256a32 32 0 0 1-32 32zm704 0a32 32 0 0 1-32-32V192H576a32 32 0 0 1 0-64h288a32 32 0 0 1 32 32v288a32 32 0 0 1-32 32zM160 544a32 32 0 0 1 32 32v256h256a32 32 0 1 1 0 64H160a32 32 0 0 1-32-32V576a32 32 0 0 1 32-32zm704 0a32 32 0 0 1 32 32v288a32 32 0 0 1-32 32H576a32 32 0 0 1 0-64h256V576a32 32 0 0 1 32-32z"/></svg>
        </button>
      </div>

      <!-- 下方：关系图谱 -->
      <el-card class="graph-card" :class="{ 'graph-fullscreen': graphFullscreen }" :body-style="{ overflow: 'hidden', height: '100%', padding: '0' }">
        <button v-if="graphFullscreen" class="exit-fullscreen-btn" title="退出全屏" @click="toggleFullscreen">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="16" height="16"><path fill="currentColor" d="M576 128a32 32 0 0 1 32-32h288a32 32 0 0 1 32 32v288a32 32 0 0 1-64 0V192H608a32 32 0 0 1-32-32zM128 576a32 32 0 0 1 32 32v256h256a32 32 0 1 1 0 64H160a32 32 0 0 1-32-32V608a32 32 0 0 1 32-32zm704 0a32 32 0 0 1 32 32v288a32 32 0 0 1-32 32H576a32 32 0 0 1 0-64h256V608a32 32 0 0 1 32-32zM128 160a32 32 0 0 1 32-32h288a32 32 0 0 1 0 64H192v256a32 32 0 0 1-64 0V160z"/></svg>
        </button>
        <button v-if="graphFullscreen" class="exit-fullscreen-btn" title="重置状态" @click="resetState" style="right:52px">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="18" height="18"><circle cx="512" cy="512" r="384" fill="none" stroke="currentColor" stroke-width="64" stroke-dasharray="200 160" stroke-linecap="round"/></svg>
        </button>
        <div class="graph-container" ref="graphRef">
          <svg ref="svgRef" class="graph-svg" @mousedown="onSvgDown" @mousemove="onSvgMove" @mouseup="onSvgUp" @wheel.prevent="onWheel">
            <defs>
              <marker v-for="(c, i) in nodeColors" :key="'ec'+i" :id="'ae-c'+i" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon :fill="c" points="0 0, 8 3, 0 6" />
              </marker>
              <marker v-for="(c, i) in nodeColors" :key="'sc'+i" :id="'as-c'+i" markerWidth="8" markerHeight="6" refX="0" refY="3" orient="auto">
                <polygon :fill="c" points="8 0, 0 3, 8 6" />
              </marker>
            </defs>
            <g ref="graphGroup">
              <g class="edges">
                <template v-for="(e, i) in edges" :key="'e-' + i">
                  <path v-if="e.source && e.target" :d="edgeD(e)" fill="none"
                    :stroke="nodeColor(e.target)" :stroke-width="hoveredEdge === i ? 2.5 : 1.5"
                    :opacity="hoveredEdge === i ? 1 : 0.6"
                    :marker-end="(e.type_direction === 'from' || e.type_direction === 'both') ? 'url(#ae-c' + ((e.target?.id ?? e.target) % nodeColors.length) + ')' : ''"
                    :marker-start="e.type_direction === 'both' ? 'url(#as-c' + ((e.source?.id ?? e.source) % nodeColors.length) + ')' : ''" @mouseenter="hoveredEdge = i" @mouseleave="hoveredEdge = null" />
                </template>
              </g>
              <g class="edge-labels">
                <template v-for="(ed, i) in edges" :key="'el-' + i">
                  <text v-if="ed?.source?.x != null && ed?.target?.x != null"
                    :x="edgeLabelPos(ed).x" :y="edgeLabelPos(ed).y"
                    text-anchor="middle" font-size="11" :fill="ed.type_color" font-weight="500"
                    class="edge-label">{{ ed.type_name }}</text>
                </template>
              </g>
              <g class="nodes">
                <g v-for="(n, i) in displayNodes" :key="'n-' + n.id"
                  :transform="`translate(${n.x}, ${n.y})`" class="graph-node"
                  @mouseenter="hoveredNode = i" @mouseleave="hoveredNode = null"
                  @mousedown.stop="onNodeDown($event, n, i)" @dblclick.stop="goDetail(n)">
                  <circle :r="nodeRadius(n)" :fill="nodeColor(n)" stroke="#fff" stroke-width="2" />
                  <text text-anchor="middle" :dy="nodeRadius(n) + 14" font-size="11" fill="#303133" font-weight="500" class="node-label">{{ n.chinese_name || n.name }}</text>
                </g>
              </g>
            </g>
          </svg>
          <div v-if="graphLoading" class="graph-loading"><span>加载图谱...</span></div>
          <el-empty v-if="!graphLoading && displayNodes.length === 0" description="暂无关系数据" />
        </div>
      </el-card>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { celebrityApi, graphApi } from '../../api/index.js'
import { displayNationality } from '../../utils/dynasty.js'
import { ZoomOut } from '@element-plus/icons-vue'
import * as d3Force from 'd3-force'
import * as d3Zoom from 'd3-zoom'
import * as d3Selection from 'd3-selection'

const route = useRoute()
const router = useRouter()

function goBack() {
  router.back()
}

const celebrity = ref(null)
const loading = ref(false)
const graphLoading = ref(false)
const graphRef = ref(null)
const svgRef = ref(null)
const graphGroup = ref(null)
const displayNodes = ref([])
const edges = ref([])
const hoveredNode = ref(null)
const hoveredEdge = ref(null)
const depth = ref(1)
const graphFullscreen = ref(false)

const nodeColors = ['#409eff', '#67c23a', '#f56c6c', '#909399', '#e6a23c', '#8b5cf6', '#10b981']

function edgeStart(s, t) {
  const dx = t.x - s.x, dy = t.y - s.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist === 0) return { x: s.x, y: s.y }
  return { x: s.x + (dx / dist) * (nodeRadius(s) + 2), y: s.y + (dy / dist) * (nodeRadius(s) + 2) }
}

function nodeRadius(n) {
  return Number(n.id) === Number(route.params.id) ? 24 : 16
}

function nodeColor(n) {
  const id = n?.id ?? n
  if (Number(id) === Number(route.params.id)) return '#e6a23c'
  return nodeColors[Number(id) % nodeColors.length]
}

function edgeEnd(s, t) {
  const dx = t.x - s.x, dy = t.y - s.y, dist = Math.sqrt(dx * dx + dy * dy)
  if (dist === 0) return { x: t.x, y: t.y }
  return { x: t.x - (dx / dist) * (nodeRadius(t) + 2), y: t.y - (dy / dist) * (nodeRadius(t) + 2) }
}

function edgeD(e) {
  const s = e.source, t = e.target
  if (!s?.x || !t?.x) return ''
  const end = edgeEnd(s, t)
  const start = edgeStart(s, t)
  const offset = e._curve || 0
  if (!offset) return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
  const dx = t.x - s.x, dy = t.y - s.y, len = Math.sqrt(dx * dx + dy * dy) || 1
  const sId = e.source?.id ?? e.source, tId = e.target?.id ?? e.target
  const dir = sId < tId ? 1 : -1
  const nx = -dy / len * offset * dir, ny = dx / len * offset * dir
  const mx = (start.x + end.x) / 2, my = (start.y + end.y) / 2
  return `M ${start.x} ${start.y} Q ${mx + nx} ${my + ny} ${end.x} ${end.y}`
}

function edgeLabelPos(e) {
  const s = e.source, t = e.target
  if (!s?.x || !t?.x) return { x: 0, y: 0 }
  const end = edgeEnd(s, t)
  const start = edgeStart(s, t)
  const curve = e._curve || 0
  if (!curve) return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 - 4 }
  const dx = t.x - s.x, dy = t.y - s.y, len = Math.sqrt(dx * dx + dy * dy) || 1
  const sId = e.source?.id ?? e.source, tId = e.target?.id ?? e.target
  const dir = sId < tId ? 1 : -1
  const curveNx = -dy / len * curve * dir, curveNy = dx / len * curve * dir
  const d = Math.sqrt(curveNx * curveNx + curveNy * curveNy) || 1
  return { x: (start.x + end.x) / 2 + curveNx * (1 + 6 / d), y: (start.y + end.y) / 2 - 4 + curveNy * (1 + 6 / d) }
}

async function loadGraph() {
  graphLoading.value = true
  try {
    const res = await graphApi.get({ centerId: route.params.id, depth: depth.value })
    const g = res.data
    const nodes = g.nodes || []
    const edgesData = g.edges || []
    const w = graphRef.value?.clientWidth || 900, h = graphRef.value?.clientHeight || 600
    nodes.forEach(n => { if (!n.x) { n.x = w * 0.1 + Math.random() * w * 0.8; n.y = h * 0.1 + Math.random() * h * 0.8 } })
    edgesData.forEach(e => { e.source = e.source_id; e.target = e.target_id })
    const groups = {}
    edgesData.forEach((e, i) => { const k = Math.min(e.source_id, e.target_id) + '|' + Math.max(e.source_id, e.target_id); if (!groups[k]) groups[k] = []; groups[k].push(i) })
    for (const ids of Object.values(groups)) {
      if (ids.length < 2) continue
      ids.forEach((idx, pos) => { edgesData[idx]._curve = ids.length % 2 === 0 ? (pos - ids.length / 2 + 0.5) * 14 : (pos - Math.floor(ids.length / 2)) * 14 })
    }
    displayNodes.value = nodes
    edges.value = edgesData
    await nextTick()
    startForceSimulation()
    setupZoom()
  } finally { graphLoading.value = false }
}

let simulation = null
function startForceSimulation() {
  if (simulation) simulation.stop()
  const w = graphRef.value?.clientWidth || 900, h = graphRef.value?.clientHeight || 600
  simulation = d3Force.forceSimulation(displayNodes.value)
    .force('center', d3Force.forceCenter(w / 2, h / 2))
    .force('charge', d3Force.forceManyBody().strength(-300))
    .force('link', d3Force.forceLink(edges.value).id(d => d.id).distance(120).strength(0.5))
    .force('collision', d3Force.forceCollide().radius(d => nodeRadius(d) + 20))
    .alpha(0.8).alphaDecay(0.02)
    .on('tick', () => {}).on('end', () => {})
}

let zoom = null
function setupZoom() {
  if (!svgRef.value || !graphGroup.value) return
  zoom = d3Zoom.zoom().scaleExtent([0.2, 4]).on('zoom', ev => d3Selection.select(graphGroup.value).attr('transform', ev.transform))
  d3Selection.select(svgRef.value).call(zoom)
}

function resetZoom() {
  if (zoom && svgRef.value) {
    d3Selection.select(svgRef.value).transition().duration(300).call(zoom.transform, d3Zoom.zoomIdentity)
  }
}

function resetState() {
  if (simulation) simulation.stop()
  // 重新随机初始化位置，重新跑力导
  const nodes = displayNodes.value
  if (graphRef.value) {
    const w = graphRef.value.clientWidth || 900, h = graphRef.value.clientHeight || 600
    nodes.forEach(n => { n.x = w * 0.1 + Math.random() * w * 0.8; n.y = h * 0.1 + Math.random() * h * 0.8 })
  }
  startForceSimulation()
  setupZoom()
}

let dragNode = null, dragOffset = { x: 0, y: 0 }
function onNodeDown(event, node, i) {
  if (event.button !== 0) return
  const rect = graphRef.value.getBoundingClientRect()
  dragNode = node; dragOffset = { x: event.clientX - node.x - rect.left, y: event.clientY - node.y - rect.top }
  node.fx = node.x; node.fy = node.y
  if (simulation) simulation.alphaTarget(0.1).restart()
  event.preventDefault()
}
function onSvgMove(event) {
  if (!dragNode) return
  const rect = graphRef.value.getBoundingClientRect()
  dragNode.fx = event.clientX - rect.left - dragOffset.x; dragNode.fy = event.clientY - rect.top - dragOffset.y
}
function onSvgUp() {
  if (dragNode) { dragNode.fx = null; dragNode.fy = null; if (simulation) simulation.alpha(0).stop() }
  dragNode = null
}
function onSvgDown() { }
function onWheel() {}

function goDetail(n) { if (n.id !== Number(route.params.id)) router.push('/admin/celebrity-detail/' + n.id) }

function toggleFullscreen() {
  graphFullscreen.value = !graphFullscreen.value
}

async function load() {
  loading.value = true
  try { const res = await celebrityApi.get(route.params.id); celebrity.value = res.data } finally { loading.value = false }
}

onMounted(() => { load(); loadGraph() })
onUnmounted(() => { if (simulation) simulation.stop() })
</script>

<style scoped>
.graph-page { max-width: 1400px; }
.detail-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.back-arrow { width: 28px; height: 28px; border-radius: 50%; background: #fff; border: 1px solid #e4e7ed; color: #606266; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0; }
.back-arrow:hover { border-color: #409eff; color: #409eff; }
.detail-title { font-size: 18px; font-weight: 600; color: #303133; margin: 0; }
.title-name { color: #d97706; }

/* ── 基本信息卡片 ── */
.profile-card { margin-bottom: 16px; border-radius: 12px; }
.profile-row { display: flex; align-items: center; gap: 16px; }
.profile-avatar { width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background: linear-gradient(135deg, #409eff, #6366f1); color: #fff; font-size: 22px; font-weight: 700; text-align: center; flex-shrink: 0; overflow: hidden; }
.profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
.profile-body { display: flex; flex-direction: column; gap: 2px; }
.profile-name { font-size: 18px; font-weight: 700; color: #303133; }
.profile-en { font-size: 12px; color: #909399; }
.profile-meta { margin-top: 2px; }
.profile-dates { font-size: 12px; color: #909399; margin-top: 2px; }

/* ── 图谱工具栏 ── */
.graph-toolbar { display: flex; align-items: center; margin-bottom: 10px; }
.graph-toolbar > * + * { margin-left: 10px; }
.toolbar-icon-btn { padding: 0; min-width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #dcdfe6; border-radius: 4px; background: #fff; color: #606266; cursor: pointer; font-size: 14px; transition: all 0.15s; }
.toolbar-icon-btn:hover { border-color: #409eff; color: #409eff; background: #ecf5ff; }

/* ── 图谱区域 ── */
.graph-card { flex: 1; border-radius: 12px; overflow: hidden; height: calc(100vh - 240px); transition: all 0.3s; position: relative; }
.graph-card.graph-fullscreen { position: fixed; inset: 0; z-index: 1000; height: 100vh; border-radius: 0; }
.graph-card.graph-fullscreen :deep(.el-card__body) { height: 100vh !important; }
.exit-fullscreen-btn {
  position: absolute; top: 12px; right: 12px; z-index: 10;
  width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center;
  border: 1px solid #dcdfe6; border-radius: 6px; background: rgba(255,255,255,0.9);
  color: #606266; cursor: pointer; font-size: 14px; transition: all 0.15s;
}
.exit-fullscreen-btn:hover { border-color: #409eff; color: #409eff; background: #fff; }
.graph-container { position: relative; width: 100%; height: 100%; min-height: 400px; overflow: hidden; background: radial-gradient(ellipse at center, #f8f9fb 0%, #f0f2f5 100%); }
.graph-svg { width: 100%; height: 100%; cursor: grab; }
.graph-svg:active { cursor: grabbing; }
.graph-node { cursor: pointer; }
.graph-node:hover .node-label { fill: #409eff; }
.node-label { pointer-events: none; }
.edge-label { pointer-events: none; }
.graph-loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.7); color: #909399; font-size: 14px; }
</style>
