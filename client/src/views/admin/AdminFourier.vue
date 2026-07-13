<template>
  <div class="fourier-page">
    <button class="back-btn" @click="$router.push('/admin/works')">&lt; 返回</button>
    <div class="center-wrap">
      <div class="page-header">
        <h1 class="page-title">傅里叶分析 · 交互演示</h1>
      </div>
      <div class="page-desc">
      <p>傅里叶分析是数学和工程领域中最核心的工具之一，它将信号分解为不同频率的正弦波/余弦波的叠加，揭示信号在频域中的特征。无论是音频处理、图像压缩、通信系统还是量子力学，傅里叶变换都是不可或缺的基础。</p>
      <p>本页面通过<strong>6 个交互模块</strong>，从傅里叶级数到离散傅里叶变换，以可视化 + 参数调节的方式帮助你直观理解每一个概念。</p>
    </div>

    <!-- 1. 三角形式傅里叶级数 -->
    <p class="formula-intro">周期信号可以分解为一系列正弦波和余弦波的加权和，系数 aₙ、bₙ 反映了各频率成分的幅度。拖动滑块观察谐波数 N 增加时近似波形如何趋近原始方波。</p>
    <el-card shadow="never" class="formula-card">
      <template #header><span>📐 ① 三角形式傅里叶级数</span></template>
      <div class="formula-body">
        <div class="formula-latex" v-html="latex1"></div>
        <div class="formula-latex" v-html="latex1b" style="margin-top:6px"></div>
      </div>
      <div class="canvas-wrap"><canvas ref="c1" width="700" height="300"></canvas></div>
      <div class="controls">
        <span class="ctrl-label">谐波数 N = {{ n1 }}</span>
        <el-slider v-model="n1" :min="1" :max="30" style="width:260px" @input="draw1" />
        <el-button size="small" @click="play1 = !play1; autoPlay(1)">{{ play1 ? '⏸' : '▶' }}</el-button>
        <el-button size="small" @click="n1=5; play1=false; clearInt(1); draw1()">重置</el-button>
      </div>
    </el-card>

    <!-- 2. CTFT 连续傅里叶变换（含常用变换对） -->
    <p class="formula-intro">非周期信号通过连续傅里叶变换进入频域，常用变换对（矩形脉冲 → sinc、高斯 → 高斯、冲激 → 常数）是分析线性系统的基础工具。</p>
    <el-card shadow="never" class="formula-card" style="margin-top:18px">
      <template #header><span>📈 ② 连续傅里叶变换 · 常用变换对</span></template>
      <div class="formula-body">
        <div class="formula-latex" v-html="latex2"></div>
        <div class="formula-latex" v-html="latex2b" style="margin-top:4px"></div>
      </div>
      <div class="controls" style="justify-content:center;gap:16px">
        <el-select v-model="sigType" style="width:150px" @change="draw2">
          <el-option label="矩形脉冲" value="rect" />
          <el-option label="高斯脉冲" value="gauss" />
          <el-option label="单位冲激" value="delta" />
        </el-select>
        <span class="ctrl-label" v-if="sigType!=='delta'">{{ sigType==='rect' ? '宽度 τ' : '衰减 a' }} = {{ p2.toFixed(1) }}</span>
        <el-slider v-if="sigType!=='delta'" v-model="p2" :min="0.5" :max="4" :step="0.1" style="width:200px" @input="draw2" />
      </div>
      <div class="canvas-row">
        <div class="canvas-col"><div class="canvas-label">时域 x(t)</div><canvas ref="c2t" width="340" height="260"></canvas></div>
        <div class="canvas-col"><div class="canvas-label">频谱 |X(jω)|</div><canvas ref="c2f" width="340" height="260"></canvas></div>
      </div>
      <div class="formula-body" style="padding-top:0">
        <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:16px">
          <div class="formula-latex" v-html="latex2rect"></div>
          <div class="formula-latex" v-html="latex2gauss"></div>
          <div class="formula-latex" v-html="latex2imp"></div>
        </div>
      </div>
    </el-card>

    <!-- 3. 幅度谱 · 相位谱 · 帕塞瓦尔 -->
    <p class="formula-intro">频谱包含幅度和相位两部分信息：幅度谱表示各频率成分的强弱，相位谱表示各成分的时间偏移。帕塞瓦尔定理揭示了时域能量与频域能量的等价关系。</p>
    <el-card shadow="never" class="formula-card" style="margin-top:18px">
      <template #header><span>📊 ③ 幅度谱 · 相位谱 · 能量守恒</span></template>
      <div class="formula-body">
        <div class="formula-latex" v-html="latex3mag"></div>
        <div class="formula-latex" v-html="latex3phase"></div>
        <div class="formula-latex" v-html="latex3parseval" style="margin-top:6px"></div>
      </div>
      <div class="canvas-row">
        <div class="canvas-col"><div class="canvas-label">幅度谱 |X(jω)|</div><canvas ref="c3mag" width="280" height="320"></canvas></div>
        <div class="canvas-col"><div class="canvas-label">相位谱 ∠X(jω)</div><canvas ref="c3phase" width="280" height="320"></canvas></div>
        <div class="canvas-col"><div class="canvas-label">能量谱 |X(jω)|²</div><canvas ref="c3en" width="280" height="320"></canvas></div>
      </div>
      <div class="controls"><span class="ctrl-label">信号：矩形脉冲 τ = {{ p3.toFixed(1) }}</span><el-slider v-model="p3" :min="0.5" :max="4" :step="0.1" style="width:260px" @input="draw3" /></div>
    </el-card>

    <!-- 4. DTFT · DFT -->
    <p class="formula-intro">实际计算中信号是离散的采样点。DTFT 给出连续频谱，DFT 给出离散频谱（频域采样），FFT 算法将计算复杂度从 O(N²) 降低到 O(N log N)。</p>
    <el-card shadow="never" class="formula-card" style="margin-top:18px">
      <template #header><span>🔢 ④ 离散傅里叶变换（DTFT / DFT）</span></template>
      <div class="formula-body">
        <div class="formula-latex" v-html="latex4dtft"></div>
        <div class="formula-latex" v-html="latex4dft" style="margin-top:6px"></div>
        <div class="formula-latex" v-html="latex4rel" style="margin-top:6px"></div>
      </div>
      <div class="canvas-row">
        <div class="canvas-col"><div class="canvas-label">离散信号 x[n]</div><canvas ref="c4sig" width="340" height="200"></canvas></div>
        <div class="canvas-col"><div class="canvas-label">DFT 幅度 |X[k]|</div><canvas ref="c4dft" width="340" height="200"></canvas></div>
      </div>
      <div class="controls">
        <span class="ctrl-label">N = {{ n4 }}</span>
        <el-slider v-model="n4" :min="8" :max="64" :step="4" style="width:200px" @input="draw4" />
        <el-select v-model="sig4" style="width:130px" @change="draw4"><el-option label="正弦" value="sin" /><el-option label="方波" value="sq" /></el-select>
      </div>
    </el-card>

    <!-- 5. 复指数级数 · 本轮（Epicycle） -->
    <p class="formula-intro">傅里叶级数的复指数形式可以直观地理解为多个旋转向量的首尾叠加——这就是"本轮"（Epicycle）的可视化。每个向量代表一个频率成分，旋转速度和方向由 k 决定。</p>
    <el-card shadow="never" class="formula-card" style="margin-top:18px">
      <template #header><span>🌀 ⑤ 复指数级数 · 旋转向量合成</span></template>
      <div class="formula-body">
        <div class="formula-latex" v-html="latex5"></div>
        <div class="formula-latex" v-html="latex5coeff" style="margin-top:4px"></div>
      </div>
      <div class="canvas-wrap"><canvas ref="c5" width="700" height="360"></canvas></div>
      <div class="controls">
        <span class="ctrl-label">N = {{ n5 }}</span>
        <el-slider v-model="n5" :min="1" :max="20" style="width:260px" @input="draw5" />
        <el-button size="small" @click="play5 = !play5; autoPlay(5)">{{ play5 ? '⏸' : '▶' }}</el-button>
        <el-button size="small" @click="n5=5; play5=false; clearInt(5); draw5()">重置</el-button>
      </div>
    </el-card>

    <!-- 6. 统一框架 -->
    <p class="formula-intro">四种傅里叶变换构成了一个完整的分析框架，区别在于时域和频域分别是连续/离散、周期/非周期。对偶性告诉我们：时域采样 ↔ 频域周期化，时域周期化 ↔ 频域采样。</p>
    <el-card shadow="never" class="formula-card" style="margin-top:18px">
      <template #header><span>📋 ⑥ 傅里叶变换统一框架</span></template>
      <div class="formula-body">
        <div class="formula-latex" v-html="latex6fs"></div>
        <div class="formula-latex" v-html="latex6ctft"></div>
        <div class="formula-latex" v-html="latex6dtft"></div>
        <div class="formula-latex" v-html="latex6dft"></div>
      </div>
      <div class="unified-table-wrap">
        <table class="unified-table">
          <thead><tr><th>变换</th><th>时域</th><th>频域</th></tr></thead>
          <tbody>
            <tr><td>FS</td><td>连续 · 周期</td><td>离散 · 非周期</td></tr>
            <tr><td>CTFT</td><td>连续 · 非周期</td><td>连续 · 非周期</td></tr>
            <tr><td>DTFT</td><td>离散 · 非周期</td><td>连续 · 周期</td></tr>
            <tr><td>DFT</td><td>离散 · 周期</td><td>离散 · 周期</td></tr>
          </tbody>
        </table>
      </div>
    </el-card>
    </div><!-- /center-wrap -->
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const K = (s) => katex.renderToString(s, { displayMode: true, throwOnError: false })

// ── 全部 LaTeX ──
const latex1   = K('x(t) = \\frac{a_0}{2} + \\sum_{n=1}^{\\infty} \\left[ a_n \\cos(n\\omega_0 t) + b_n \\sin(n\\omega_0 t) \\right]')
const latex1b  = K('a_n = \\frac{2}{T} \\int_{0}^{T} x(t) \\cos(n\\omega_0 t) \\, dt,\\; b_n = \\frac{2}{T} \\int_{0}^{T} x(t) \\sin(n\\omega_0 t) \\, dt')
const latex2   = K('X(j\\omega) = \\int_{-\\infty}^{\\infty} x(t) e^{-j\\omega t} \\, dt')
const latex2b  = K('x(t) = \\frac{1}{2\\pi} \\int_{-\\infty}^{\\infty} X(j\\omega) e^{j\\omega t} \\, d\\omega')
const latex2rect  = K('\\operatorname{rect}(\\frac{t}{\\tau}) \\; \\xrightarrow{\\mathcal{F}} \\; \\tau \\operatorname{sinc}(\\frac{\\omega\\tau}{2})')
const latex2gauss = K('e^{-a t^2} \\; \\xrightarrow{\\mathcal{F}} \\; \\sqrt{\\frac{\\pi}{a}} e^{-\\omega^2/(4a)}')
const latex2imp   = K('\\delta(t) \\; \\xrightarrow{\\mathcal{F}} \\; 1')
const latex3mag   = K('|X(j\\omega)| = \\sqrt{\\operatorname{Re}^2 + \\operatorname{Im}^2}')
const latex3phase = K('\\angle X(j\\omega) = \\arctan\\!(\\operatorname{Im}/\\operatorname{Re})')
const latex3parseval = K('\\int_{-\\infty}^{\\infty} |x(t)|^2 dt = \\frac{1}{2\\pi} \\int_{-\\infty}^{\\infty} |X(j\\omega)|^2 d\\omega')
const latex4dtft = K('X(e^{j\\omega}) = \\sum_{n=-\\infty}^{\\infty} x[n] e^{-j\\omega n}')
const latex4dft  = K('X[k] = \\sum_{n=0}^{N-1} x[n] e^{-j\\frac{2\\pi}{N} nk},\\; k = 0,\\dots,N-1')
const latex4rel  = K('X[k] = X(e^{j\\omega})\\big|_{\\omega = 2\\pi k / N}')
const latex5     = K('P_N(t) = \\sum_{k=-N}^{N} c_k e^{ik\\omega_0 t}')
const latex5coeff = K('c_k = \\frac{1}{M} \\sum_{m=0}^{M-1} p_m e^{-ik\\frac{2\\pi}{M}m}')
const latex6fs   = K('\\text{FS}:\\; X_n = \\frac{1}{T}\\int_0^T x(t) e^{-jn\\omega_0 t} dt')
const latex6ctft = K('\\text{CTFT}:\\; X(j\\omega) = \\int_{-\\infty}^{\\infty} x(t) e^{-j\\omega t} dt')
const latex6dtft = K('\\text{DTFT}:\\; X(e^{j\\omega}) = \\sum_{-\\infty}^{\\infty} x[n] e^{-j\\omega n}')
const latex6dft  = K('\\text{DFT}:\\; X[k] = \\sum_{n=0}^{N-1} x[n] e^{-j\\frac{2\\pi}{N} nk}')

// ── 工具 ──
const timers = {}
function clearInt(id) { clearInterval(timers[id]); timers[id] = null }
function autoPlay(id) { if (timers[id]) { clearInt(id); return }; timers[id] = setInterval(() => { if (window['play'+id]) window['inc'+id]?.() }, 300) }

// ── 1. 三角级数 ──
const c1 = ref(null); const n1 = ref(5); const play1 = ref(false)
window.inc1 = () => { n1.value = n1.value >= 30 ? 1 : n1.value + 1; draw1() }
window.play1 = play1
function draw1() {
  const ctx = c1.value?.getContext('2d'); if (!ctx) return
  const W=ctx.canvas.width, H=ctx.canvas.height, cx=80, cy=H*0.65, T=200, amp=55, N=n1.value
  ctx.clearRect(0,0,W,H)
  // 坐标轴
  ctx.strokeStyle='#ddd'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(cx,10); ctx.lineTo(cx,H-10); ctx.moveTo(10,cy); ctx.lineTo(W-10,cy); ctx.stroke()
  // 原始方波
  ctx.strokeStyle='#ccc'; ctx.lineWidth=1; ctx.setLineDash([4,4]); ctx.beginPath()
  for(let px=0;px<=4*T;px++){ const v=(px%T)/T<0.5?-amp:amp; px?ctx.lineTo(cx+px,cy+v):ctx.moveTo(cx+px,cy+v) }
  ctx.stroke(); ctx.setLineDash([])
  // 傅里叶近似
  ctx.strokeStyle='#409eff'; ctx.lineWidth=2; ctx.beginPath()
  for(let px=0;px<=4*T;px++){ const t=px/T*2*Math.PI; let s=0; for(let n=1;n<=N;n++)s+=Math.sin((2*n-1)*t)/(2*n-1); const v=4/Math.PI*s*amp*.7; px?ctx.lineTo(cx+px,cy-v):ctx.moveTo(cx+px,cy-v) }
  ctx.stroke()
}
// ── 2. CTFT 常用对 ──
const c2t=ref(null),c2f=ref(null),sigType=ref('rect'),p2=ref(2)
function draw2(){
  const tau=p2.value,a=p2.value
  // 时域
  const t1=c2t.value?.getContext('2d'); if(!t1)return
  const W=t1.canvas.width, H=t1.canvas.height, cx=60, cy=H*0.65; t1.clearRect(0,0,W,H)
  t1.strokeStyle='#ddd'; t1.beginPath(); t1.moveTo(cx,10); t1.lineTo(cx,H-10); t1.moveTo(10,cy); t1.lineTo(W-10,cy); t1.stroke()
  t1.strokeStyle='#409eff'; t1.lineWidth=2; t1.beginPath()
  for(let px=0;px<=W-20;px++){ const t=(px-cx)/40; let v=0
    if(sigType.value==='rect') v=Math.abs(t)<=tau/2?1:0
    else if(sigType.value==='gauss') v=Math.exp(-a*t*t)
    else v=0; const y=cy-v*60; px?t1.lineTo(px,y):t1.moveTo(px,y) }
  t1.stroke()
  // 频域
  const f1=c2f.value?.getContext('2d'); if(!f1)return
  const W2=f1.canvas.width, H2=f1.canvas.height, cy2=H2*0.65; f1.clearRect(0,0,W2,H2)
  f1.strokeStyle='#ddd'; f1.beginPath(); f1.moveTo(cx,10); f1.lineTo(cx,H2-10); f1.moveTo(10,cy2); f1.lineTo(W2-10,cy2); f1.stroke()
  f1.strokeStyle='#409eff'; f1.lineWidth=2; f1.beginPath()
  for(let px=0;px<=W2-20;px++){ const w=(px-cx)/40; let v=0
    if(sigType.value==='rect'){ const a=w*tau/2; v=Math.abs(a)<.001?tau:tau*Math.sin(a)/a }
    else if(sigType.value==='gauss') v=Math.sqrt(Math.PI/a)*Math.exp(-w*w/(4*a))
    else v=1; const y=cy2-Math.abs(v)*40; px?f1.lineTo(px,y):f1.moveTo(px,y) }
  f1.stroke()
}
// ── 3. 幅度/相位/能量 ──
const c3mag=ref(null),c3phase=ref(null),c3en=ref(null),p3=ref(2)
function draw3(){
  const tau=p3.value
  ;[c3mag,c3phase,c3en].forEach((ref,idx)=>{ const ctx=ref.value?.getContext('2d'); if(!ctx)return
    const W=ctx.canvas.width, H=ctx.canvas.height, cx=60, cy=H*0.65; ctx.clearRect(0,0,W,H)
    ctx.strokeStyle='#ddd'; ctx.beginPath(); ctx.moveTo(cx,10); ctx.lineTo(cx,H-10); ctx.moveTo(10,cy); ctx.lineTo(W-10,cy); ctx.stroke()
    ctx.strokeStyle='#409eff'; ctx.lineWidth=2; ctx.beginPath()
    for(let px=0;px<=W-20;px++){ const w=(px-cx)/40, a=w*tau/2
      const sinc=Math.abs(a)<.001?1:Math.sin(a)/a, mag=Math.abs(tau*sinc), phase=sinc>=0?0:Math.PI, en=mag*mag
      const val=[mag,phase,en][idx]; const y=cy-val*[40,1.5,13][idx]; px?ctx.lineTo(px,y):ctx.moveTo(px,y) }
    ctx.stroke() })
}
// ── 4. DTFT/DFT ──
const c4sig=ref(null),c4dft=ref(null),n4=ref(32),sig4=ref('sin')
function draw4(){
  const N=n4.value
  // 离散信号
  const s1=c4sig.value?.getContext('2d'); if(!s1)return
  const W=340,H=170,cx=40,cy=H/2; s1.clearRect(0,0,W,H)
  s1.strokeStyle='#ddd'; s1.beginPath(); s1.moveTo(cx,10); s1.lineTo(cx,H-10); s1.moveTo(10,cy); s1.lineTo(W-10,cy); s1.stroke()
  const xs=[]; for(let n=0;n<N;n++){ const v=sig4.value==='sin'?Math.sin(4*n/N*2*Math.PI):(n%(N/4)<N/8?1:-1); xs.push(v) }
  const step=Math.min(8,Math.floor((W-60)/N)); s1.strokeStyle='#409eff'; s1.lineWidth=1.5; s1.beginPath()
  xs.forEach((v,i)=>{ const x=cx+i*step,y=cy-v*50; s1.moveTo(x,cy); s1.lineTo(x,y) }); s1.stroke()
  // DFT
  const d1=c4dft.value?.getContext('2d'); if(!d1)return
  d1.clearRect(0,0,W,H); d1.strokeStyle='#ddd'; d1.beginPath(); d1.moveTo(cx,10); d1.lineTo(cx,H-10); d1.moveTo(10,cy); d1.lineTo(W-10,cy); d1.stroke()
  const dft=[]; for(let k=0;k<N;k++){ let re=0,im=0; for(let n=0;n<N;n++){ const a=-2*Math.PI*n*k/N; re+=xs[n]*Math.cos(a); im+=xs[n]*Math.sin(a) }; dft.push(Math.sqrt(re*re+im*im)) }
  const max=Math.max(...dft,1); d1.fillStyle='#409eff'
  dft.forEach((v,i)=>{ const x=cx+i*step,h=v/max*70; d1.fillRect(x,cy-h,Math.max(step-1,2),h) })
}
// ── 5. 复指数级数 / Epicycle ──
const c5=ref(null),n5=ref(5),play5=ref(false),epiPhase=ref(0)
window.inc5 = () => { epiPhase.value += 0.08; draw5() }
window.play5 = play5
function draw5(){
  const ctx=c5.value?.getContext('2d'); if(!ctx)return
  const W=700,H=360,cx=350,cy=180,r0=60,N=n5.value
  ctx.clearRect(0,0,W,H)
  // 计算傅里叶系数（矩形波的采样点）
  const M=200; const pts=[]; for(let m=0;m<M;m++){ const t=m/M*2*Math.PI; pts.push(Math.sin(t)>0?1:-1) }
  const coef=[]; for(let k=-N;k<=N;k++){ let re=0,im=0; for(let m=0;m<M;m++){ const a=-k*2*Math.PI*m/M; re+=pts[m]*Math.cos(a); im+=pts[m]*Math.sin(a) }; coef.push({k,re:re/M,im:im/M}) }
  // 绘制本轮
  const t=epiPhase.value; let px=cx,py=cy; ctx.strokeStyle='rgba(64,158,255,0.3)'; ctx.lineWidth=1
  coef.forEach(c=>{ const r=Math.sqrt(c.re*c.re+c.im*c.im)*r0, a=c.k*t+Math.atan2(c.im,c.re); const nx=px+r*Math.cos(a), ny=py+r*Math.sin(a)
    ctx.beginPath(); ctx.arc(px,py,r,0,2*Math.PI); ctx.stroke()
    ctx.strokeStyle='#409eff'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(nx,ny); ctx.stroke()
    px=nx; py=ny })
  // 终点圆
  ctx.fillStyle='#f56c6c'; ctx.beginPath(); ctx.arc(px,py,4,0,2*Math.PI); ctx.fill()
}
// ── 生命周期 ──
onMounted(()=>{ draw1();draw2();draw3();draw4();draw5() })
onUnmounted(()=>{ Object.keys(timers).forEach(k=>clearInt(k)) })
</script>

<style scoped>
.fourier-page { width: 100%; }
.center-wrap { max-width: 960px; margin: 0 auto; }
.page-header { margin-bottom: 4px; }
.back-btn { background:none; border:none; border-radius:6px; padding:6px 14px; cursor:pointer; color:#606266; font-size:13px; margin-bottom:10px; }
.back-btn:hover { border-color:#409eff; color:#409eff; }
.page-title { font-size:22px; font-weight:700; margin:0; color:#d97706; }
.page-desc { font-size:13px; color:#606266; line-height:1.8; margin:12px 0 20px; padding:0 2px; }
.page-desc strong { color:#303133; }
.formula-intro { font-size:13px; color:#606266; line-height:1.7; margin:50px 0 8px; padding:0 2px; }
.formula-card { border-radius:12px; width:100%; }
.formula-body { padding:10px 0; text-align:center; }
.formula-latex { overflow-x:auto; padding:3px 0; }
:deep(.katex) { font-size:1.05em; }
.canvas-wrap { text-align:center; margin:6px 0; }
canvas { border:1px solid #f0f2f5; border-radius:8px; max-width:100%; }
.canvas-row { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin:6px 0; }
.canvas-col { text-align:center; }
.canvas-label { font-size:12px; color:#909399; margin-bottom:4px; }
.controls { display:flex; align-items:center; gap:10px; padding:8px 0 4px; flex-wrap:wrap; justify-content:center; }
.ctrl-label { font-size:13px; color:#606266; white-space:nowrap; }

/* 统一框架表格 */
.unified-table-wrap { display:flex; justify-content:center; padding:8px 0; }
.unified-table { border-collapse:collapse; font-size:14px; }
.unified-table th,.unified-table td { border:1px solid #e4e7ed; padding:8px 20px; text-align:center; }
.unified-table th { background:#f5f7fa; color:#606266; font-weight:600; }
.unified-table td { color:#303133; }
</style>
