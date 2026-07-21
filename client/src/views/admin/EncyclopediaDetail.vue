<template>
  <div class="encyclopedia-detail">
    <div class="container">
      <!-- 返回 -->
      <a class="back-link" @click="$router.push('/admin/encyclopedia')">← 返回百科</a>

      <!-- 英雄区 -->
      <div class="hero" v-if="c.id">
        <div class="hero-portrait">
          <img v-if="c.image_url" :src="'/img/' + c.image_url" />
          <span v-else>{{ initial }}</span>
        </div>
        <div class="hero-text">
          <h1 class="hero-name">{{ c.chinese_name || c.name }}</h1>
          <div class="hero-dates" v-if="c.birth_date">{{ c.birth_date }} ~ {{ c.death_date || '至今' }}</div>
          <div class="hero-quote" v-if="c.biography">“{{ c.biography }}”</div>
          <div class="tag-list">
            <span class="tag" v-for="occ in occupations" :key="occ">{{ occ }}</span>
          </div>
          <div class="quick-facts">
            <div class="fact-item" v-if="c.nationality"><strong>籍贯</strong>{{ displayNation(c.nationality) }}</div>
            <div class="fact-item" v-if="c.birth_date"><strong>生卒</strong>{{ c.birth_date }}~{{ c.death_date || '至今' }}</div>
            <div class="fact-item"><strong>身份</strong>{{ occupations[0] || '未知' }}</div>
          </div>
        </div>
      </div>

      <!-- 粘性导航 -->
      <div class="sticky-nav">
        <a v-for="s in sections" :key="s.id" :href="'#' + s.id"
          :class="{ active: activeSection === s.id }">{{ s.label }}</a>
      </div>

      <!-- 生平 -->
      <section id="bio">
        <h2 class="section-title">📜生平</h2>
        <div class="bio-text md" v-html="renderMd(contents.biography || c.biography || '暂无内容')"></div>
      </section>

      <!-- 成就/著作 -->
      <section id="works" v-if="contents.works">
        <h2 class="section-title">🏆成就/📖著作</h2>
        <div class="bio-text md" v-html="renderMd(contents.works)"></div>
      </section>

      <!-- 影响 -->
      <section id="influence" v-if="contents.influence">
        <h2 class="section-title">💡影响</h2>
        <div class="bio-text md" v-html="renderMd(contents.influence)"></div>
      </section>

      <!-- 轶事 -->
      <section id="anecdotes" v-if="contents.anecdotes">
        <h2 class="section-title">🎭轶事</h2>
        <div class="bio-text md" v-html="renderMd(contents.anecdotes)"></div>
      </section>

      <!-- 关系 -->
      <section id="relations" v-if="relations.length">
        <h2 class="section-title">🤝关系</h2>
        <div class="relation-map">
          <div v-for="r in relations" :key="r.id" class="person-node">
            <div class="person-avatar">
              <img v-if="r.otherImage" :src="'/img/' + r.otherImage" />
              <span v-else>{{ (r.otherName || '?').charAt(0) }}</span>
            </div>
            <div class="person-name">{{ r.otherName }}</div>
            <div class="person-relation">{{ r.type_name }}</div>
          </div>
        </div>
      </section>

      <!-- 年表 -->
      <section id="timeline" v-if="timeline.length">
        <h2 class="section-title">⏳年表</h2>
        <table class="year-table">
          <thead><tr><th>时间</th><th>事件</th></tr></thead>
          <tbody>
          <tr v-for="ev in timeline" :key="ev.id">
            <td class="year">{{ ev.event_date }}</td>
            <td>{{ ev.title }}{{ ev.description ? '：' + ev.description : '' }}</td>
          </tr>
          </tbody>
        </table>
      </section>

      <footer>— 古今人物 · 名人百科 —</footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { celebrityApi, contentApi } from '../../api/index.js'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({ html: true, linkify: true })
function renderMd(t) { return t ? md.render(t) : '' }

const route = useRoute()
const router = useRouter()
const c = ref({})
const contents = ref({})
const timeline = ref([])
const activeSection = ref('bio')

const sections = [
  { id: 'bio', label: '📜生平' },
  { id: 'works', label: '🏆成就/📖著作' },
  { id: 'influence', label: '💡影响' },
  { id: 'anecdotes', label: '🎭轶事' },
  { id: 'relations', label: '🤝关系' },
  { id: 'timeline', label: '⏳年表' },
]

const initial = computed(() => ((c.value.chinese_name || c.value.name || '?').charAt(0)))

const occupations = computed(() => (c.value.occupation || '').split('、').filter(Boolean))

const relations = computed(() => {
  const raw = c.value.relations || []
  const result = []
  const seen = new Set()
  for (const r of raw) {
    const isSource = Number(r.source_id) === c.value.id
    const key = Math.min(r.source_id, r.target_id) + '-' + Math.max(r.source_id, r.target_id) + '-' + r.type_id
    if (seen.has(key)) continue
    seen.add(key)
    result.push({
      ...r,
      otherName: isSource ? (r.target_chinese_name || r.target_name) : (r.source_chinese_name || r.source_name),
      otherImage: isSource ? r.target_image_url : r.source_image_url,
    })
  }
  // 家庭关系排最前，其余按入库时间
  result.sort((a, b) => {
    if (a.type_category === '家庭' && b.type_category !== '家庭') return -1
    if (a.type_category !== '家庭' && b.type_category === '家庭') return 1
    return b.id - a.id
  })
  return result
})

function displayNation(n) { return (n || '').replace('中国_', '') }

// 滚动监听高亮导航
function onScroll() {
  let current = 'bio'
  for (const s of sections) {
    const el = document.getElementById(s.id)
    if (el && el.getBoundingClientRect().top < 200) current = s.id
  }
  activeSection.value = current
}

onMounted(async () => {
  const id = route.params.id
  const [cr, ctr] = await Promise.all([
    celebrityApi.get(id),
    contentApi.get(id),
  ])
  if (cr.success) c.value = cr.data || {}
  if (ctr.success) contents.value = ctr.data || {}

  // 时间线
  const tl = await contentApi.timeline(id)
  const raw = tl.data || []
  raw.sort((a, b) => {
    const toY = s => { const m = (s||'').match(/(\d+)/); return m ? parseInt(m[1]) : 0 }
    return (toY(a.event_date) - toY(b.event_date)) || (a.sort_order || 0) - (b.sort_order || 0)
  })
  timeline.value = raw

  window.addEventListener('scroll', onScroll)
  // 实际滚动容器是 .admin-content
  const scrollEl = document.querySelector('.admin-content')
  if (scrollEl) scrollEl.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  const scrollEl = document.querySelector('.admin-content')
  if (scrollEl) scrollEl.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
.encyclopedia-detail {
  background-color: #f9f6f0;
  color: #2c2c2c;
  font-family: "Noto Serif SC", "华文宋体", "Songti SC", "宋体", Georgia, serif;
  line-height: 1.8;
  min-height: 100%;
  margin: -24px -28px;
  padding: 0 28px 28px;
}
.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 24px;
}

.back-link {
  display: inline-block;
  margin: 20px 0 0;
  color: #7a6e5d;
  cursor: pointer;
  text-decoration: none;
  font-size: 1rem;
  letter-spacing: 1px;
  transition: color 0.2s;
}
.back-link:hover { color: #b5443c; }

/* 英雄区 */
.hero {
  display: flex;
  align-items: center;
  gap: 56px;
  flex-wrap: wrap;
  justify-content: center;
  margin: 40px 0;
}
.hero-portrait {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: #e6d7b8;
  box-shadow: 0 12px 28px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 5rem;
  color: #8b7b62;
  border: 3px solid #cfb991;
  overflow: hidden;
  flex-shrink: 0;
}
.hero-portrait img { width: 100%; height: 100%; object-fit: cover; }
.hero-text { flex: 1; min-width: 260px; }
.hero-name {
  font-family: "ZCOOL XiaoWei", "华文楷体", "KaiTi", "楷体", serif;
  font-size: 3.5rem;
  font-weight: 400;
  color: #2b2b2b;
  line-height: 1.2;
}
.hero-dates {
  font-size: 1.3rem;
  color: #7a6e5d;
  margin: 8px 0 16px;
  letter-spacing: 2px;
}
.hero-quote {
  font-style: italic;
  font-size: 1.2rem;
  color: #b5443c;
  border-left: 4px solid #b5443c;
  padding-left: 20px;
  margin: 18px 0;
}
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 18px 0;
}
.tag {
  background: #f0e7d8;
  border: 1px solid #cbb386;
  padding: 6px 18px;
  border-radius: 50px;
  font-size: 0.95rem;
  color: #5c4b32;
  letter-spacing: 1px;
  cursor: pointer;
  transition: 0.2s;
}
.tag:hover { background: #b5443c; color: #fff; border-color: #b5443c; }
.quick-facts {
  display: flex;
  gap: 40px;
  color: #5f5343;
  margin-top: 24px;
  flex-wrap: wrap;
}
.fact-item strong {
  display: block;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #9b8b74;
}

/* 粘性导航 */
.sticky-nav {
  position: sticky;
  top: -24px;
  background: #f9f6f0;
  border-bottom: 1px solid #d9cdb3;
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 14px 28px;
  margin: 0 -28px 40px;
  z-index: 100;
}
.sticky-nav a {
  text-decoration: none;
  color: #4a3f35;
  font-size: 1.05rem;
  letter-spacing: 2px;
  padding: 4px 8px;
  border-bottom: 2px solid transparent;
  transition: 0.2s;
  cursor: pointer;
}
.sticky-nav a:hover,
.sticky-nav a.active {
  border-bottom-color: #b5443c;
  color: #b5443c;
}

section { margin: 80px 0; }
.section-title {
  text-align: center;
  font-family: "ZCOOL XiaoWei", "华文楷体", "KaiTi", "楷体", serif;
  font-size: 2rem;
  font-weight: 400;
  color: #3e362e;
  margin-bottom: 48px;
  position: relative;
}
.section-title::after {
  content: "";
  display: block;
  width: 50px;
  height: 2px;
  background: #b5443c;
  margin: 12px auto 0;
}

/* 生平 */
.bio-text { font-size: 1.1rem; max-width: 800px; margin: 0 auto; line-height: 2; }
.bio-text.md h1, .bio-text.md h2, .bio-text.md h3 { margin: 24px 0 12px; font-weight: 600; }
.bio-text.md p { margin-bottom: 12px; }

/* 著作卡片 - 已弃用 */

/* 关系 */
.relation-map {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 30px;
  text-align: center;
}
.person-node {
  width: 120px;
  background: #fffdf7;
  border: 1px solid #d9cdb3;
  border-radius: 16px;
  padding: 20px 10px;
  transition: 0.3s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}
.person-node:hover {
  border-color: #b5443c;
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.08);
}
.person-avatar {
  width: 48px; height: 48px; line-height: 48px;
  border-radius: 50%; background: #e6d7b8; color: #7a6e5d;
  font-size: 1.4rem; font-weight: 700;
  margin: 0 auto 8px;
  overflow: hidden;
}
.person-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.person-name { font-weight: bold; font-size: 0.95rem; }
.person-relation { font-size: 0.8rem; color: #8b7b62; }

/* 年表 */
.year-table {
  width: 100%;
  border-collapse: collapse;
  background: #fffdf7;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
}
.year-table th {
  background: #e6d7b8;
  padding: 14px;
  text-align: left;
  font-weight: 600;
  color: #3e362e;
}
.year-table td { padding: 12px 18px; border-bottom: 1px solid #e8dfcc; }
.year-table tr:last-child td { border-bottom: none; }
.year { font-weight: bold; color: #b5443c; white-space: nowrap; }

footer { text-align: center; padding: 60px 0 30px; color: #b8aa93; font-size: 0.9rem; }
</style>
