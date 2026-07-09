<template>
  <div class="graph-page">
    <div class="graph-header">
      <h1 class="page-title">关系图谱</h1>
      <div class="graph-tools">
        <el-select v-model="categoryFilter" placeholder="关系类别" clearable style="width:130px" @change="loadGraph">
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
        </el-select>
        <el-select v-model="centerId" placeholder="中心人物" filterable clearable style="width:160px" @change="loadGraph">
          <el-option v-for="c in allCelebrities" :key="c.id" :label="c.chinese_name || c.name" :value="c.id" />
        </el-select>
        <el-select v-model="depth" style="width:130px" @change="loadGraph">
          <el-option label="仅直接关系" :value="1" />
          <el-option label="扩展至两层" :value="2" />
        </el-select>
        <el-button @click="resetZoom" :icon="ZoomOut">重置视角</el-button>
      </div>
    </div>

    <el-card shadow="never" class="graph-card" :body-style="{ overflow: 'hidden', height: '100%', padding: '0' }">
      <div class="graph-container" ref="graphRef">
        <svg ref="svgRef" class="graph-svg" @mousedown="onSvgDown" @mousemove="onSvgMove" @mouseup="onSvgUp" @wheel.prevent="onWheel">
          <!-- 箭头定义（按节点颜色索引）-->
          <defs>
            <marker v-for="(c, i) in nodeColors" :key="'ec'+i"
              :id="'ae-c'+i" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon :fill="c" points="0 0, 8 3, 0 6" />
            </marker>
            <marker v-for="(c, i) in nodeColors" :key="'sc'+i"
              :id="'as-c'+i" markerWidth="8" markerHeight="6" refX="0" refY="3" orient="auto">
              <polygon :fill="c" points="8 0, 0 3, 8 6" />
            </marker>
          </defs>
          <g ref="graphGroup">
            <!-- 连线 -->
            <g class="edges">
              <template v-for="(e, i) in edges" :key="'e-' + i">
                <path v-if="e.source && e.target"
                  :d="edgeD(e)"
                  fill="none"
                  :stroke="nodeColor(e.target)"
                  :stroke-width="hoveredEdge === i || selectedNode === (e.source?.id ?? e.source) || selectedNode === (e.target?.id ?? e.target) ? 2.5 : 1.5"
                  :opacity="hoveredEdge === i ? 1 : 0.6"
                  :marker-end="(e.type_direction === 'from' || e.type_direction === 'both') ? 'url(#ae-c' + ((e.target?.id ?? e.target) % 8) + ')' : ''"
                  :marker-start="e.type_direction === 'both' ? 'url(#as-c' + ((e.source?.id ?? e.source) % 8) + ')' : ''"
                  class="graph-edge"
                  @mouseenter="hoveredEdge = i"
                  @mouseleave="hoveredEdge = null"
                />
              </template>
            </g>

            <!-- 连线标签 -->
            <g class="edge-labels">
              <template v-for="(ed, i) in edges" :key="'el-' + i">
                <text v-if="ed?.source?.x != null && ed?.target?.x != null"
                  :x="edgeLabelPos(ed).x"
                  :y="edgeLabelPos(ed).y"
                  text-anchor="middle" font-size="11" :fill="ed.type_color" font-weight="500"
                  class="edge-label"
                >{{ ed.type_name }}</text>
              </template>
            </g>

            <!-- 节点 -->
            <g class="nodes">
              <g v-for="(n, i) in displayNodes" :key="'n-' + n.id"
                :transform="`translate(${n.x}, ${n.y})`"
                :class="{ 'node-hover': hoveredNode === i, 'node-selected': selectedNode === n.id }"
                class="graph-node"
                @mouseenter="hoveredNode = i"
                @mouseleave="hoveredNode = null"
                @mousedown.stop="onNodeDown($event, n, i)"
                @dblclick.stop="showNodeDetail(n)"
              >
                <circle :r="nodeRadius(n)" :fill="nodeColor(n)" stroke="#fff" stroke-width="2"
                  :class="{ 'pulse': selectedNode === n.id }" />
                <text text-anchor="middle" :dy="nodeRadius(n) + 14" font-size="11" fill="#303133" font-weight="500"
                  class="node-label">{{ n.chinese_name || n.name }}</text>
                <text text-anchor="middle" :dy="nodeRadius(n) + 26" font-size="9" fill="#909399"
                  v-if="n.occupation">{{ n.occupation.split('、')[0] }}</text>
              </g>
            </g>
          </g>
        </svg>

        <!-- 加载 -->
        <div v-if="loading" class="graph-loading">
          <el-icon class="is-loading" :size="32"><Loading /></el-icon>
          <p>加载图谱数据...</p>
        </div>

        <!-- 空状态 -->
        <el-empty v-if="!loading && displayNodes.length === 0" description="暂无图谱数据，请先导入名人" />
      </div>
    </el-card>

    <!-- 节点详情弹窗 -->
    <el-dialog v-model="showDetail" :title="detailNode?.chinese_name || detailNode?.name" width="380px" @close="selectedNode = null">
      <div class="detail-popup" v-if="detailNode">
        <div class="popup-avatar">{{ (detailNode.chinese_name || detailNode.name).charAt(0) }}</div>
        <p class="popup-name">{{ detailNode.chinese_name || detailNode.name }}</p>
        <p class="popup-en" v-if="detailNode.chinese_name">{{ detailNode.name }}</p>
        <p class="popup-bio" v-if="detailNode.biography">{{ detailNode.biography.slice(0, 100) }}...</p>
        <div class="popup-meta">
          <span v-if="detailNode.nationality">🌍 {{ displayNationality(detailNode) }}</span>
          <span v-if="detailNode.occupation">💼 {{ detailNode.occupation }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <el-button type="primary" @click="goToDetail">查看完整资料</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { graphApi, celebrityApi, relationApi } from '../api/index.js'
import * as d3Force from 'd3-force'
import * as d3Zoom from 'd3-zoom'
import * as d3Selection from 'd3-selection'
import { ZoomOut, Loading } from '@element-plus/icons-vue'
import { displayNationality } from '../utils/dynasty.js'

const route = useRoute()
const router = useRouter()

const graphRef = ref(null)
const svgRef = ref(null)
const graphGroup = ref(null)
const loading = ref(false)
const displayNodes = ref([])
const edges = ref([])
const hoveredNode = ref(null)
const hoveredEdge = ref(null)
const selectedNode = ref(null)
const relationTypes = ref([])
const allCelebrities = ref([])
const showDetail = ref(false)
const detailNode = ref(null)

const typeFilter = ref(route.query.type || '')
const categoryFilter = ref('')
const categories = computed(() => [...new Set(relationTypes.value.map(t => t.category).filter(Boolean))])
const centerId = ref(route.query.centerId ? Number(route.query.centerId) : null)
const depth = ref(Number(route.query.depth) || 1)

const nodeColors = ['#409eff', '#67c23a', '#f56c6c', '#909399', '#e6a23c', '#8b5cf6', '#10b981']

function nodeRadius(n) {
  const base = 16
  const count = n.relation_count || edges.value.filter(e => {
    const sId = e.source?.id ?? e.source
    const tId = e.target?.id ?? e.target
    return Number(sId) === Number(n.id) || Number(tId) === Number(n.id)
  }).length
  return Math.min(base + count * 2, 32)
}

function nodeColor(n) {
  if (selectedNode.value === n.id) return '#e6a23c'
  return nodeColors[Number(n.id) % nodeColors.length]
}

// 计算连线在目标圆周上的终点（减去半径，使箭头不被圆遮住）
function edgeEnd(s, t) {
  const dx = t.x - s.x, dy = t.y - s.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist === 0) return { x: t.x, y: t.y }
  return { x: t.x - (dx / dist) * (nodeRadius(t) + 2), y: t.y - (dy / dist) * (nodeRadius(t) + 2) }
}

// 生成 SVG path 的 d 属性（平行边自动弯曲）
function edgeD(e) {
  const s = e.source, t = e.target
  if (!s?.x || !t?.x) return ''
  const end = edgeEnd(s, t)
  const offset = e._curve || 0
  if (!offset) return `M ${s.x} ${s.y} L ${end.x} ${end.y}`
  const dx = t.x - s.x, dy = t.y - s.y
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  // 按 ID 大小固定方向：ID 小→大为正，大→小为反
  const sId = e.source?.id ?? e.source
  const tId = e.target?.id ?? e.target
  const dir = sId < tId ? 1 : -1
  const nx = -dy / len * offset * dir, ny = dx / len * offset * dir
  const mx = (s.x + end.x) / 2, my = (s.y + end.y) / 2
  return `M ${s.x} ${s.y} Q ${mx + nx} ${my + ny} ${end.x} ${end.y}`
}

// 平行边的标签位置（偏移方向与连线一致）
function edgeLabelPos(e) {
  const s = e.source, t = e.target
  if (!s?.x || !t?.x) return { x: 0, y: 0 }
  const end = edgeEnd(s, t)
  const curve = e._curve || 0
  if (!curve) return { x: (s.x + end.x) / 2, y: (s.y + end.y) / 2 - 4 }
  const dx = t.x - s.x, dy = t.y - s.y
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const sId = e.source?.id ?? e.source
  const tId = e.target?.id ?? e.target
  const dir = sId < tId ? 1 : -1
  const curveNx = -dy / len * curve * dir
  const curveNy = dx / len * curve * dir
  const d = Math.sqrt(curveNx * curveNx + curveNy * curveNy) || 1
  const nx = curveNx * (1 + 6 / d)
  const ny = curveNy * (1 + 6 / d)
  return { x: (s.x + end.x) / 2 + nx, y: (s.y + end.y) / 2 - 4 + ny }
}

async function loadGraph() {
  loading.value = true
  try {
    const res = await graphApi.get({
      centerId: centerId.value || undefined,
      depth: depth.value,
      category: categoryFilter.value || undefined,
    })
    const g = res.data
    const nodes = g.nodes || []
    const edgesData = g.edges || []

    // 初始化位置（随机展开）
    const w = graphRef.value?.clientWidth || 900
    const h = graphRef.value?.clientHeight || 600
    nodes.forEach(n => {
      if (!n.x) {
        n.x = w * 0.1 + Math.random() * w * 0.8
        n.y = h * 0.1 + Math.random() * h * 0.8
      }
    })

    // 把边的 source_id/target_id 设为数字 ID（D3 forceLink 通过 id accessor 解析）
    edgesData.forEach(e => {
      e.source = e.source_id
      e.target = e.target_id
    })

    // 计算平行边的曲线偏移量（基于 source_id/target_id，不受 D3 影响）
    const groups = {}
    edgesData.forEach((e, i) => {
      const key = Math.min(e.source_id, e.target_id) + '|' + Math.max(e.source_id, e.target_id)
      if (!groups[key]) groups[key] = []
      groups[key].push(i)
    })
    for (const indices of Object.values(groups)) {
      if (indices.length < 2) continue
      const total = indices.length
      indices.forEach((idx, pos) => {
        edgesData[idx]._curve = total % 2 === 0
          ? (pos - total / 2 + 0.5) * 14
          : (pos - Math.floor(total / 2)) * 14
      })
    }

    displayNodes.value = nodes
    edges.value = edgesData

    await nextTick()
    startForceSimulation()
  } finally {
    loading.value = false
  }
}

// 力导向模拟
let simulation = null
function startForceSimulation() {
  if (simulation) simulation.stop()

  const w = graphRef.value?.clientWidth || 900
  const h = graphRef.value?.clientHeight || 600
  const nodes = displayNodes.value
  const links = edges.value

  simulation = d3Force.forceSimulation(nodes)
    .force('center', d3Force.forceCenter(w / 2, h / 2))
    .force('charge', d3Force.forceManyBody().strength(-300))
    .force('link', d3Force.forceLink(links).id(d => d.id).distance(120).strength(0.5))
    .force('collision', d3Force.forceCollide().radius(d => nodeRadius(d) + 20))
    .alpha(0.8)
    .alphaDecay(0.02)
    .on('tick', () => {
      // Vue reactivity handles the update
    })
    .on('end', () => {})
}

// 缩放 — 直接操作 wrapper <g>
let zoom = null
function setupZoom() {
  if (!svgRef.value || !graphGroup.value) return
  zoom = d3Zoom.zoom()
    .scaleExtent([0.2, 4])
    .on('zoom', (event) => {
      d3Selection.select(graphGroup.value).attr('transform', event.transform)
    })
  d3Selection.select(svgRef.value).call(zoom)
}

function resetZoom() {
  if (zoom && svgRef.value) {
    d3Selection.select(svgRef.value).transition().duration(300).call(zoom.transform, d3Zoom.zoomIdentity)
  }
}

// 节点拖拽
let dragNode = null
let dragOffset = { x: 0, y: 0 }

function onNodeDown(event, node, i) {
  if (event.button !== 0) return
  const rect = graphRef.value.getBoundingClientRect()
  dragNode = node
  dragOffset = { x: event.clientX - node.x - rect.left, y: event.clientY - node.y - rect.top }
  // 用 D3 的 fx/fy 固定节点位置，其他节点继续受模拟力影响
  node.fx = node.x
  node.fy = node.y
  if (simulation) simulation.alphaTarget(0.1).restart()
  event.preventDefault()
}

function onSvgMove(event) {
  if (!dragNode) return
  const rect = graphRef.value.getBoundingClientRect()
  dragNode.fx = event.clientX - rect.left - dragOffset.x
  dragNode.fy = event.clientY - rect.top - dragOffset.y
}

function onSvgUp() {
  if (dragNode) {
    dragNode.fx = null
    dragNode.fy = null
    // 松手后冻结核子，避免 link force 往回拉
    if (simulation) simulation.alpha(0).stop()
  }
  dragNode = null
}

function onSvgDown(event) {
  selectedNode.value = null
}

// 滚轮缩放（已阻止默认行为，由 d3-zoom 处理）
function onWheel(event) {}

// 节点详情
function showNodeDetail(node) {
  selectedNode.value = node.id
  detailNode.value = node
  showDetail.value = true
}

function goToDetail() {
  showDetail.value = false
  if (detailNode.value) {
    router.push('/celebrities/' + detailNode.value.id)
  }
}

// 加载选项
async function loadOptions() {
  const [typesRes, listRes] = await Promise.all([
    relationApi.types(),
    celebrityApi.list({ pageSize: 200 }),
  ])
  relationTypes.value = typesRes.data || []
  allCelebrities.value = listRes.data || []
}

onMounted(() => {
  loadOptions()
  loadGraph()
  nextTick(setupZoom)
})

onUnmounted(() => {
  if (simulation) simulation.stop()
})
</script>

<style scoped>
.graph-page { display: flex; flex-direction: column; height: calc(100vh - 140px); overflow: hidden; }
.graph-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 24px; font-weight: 700; }
.graph-tools { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.graph-card { flex: 1; border-radius: 12px; overflow: hidden; }
.graph-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 500px;
  overflow: hidden;
  background: radial-gradient(ellipse at center, #f8f9fb 0%, #f0f2f5 100%);
}
.graph-svg { width: 100%; height: 100%; cursor: grab; }
.graph-svg:active { cursor: grabbing; }
.graph-edge { transition: opacity 0.2s, stroke-width 0.2s; cursor: pointer; }
.graph-node { cursor: pointer; transition: transform 0.1s; }
.graph-node:hover .node-label { fill: #409eff; }
.node-hover circle { filter: brightness(1.1); }
.node-selected circle { filter: drop-shadow(0 0 6px rgba(230, 162, 60, 0.6)); }
.node-label { pointer-events: none; }
.edge-label { pointer-events: none; }
.pulse { animation: pulseNode 1s ease-in-out 2; }
@keyframes pulseNode {
  0%, 100% { r: inherit; }
  50% { r: calc(inherit + 4px); }
}
.graph-loading {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  background: rgba(255,255,255,0.7);
  font-size: 14px; color: #909399;
}
.detail-popup { text-align: center; }
.popup-avatar {
  width: 64px; height: 64px; line-height: 64px;
  border-radius: 50%; background: linear-gradient(135deg, #409eff, #6366f1);
  color: #fff; font-size: 24px; font-weight: 700;
  margin: 0 auto 12px;
}
.popup-name { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
.popup-en { font-size: 13px; color: #909399; margin-bottom: 8px; }
.popup-bio { font-size: 13px; color: #606266; margin-bottom: 8px; line-height: 1.5; }
.popup-meta { display: flex; gap: 12px; justify-content: center; font-size: 13px; color: #909399; }
</style>
