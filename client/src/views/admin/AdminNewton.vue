<template>
  <div class="newton-page">
    <button class="back-btn" @click="$router.push('/admin/works')">&lt; 返回</button>
    <div class="center-wrap">
      <div class="page-header">
        <h1 class="page-title">牛顿三大定律 · 交互演示</h1>
      </div>
      <div class="page-desc">
        <p>牛顿运动定律是经典力学的基石，由英国物理学家艾萨克·牛顿在《自然哲学的数学原理》（1687年）中提出。三大定律描述了力与运动之间的基本关系，是理解宏观物体运动规律的核心工具。</p>
        <p>本页面通过<strong>3 个交互模块</strong>，以可视化 + 参数调节的方式帮助你直观理解每一条定律。</p>
      </div>

      <!-- 第一定律 -->
      <p class="law-intro">任何物体在不受外力或所受合外力为零时，保持静止或匀速直线运动状态不变。——这就是惯性定律。下面演示一个滑块在光滑表面 vs 粗糙表面上的运动差异。</p>
      <el-card shadow="never" class="law-card">
        <template #header><span>📐 ① 牛顿第一定律 · 惯性定律</span></template>
        <div class="formula-body">
          <div class="formula-latex" v-html="latex1"></div>
        </div>
        <div class="canvas-wrap"><canvas ref="c1" width="700" height="260"></canvas></div>
        <div class="controls">
          <span class="ctrl-label">摩擦力 = {{ friction.toFixed(1) }}</span>
          <el-slider v-model="friction" :min="0" :max="1" :step="0.05" style="width:220px" @input="draw1" />
          <el-button size="small" @click="reset1">重置</el-button>
          <el-button size="small" @click="play1 ? pause1() : start1()">{{ play1 ? '⏸' : '▶' }}</el-button>
        </div>
      </el-card>

      <!-- 第二定律 -->
      <p class="law-intro">物体的加速度与所受合外力成正比，与质量成反比，方向与合外力方向相同。拖拽滑块调整力和质量，观察加速度的变化。</p>
      <el-card shadow="never" class="law-card" style="margin-top:18px">
        <template #header><span>📈 ② 牛顿第二定律 · F = ma</span></template>
        <div class="formula-body">
          <div class="formula-latex" v-html="latex2"></div>
        </div>
        <div class="canvas-wrap"><canvas ref="c2" width="700" height="260"></canvas></div>
        <div class="controls">
          <span class="ctrl-label">力 F = {{ force.toFixed(0) }} N</span>
          <el-slider v-model="force" :min="5" :max="100" :step="1" style="width:200px" @input="draw2" />
          <span class="ctrl-label" style="margin-left:12px">质量 m = {{ mass.toFixed(0) }} kg</span>
          <el-slider v-model="mass" :min="1" :max="20" :step="0.5" style="width:200px" @input="draw2" />
          <span class="ctrl-label" style="margin-left:12px">加速度 a = {{ (force / mass).toFixed(1) }} m/s²</span>
        </div>
      </el-card>

      <!-- 第三定律 -->
      <p class="law-intro">两个物体之间的作用力和反作用力总是大小相等、方向相反、作用在同一条直线上。下面演示两个人相互推拉时各自的运动。</p>
      <el-card shadow="never" class="law-card" style="margin-top:18px">
        <template #header><span>🔄 ③ 牛顿第三定律 · 作用与反作用</span></template>
        <div class="formula-body">
          <div class="formula-latex" v-html="latex3"></div>
        </div>
        <div class="canvas-wrap"><canvas ref="c3" width="700" height="280"></canvas></div>
        <div class="controls">
          <span class="ctrl-label">推力 F = {{ pushForce.toFixed(0) }} N</span>
          <el-slider v-model="pushForce" :min="10" :max="100" :step="1" style="width:200px" @input="draw3" />
          <span class="ctrl-label" style="margin-left:12px">左质量 {{ mLeft.toFixed(0) }} kg</span>
          <el-slider v-model="mLeft" :min="10" :max="80" :step="2" style="width:150px" @input="draw3" />
          <span class="ctrl-label" style="margin-left:12px">右质量 {{ mRight.toFixed(0) }} kg</span>
          <el-slider v-model="mRight" :min="10" :max="80" :step="2" style="width:150px" @input="draw3" />
          <el-button size="small" @click="reset3">重置</el-button>
          <el-button size="small" @click="play3 ? pause3() : start3()">{{ play3 ? '⏸' : '▶' }}</el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const K = (s) => katex.renderToString(s, { displayMode: true, throwOnError: false })
const latex1 = K('\\sum F = 0 \\implies \\frac{dv}{dt} = 0')
const latex2 = K('F = m a \\quad (a = \\frac{F}{m})')
const latex3 = K('F_{12} = -F_{21}')

// ── 第一定律 ──
const c1 = ref(null); const friction = ref(0.3)
let v1 = 0, x1 = 50, play1 = false, anim1 = null
function draw1() {
  const ctx = c1.value?.getContext('2d'); if (!ctx) return
  const W = 700, H = 260, cx = 60, cy = H / 2
  ctx.clearRect(0, 0, W, H)
  // 地面
  ctx.fillStyle = '#f0f2f5'; ctx.fillRect(0, cy + 20, W, 4)
  ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.beginPath()
  ctx.moveTo(cx, 20); ctx.lineTo(cx, H - 20)
  ctx.stroke()
  // 滑块
  const bx = cx + x1, by = cy - 30
  ctx.fillStyle = '#409eff'; ctx.fillRect(bx, by, 40, 40)
  ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'
  ctx.fillText('滑块', bx + 20, by + 24)
  // 力箭头
  if (v1 > 0.1) {
    ctx.strokeStyle = '#f56c6c'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(bx + 45, by + 20); ctx.lineTo(bx + 45 + v1 * 20, by + 20)
    ctx.stroke()
    ctx.fillStyle = '#f56c6c'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText(`v=${v1.toFixed(1)}`, bx + 45 + v1 * 10, by + 14)
  }
  ctx.fillStyle = '#999'; ctx.font = '11px sans-serif'
  ctx.fillText(`摩擦力: ${friction.value.toFixed(2)}`, W - 120, 30)
}
function step1() {
  const fr = friction.value
  if (v1 > 0) {
    v1 -= fr * 0.03
    if (v1 < 0) v1 = 0
  }
  x1 += v1
  if (x1 > 500) { x1 = 500; v1 = 0 }
  draw1()
}
function start1() { play1 = true; anim1 = setInterval(step1, 30) }
function pause1() { play1 = false; clearInterval(anim1); anim1 = null }
function reset1() { pause1(); v1 = 6; x1 = 50; draw1() }

// ── 第二定律 ──
const c2 = ref(null); const force = ref(50); const mass = ref(5)
let v2 = 0, x2 = 50, anim2 = null, play2Timer = null
function draw2() {
  const ctx = c2.value?.getContext('2d'); if (!ctx) return
  const W = 700, H = 260, cx = 60, cy = H / 2
  ctx.clearRect(0, 0, W, H)
  const a = force.value / mass.value
  ctx.fillStyle = '#f0f2f5'; ctx.fillRect(0, cy + 20, W, 4)
  ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.beginPath()
  ctx.moveTo(cx, 20); ctx.lineTo(cx, H - 20); ctx.stroke()
  const bx = cx + x2, by = cy - 30
  ctx.fillStyle = '#67c23a'; ctx.fillRect(bx, by, 40, 40)
  ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'
  ctx.fillText(`m=${mass.value}kg`, bx + 20, by + 24)
  ctx.strokeStyle = '#f56c6c'; ctx.lineWidth = 3
  const arrowLen = Math.min(a * 30, 150)
  ctx.beginPath(); ctx.moveTo(bx + 45, by + 20); ctx.lineTo(bx + 45 + arrowLen, by + 20)
  ctx.stroke()
  ctx.fillStyle = '#f56c6c'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'
  ctx.fillText(`F=${force.value}N`, bx + 45 + arrowLen / 2, by + 12)
  ctx.fillStyle = '#999'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left'
  ctx.fillText(`a = ${a.toFixed(2)} m/s²`, cx + 10, 30)
  if (v2 > 0.1) {
    ctx.fillStyle = '#e6a23c'; ctx.textAlign = 'left'
    ctx.fillText(`v = ${v2.toFixed(1)}`, cx + 10, 50)
  }
}
function animStep2() {
  const a = force.value / mass.value
  v2 += a * 0.1
  x2 += v2
  if (x2 > 500) { x2 = 500; v2 = 0 }
  draw2()
}
draw2()

// ── 第三定律 ──
const c3 = ref(null); const pushForce = ref(50); const mLeft = ref(40); const mRight = ref(40)
let xL = -80, xR = 80, vL = 0, vR = 0, play3 = false, anim3 = null
function draw3() {
  const ctx = c3.value?.getContext('2d'); if (!ctx) return
  const W = 700, H = 280, cx = 350, cy = H / 2
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#f0f2f5'; ctx.fillRect(0, cy + 30, W, 4)
  const aL = pushForce.value / mLeft.value, aR = pushForce.value / mRight.value
  const bL = cx + xL - 40, bR = cx + xR, bw = 40, bh = 40
  // 左方块
  ctx.fillStyle = '#409eff'; ctx.fillRect(bL, cy - 20 - bh, bw, bh)
  ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'
  ctx.fillText(`${mLeft.value}kg`, bL + 20, cy - 8)
  // 右方块
  ctx.fillStyle = '#67c23a'; ctx.fillRect(bR, cy - 20 - bh, bw, bh)
  ctx.fillStyle = '#fff'; ctx.fillText(`${mRight.value}kg`, bR + 20, cy - 8)
  // 箭头
  ctx.strokeStyle = '#f56c6c'; ctx.lineWidth = 2; ctx.setLineDash([4, 4])
  // 左→右的力
  ctx.beginPath(); ctx.moveTo(cx - 10, cy - 25); ctx.lineTo(cx + 10, cy - 25); ctx.stroke()
  ctx.fillStyle = '#f56c6c'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'
  ctx.fillText(`F=${pushForce.value}N`, cx, cy - 38)
  ctx.setLineDash([])
  // 速度
  ctx.fillStyle = '#999'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left'
  ctx.fillText(`左: a=${aL.toFixed(1)} m/s²  v=${Math.abs(vL).toFixed(1)}`, 20, 30)
  ctx.fillText(`右: a=${aR.toFixed(1)} m/s²  v=${Math.abs(vR).toFixed(1)}`, 380, 30)
}
function step3() {
  const aL = pushForce.value / mLeft.value, aR = pushForce.value / mRight.value
  vL -= aL * 0.05; vR += aR * 0.05
  xL += vL; xR += vR
  if (xL < -300) { xL = -300; vL = 0 }
  if (xR > 300) { xR = 300; vR = 0 }
  draw3()
}
function start3() { play3 = true; anim3 = setInterval(step3, 30) }
function pause3() { play3 = false; clearInterval(anim3); anim3 = null }
function reset3() { pause3(); xL = -80; xR = 80; vL = 0; vR = 0; draw3() }

onUnmounted(() => { clearInterval(anim1); clearInterval(anim3) })
</script>

<style scoped>
.newton-page { max-width: 960px; }
.center-wrap { max-width: 900px; margin: 0 auto; width: 100%; }
.back-btn { background:none; border:none; padding:6px 14px; cursor:pointer; color:#606266; font-size:13px; margin-bottom:10px; }
.back-btn:hover { color:#409eff; }
.page-header { margin-bottom: 4px; }
.page-title { font-size:22px; font-weight:700; color:#d97706; }
.page-desc { font-size:13px; color:#606266; line-height:1.8; margin:12px 0 20px; }
.law-intro { font-size:13px; color:#606266; line-height:1.7; margin:20px 0 8px; }
.law-card { border-radius:12px; }
.formula-body { text-align:center; padding:8px 0; }
.canvas-wrap { text-align:center; margin:6px 0; }
canvas { border:1px solid #f0f2f5; border-radius:8px; max-width:100%; }
.controls { display:flex; align-items:center; gap:8px; padding:8px 0 4px; flex-wrap:wrap; justify-content:center; }
.ctrl-label { font-size:13px; color:#606266; white-space:nowrap; }
</style>
