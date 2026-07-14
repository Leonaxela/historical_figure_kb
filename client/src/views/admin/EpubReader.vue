<template>
  <div class="reader-page">
    <div class="reader-toolbar">
      <button class="toolbar-btn" @click="showToc = !showToc">{{ showToc ? '✕ 关闭' : '📑 目录' }}</button>
      <span class="toolbar-title">{{ title }}</span>
      <div class="toolbar-right">
        <button class="toolbar-btn" @click="prevPage" :disabled="!rendition">◀ 上一页</button>
        <span class="page-info" v-if="progress">{{ progress }}</span>
        <button class="toolbar-btn" @click="nextPage" :disabled="!rendition">下一页 ▶</button>
        <button class="toolbar-btn" @click="goBack">← 返回书架</button>
      </div>
    </div>
    <div class="reader-body">
      <div class="toc-sidebar" v-if="showToc && toc.length">
        <div class="sidebar-header">📖 目录</div>
        <div class="sidebar-list">
          <div v-for="item in toc" :key="item.id || item.href"
            class="sidebar-item" :class="{ 'sub': item.parent }"
            @click="gotoChapter(item.href)">{{ item.label }}</div>
        </div>
      </div>
      <div class="reader-view" ref="viewRef"></div>
    </div>
    <div class="reader-loading" v-if="loading">
      <div class="loading-spinner"></div>
      <p>{{ loadMsg }}</p>
    </div>
    <div class="reader-error" v-if="error">
      <p>❌ {{ error }}</p>
      <button class="toolbar-btn" @click="goBack">← 返回书架</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Book } from 'epubjs'

const route = useRoute()
const router = useRouter()
const viewRef = ref(null)
const title = ref('')
const progress = ref('')
const loading = ref(true)
const loadMsg = ref('正在加载书籍...')
const error = ref('')
const showToc = ref(true)
const toc = ref([])

let rendition = null
let book = null

function goBack() {
  cleanup()
  router.push('/admin/works')
}

function prevPage() {
  if (rendition) rendition.prev()
}

function nextPage() {
  if (rendition) rendition.next()
}

function gotoChapter(href) {
  if (rendition) rendition.display(href)
}

function flattenToc(items, parent) {
  const result = []
  for (const item of items) {
    result.push({ ...item, parent: !!parent })
    if (item.subitems?.length) result.push(...flattenToc(item.subitems, true))
  }
  return result
}

function cleanup() {
  document.removeEventListener('keydown', onKeyDown)
  try { if (rendition) rendition.destroy() } catch {}
  try { if (book) book.destroy() } catch {}
  rendition = null; book = null
}

onMounted(async () => {
  const filename = route.params.filename
  const url = '/api/ebooks/file?name=' + encodeURIComponent(filename)

  await nextTick()

  try {
    loadMsg.value = '正在下载书籍...'
    const resp = await fetch(url)
    if (!resp.ok) throw new Error('服务器返回 ' + resp.status)
    const header = await resp.clone().arrayBuffer()
    const magic = new Uint8Array(header, 0, 2)
    if (magic[0] !== 0x50 || magic[1] !== 0x4b) throw new Error('文件格式不正确')

    loadMsg.value = '正在解析书籍...'
    book = new Book()
    book.open(url)
    await book.ready

    try { await book.locations.generate() } catch {}

    try {
      const nav = book.navigation
      if (nav?.toc) toc.value = flattenToc(nav.toc)
    } catch {}

    try {
      const m = await book.loaded.metadata
      title.value = m.title || filename
    } catch { title.value = filename }

    await nextTick()
    await new Promise(r => setTimeout(r, 100))

    rendition = book.renderTo(viewRef.value, {
      width: '100%', height: '100%', spread: 'none',
      flow: 'scrolled-doc', manager: 'continuous',
    })

    rendition.themes.register('default', {
      body: {
        'font-family': '"PingFang SC","Microsoft YaHei",serif !important',
        'font-size': '18px !important', 'line-height': '1.9 !important',
        'color': '#3a3a3a !important', 'background': '#faf8f5 !important',
        'padding': '30px 18% 30px 12% !important',
        'max-width': 'none !important', 'margin': '0 !important',
      },
      p: { 'text-indent': '2em', 'margin': '0.5em 0' },
    })
    rendition.themes.select('default')

    loadMsg.value = '正在渲染...'
    await rendition.display()
    loading.value = false

    function updateBodyPad(open) {
      if (!rendition) return
      const leftPad = open ? '12%' : '22%'
      rendition.themes.register('default', {
        body: {
          'font-family': '"PingFang SC","Microsoft YaHei",serif !important',
          'font-size': '18px !important', 'line-height': '1.9 !important',
          'color': '#3a3a3a !important', 'background': '#faf8f5 !important',
          'padding': '30px 18% 30px ' + leftPad + ' !important',
          'max-width': 'none !important', 'margin': '0 !important',
        },
        p: { 'text-indent': '2em', 'margin': '0.5em 0' },
      })
      rendition.themes.select('default')
    }

    watch(showToc, (val) => { updateBodyPad(val) }, { immediate: true })

    rendition.on('relocated', (loc) => {
      if (loc?.start) {
        const p = ((loc.start.percentage || 0) * 100).toFixed(0)
        progress.value = p + '%'
      }
    })

    document.addEventListener('keydown', onKeyDown)

  } catch (e) {
    error.value = '加载失败：' + (e.message || '未知错误')
    loading.value = false
  }
})

function onKeyDown(e) {
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') prevPage()
  if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); nextPage() }
}

onUnmounted(() => { cleanup() })
</script>

<style scoped>
.reader-page {
  position: fixed; inset: 0; z-index: 99999;
  background: #faf8f5; display: flex; flex-direction: column;
}
.reader-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 16px; background: #fff;
  border-bottom: 1px solid #e4e7ed; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  z-index: 10; flex-shrink: 0;
}
.toolbar-title {
  font-size: 16px; font-weight: 600; color: #303133;
  max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.toolbar-right { display: flex; align-items: center; gap: 8px; }
.toolbar-btn {
  padding: 6px 14px; border-radius: 6px; border: 1px solid #dcdfe6;
  background: #fff; color: #606266; font-size: 13px; cursor: pointer;
  transition: all 0.15s; white-space: nowrap;
}
.toolbar-btn:hover:not(:disabled) { border-color: #409eff; color: #409eff; }
.toolbar-btn:active:not(:disabled) { transform: scale(0.96); }
.toolbar-btn:disabled { opacity: 0.4; cursor: default; }
.page-info { font-size: 13px; color: #909399; min-width: 40px; text-align: center; }

.reader-body { flex: 1; display: flex; overflow: hidden; position: relative; }

.toc-sidebar {
  width: 220px; flex-shrink: 0; overflow-y: auto;
  background: #fff; padding: 10px 0;
  border-right: 1px solid #e4e7ed;
}
.sidebar-header {
  font-size: 14px; font-weight: 600; color: #303133;
  padding: 8px 16px 12px; border-bottom: 1px solid #f0f0f0;
}
.sidebar-list { padding: 4px 0; }
.sidebar-item {
  padding: 7px 16px; font-size: 13px; color: #606266;
  cursor: pointer; line-height: 1.4; transition: all 0.1s;
  border-left: 3px solid transparent; overflow: hidden;
  text-overflow: ellipsis; white-space: nowrap;
}
.sidebar-item:hover { background: #f5f7fa; color: #409eff; }
.sidebar-item.sub { padding-left: 28px; font-size: 12px; color: #909399; }

.reader-view { flex: 1; overflow-y: auto; position: relative; }

.reader-loading {
  position: fixed; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; background: #faf8f5;
  z-index: 5; color: #909399; font-size: 14px; gap: 12px;
}
.reader-error {
  position: fixed; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; background: #faf8f5;
  z-index: 5; color: #f56c6c; font-size: 15px; gap: 16px;
}
.loading-spinner {
  width: 32px; height: 32px; border: 3px solid #e4e7ed;
  border-top-color: #409eff; border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
