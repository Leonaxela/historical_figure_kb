<template>
  <div class="encyclopedia">
    <!-- 名人跑马灯 -->
    <FamousMarquee :celebrities="favorites" />

    <!-- 展示卡片 -->
    <div class="section-label" v-if="favorites.length">收藏名人</div>
    <div v-if="favorites.length" class="fav-grid">
      <div class="fav-card" v-for="c in favorites" :key="c.id" @click="$router.push('/admin/encyclopedia/' + c.id)">
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
    <el-empty v-if="!favorites.length" description="暂无收藏名人，在名人管理中点亮 ⭐ 即可收藏" />

    <!-- 比较名人 -->
    <div class="section-label" style="margin-top:40px">比较名人</div>
    <div class="compare-toolbar">
      <el-select
        v-model="selectedCompare"
        filterable remote reserve-keyword
        placeholder="输入名字搜索名人"
        :remote-method="searchCelebrities"
        :loading="searchLoading"
        style="width:280px"
        @change="addCompare"
      >
        <el-option v-for="c in searchResults" :key="c.id" :label="c.chinese_name || c.name" :value="c" />
      </el-select>
      <span class="compare-hint">最多选3位名人比较</span>
    </div>

    <div v-if="compareList.length" class="compare-stage">
      <template v-for="(c, idx) in compareList" :key="c.id">
        <!-- VS 分隔 -->
        <div v-if="idx > 0" class="compare-vs">VS</div>
        <!-- 名人卡片 -->
        <div class="compare-card">
          <button class="compare-remove" @click="removeCompare(c)" title="移除">✕</button>
          <div class="compare-avatar">
            <img v-if="c.image_url" :src="'/img/' + c.image_url" />
            <span v-else>{{ (c.chinese_name || c.name).charAt(0) }}</span>
          </div>
          <div class="compare-name">{{ c.chinese_name || c.name }}</div>
          <div class="compare-en" v-if="c.chinese_name">{{ c.name }}</div>
          <div class="compare-info"><label>🏛️ 国籍/朝代</label><span>{{ (c.nationality || '').replace('中国_', '') || '—' }}</span></div>
          <div class="compare-info"><label>📅 生卒年</label><span>{{ c.birth_date || '?' }} ~ {{ c.death_date || '?' }}</span></div>
          <div class="compare-info"><label>📜 职业</label><span>{{ c.occupation || '—' }}</span></div>
          <div class="compare-bio">{{ c.biography || '暂无简介' }}</div>
        </div>
      </template>
      <!-- 空占位（只有1个时显示） -->
      <template v-if="compareList.length < 3">
        <div v-if="compareList.length === 1" class="compare-vs" style="visibility:hidden">VS</div>
        <div v-if="compareList.length === 1" class="compare-slot" @click="focusSearch">
          <div class="slot-icon">＋</div>
          <div class="slot-text">添加第{{ compareList.length + 1 }}位名人</div>
        </div>
      </template>
    </div>

    <!-- 默认轮播占位 -->
    <div v-else-if="showDemo" class="compare-stage">
      <div class="compare-card demo-card">
        <button class="compare-remove" @click="closeDemo" title="关闭">✕</button>
        <div class="compare-avatar">
          <svg viewBox="0 0 160 160" width="160" height="160">
            <circle cx="80" cy="80" r="80" :fill="demo[demoIdx].color" />
            <text x="80" y="92" text-anchor="middle" fill="#fff" font-size="52" font-weight="700">{{ demo[demoIdx].initial }}</text>
          </svg>
        </div>
        <div class="compare-name">{{ demo[demoIdx].name }}</div>
        <div class="compare-info"><label>&#x1F3DB;&#xFE0F; 国籍/朝代</label><span>{{ demo[demoIdx].nationality }}</span></div>
        <div class="compare-info"><label>&#x1F4C5; 生卒年</label><span>{{ demo[demoIdx].birth }} ~ {{ demo[demoIdx].death }}</span></div>
        <div class="compare-info"><label>&#x1F4DC; 职业</label><span>{{ demo[demoIdx].occupation }}</span></div>
        <div class="compare-bio">{{ demo[demoIdx].bio }}</div>
      </div>
      <div class="compare-vs" style="visibility:hidden">VS</div>
      <div class="compare-slot" @click="focusSearch">
        <div class="slot-icon">＋</div>
        <div class="slot-text">搜索名人开始比较</div>
      </div>
    </div>
    <el-empty v-else description="搜索并选择名人开始比较" :image-size="80" style="margin-top:10px" />

    <!-- ── 中国纪年 ── -->
    <div class="section-label" style="margin-top:40px">
      中国纪年
    </div>
    <el-card shadow="never" class="chrono-card" :body-style="{ padding: '20px 24px' }">
      <div class="chrono-axis">
        <span>0</span><span>100年</span><span>200年</span><span>300年</span><span>400年</span><span>500年</span><span>600年+</span>
      </div>
      <div class="chrono-row" :class="{ 'is-group': d.isGroup, 'indent': d.indent }" v-for="d in dynasties" :key="d.name + d.year">
        <div class="chrono-year">{{ d.year }}</div>
        <div class="chrono-icon">
          <img v-if="d.icon.startsWith('/')" :src="d.icon" class="chrono-img-icon" />
          <span v-else>{{ d.icon }}</span>
        </div>
        <div class="chrono-name">{{ d.name }}</div>
        <div class="chrono-bar-wrap">
          <div class="chrono-bar" :class="{ 'group-bar': d.isGroup }" :style="{ width: (d.duration / 800 * 100) + '%', background: d.color }"></div>
          <span class="chrono-dur">{{ d.duration }}年</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { celebrityApi } from '../../api/index.js'
import FamousMarquee from '../../components/FamousMarquee.vue'

const favorites = ref([])
const searchResults = ref([])
const searchLoading = ref(false)
const selectedCompare = ref(null)
const compareList = ref([])
const demoIdx = ref(0)
const showDemo = ref(true)

const dynasties = [
  { year: '约前2070', name: '夏', duration: 470, color: '#69A46C', icon: '🏺' },
  { year: '约前1600', name: '商', duration: 554, color: '#DC9561', icon: '🐚' },
  { year: '', name: '周', duration: 791, color: '#5A405E', icon: '/img/emoji/zhou.png', isGroup: true },
  { year: '前1046', name: '西周', duration: 275, color: '#C994C0', icon: '⚱️', indent: true },
  { year: '前771', name: '东周', duration: 516, color: '#F1D1BB', icon: '🏛️', indent: true },
  { year: '前221', name: '秦', duration: 15, color: '#B63F44', icon: '/img/emoji/qin.png' },
  { year: '', name: '汉', duration: 405, color: '#1D6D7F', icon: '/img/emoji/han.png', isGroup: true },
  { year: '前206', name: '西汉', duration: 210, color: '#79B0BA', icon: '🛡️', indent: true },
  { year: '9', name: '新', duration: 16, color: '#BCA346', icon: '🪙' },
  { year: '25', name: '东汉', duration: 195, color: '#E5B666', icon: '📜', indent: true },
  { year: '220', name: '三国', duration: 60, color: '#AA494C', icon: '⚔️' },
  { year: '', name: '晋', duration: 139, color: '#5B5963', icon: '🎋', isGroup: true },
  { year: '280', name: '西晋', duration: 36, color: '#8A989F', icon: '🖌️', indent: true },
  { year: '317', name: '东晋', duration: 103, color: '#D4986F', icon: '🍃', indent: true },
  { year: '420', name: '南北朝', duration: 169, color: '#259197', icon: '/img/emoji/nanbei.png' },
  { year: '581', name: '隋', duration: 37, color: '#2C769F', icon: '/img/emoji/sui.png' },
  { year: '618', name: '唐', duration: 288, color: '#CB7232', icon: '/img/emoji/tang.png' },
  { year: '907', name: '五代十国', duration: 53, color: '#B5393D', icon: '⚡' },
  { year: '', name: '宋', duration: 319, color: '#84B7B0', icon: '🖌️', isGroup: true },
  { year: '960', name: '北宋', duration: 167, color: '#C3AE84', icon: '🏮', indent: true },
  { year: '1127', name: '南宋', duration: 152, color: '#C99E6C', icon: '🎋', indent: true },
  { year: '907', name: '辽', duration: 218, color: '#B58251', icon: '🏹' },
  { year: '1038', name: '西夏', duration: 189, color: '#D46E56', icon: '🛡️' },
  { year: '1115', name: '金', duration: 119, color: '#E4C045', icon: '⚡' },
  { year: '1271', name: '元', duration: 97, color: '#DDA475', icon: '⛺️' },
  { year: '1368', name: '明', duration: 276, color: '#21507D', icon: '/img/emoji/ming.png' },
  { year: '1644', name: '清', duration: 268, color: '#2C6D95', icon: '🎐' },
]

const demo = [
  { initial: '禹', name: '大禹', nationality: '夏', birth: '约公元前2070年', death: '约公元前2060年', occupation: '君主、治水英雄', bio: '大禹治水，三过家门而不入，划分九州，建立夏朝，开创中国世袭制先河。', color: '#f97316' },
  { initial: '汤', name: '商汤', nationality: '商', birth: '约公元前1670年', death: '约公元前1587年', occupation: '君主、军事家', bio: '商汤灭夏桀，建立商朝，以仁德治国，开创"成汤之治"盛世。', color: '#dc2626' },
  { initial: '旦', name: '周公', nationality: '西周', birth: '约公元前1152年', death: '约公元前1056年', occupation: '思想家、政治家', bio: '周公旦制礼作乐，辅佐成王平定三监之乱，奠定周朝八百年基业。', color: '#059669' },
  { initial: '恒', name: '齐桓公', nationality: '东周', birth: '约公元前716年', death: '公元前643年', occupation: '君主、政治家', bio: '春秋五霸之首，尊王攘夷，"九合诸侯，一匡天下"。', color: '#0ea5e9' },
  { initial: '丘', name: '孔子', nationality: '春秋', birth: '公元前551年', death: '公元前479年', occupation: '哲学家、教育家', bio: '儒家学派创始人，删述六经，弟子三千，影响中国乃至世界两千余年。', color: '#8b5cf6' },
  { initial: '武', name: '孙武', nationality: '春秋', birth: '约公元前545年', death: '约公元前470年', occupation: '军事家', bio: '《孙子兵法》作者，"知己知彼，百战不殆"流芳百世，被誉为"兵圣"。', color: '#ec4899' },
  { initial: '鞅', name: '商鞅', nationality: '战国', birth: '约公元前390年', death: '公元前338年', occupation: '政治家、改革家', bio: '商鞅变法使秦国强大，废井田开阡陌，推行法治，为秦统一奠基。', color: '#14b8a6' },
  { initial: '政', name: '秦始皇', nationality: '秦', birth: '公元前259年', death: '公元前210年', occupation: '皇帝、政治家', bio: '秦始皇嬴政，横扫六国一统天下，书同文车同轨，建立中央集权制度。', color: '#e11d48' },
  { initial: '迁', name: '司马迁', nationality: '西汉', birth: '约公元前145年', death: '约公元前86年', occupation: '史学家、文学家', bio: '《史记》作者，究天人之际，通古今之变，被尊为"史圣"。', color: '#f59e0b' },
  { initial: '亮', name: '诸葛亮', nationality: '三国', birth: '181年', death: '234年', occupation: '政治家、军事家', bio: '鞠躬尽瘁死而后已，辅佐刘备建立蜀汉，千古忠臣楷模。', color: '#6366f1' },
]

async function searchCelebrities(query) {
  if (!query) { searchResults.value = []; return }
  searchLoading.value = true
  try {
    const res = await celebrityApi.list({ search: query, pageSize: 10 })
    if (res.success) searchResults.value = res.data || []
  } finally { searchLoading.value = false }
}

function addCompare(c) {
  if (!c || compareList.value.length >= 3 || compareList.value.find(x => x.id === c.id)) return
  compareList.value.push({ ...c })
  selectedCompare.value = null
  searchResults.value = []
}

function removeCompare(c) {
  compareList.value = compareList.value.filter(x => x.id !== c.id)
  if (!compareList.value.length) showDemo.value = true
}

function closeDemo() { showDemo.value = false }

function focusSearch() {
  document.querySelector('.compare-toolbar .el-select__wrapper')?.click()
}

let demoInterval = null

onMounted(async () => {
  const res = await celebrityApi.favorites()
  if (res.success) favorites.value = res.data || []
  demoInterval = setInterval(() => {
    demoIdx.value = (demoIdx.value + 1) % demo.length
  }, 2500)
})

onUnmounted(() => {
  if (demoInterval) clearInterval(demoInterval)
})
</script>

<style scoped>
.encyclopedia { max-width: 1200px; width: 100%; margin: 0 auto; }
.section-label {
  font-size: 16px; font-weight: 600; color: #303133;
  margin-bottom: 16px; padding-left: 4px;
}
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
  cursor: pointer;
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

/* ── 比较名人 ── */
.compare-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.compare-hint { font-size: 12px; color: #c0c4cc; }

.compare-stage {
  display: flex; align-items: stretch; justify-content: center; gap: 0;
  background: linear-gradient(145deg, #fafafa, #f5f5f5);
  border-radius: 20px; padding: 24px;
  min-height: 420px;
  border: 1px solid rgba(0,0,0,0.04);
}

.compare-card {
  position: relative;
  width: 340px; flex: 0 0 auto;
  background: #fff;
  border-radius: 16px; padding: 28px 24px 24px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02);
  transition: all 0.25s ease;
}
.compare-card:hover {
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.compare-remove {
  position: absolute; top: 10px; right: 12px;
  width: 26px; height: 26px; padding: 0;
  border: none; border-radius: 50%;
  background: rgba(0,0,0,0.02); color: #c0c4cc;
  font-size: 15px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.compare-remove:hover { background: rgba(245,108,108,0.12); color: #f56c6c; }

.compare-avatar {
  width: 160px; height: 160px; line-height: 160px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #6366f1);
  color: #fff; font-size: 56px; font-weight: 700;
  margin: 0 auto 16px; overflow: hidden;
  box-shadow: 0 4px 16px rgba(64,158,255,0.2);
}
.compare-avatar img { width: 100%; height: 100%; object-fit: cover; }

.compare-name { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 2px; }
.compare-en { font-size: 13px; color: #c0c4cc; margin-bottom: 16px; }

.compare-info {
  display: flex; justify-content: space-between;
  padding: 8px 0; border-bottom: 1px dashed #f0f0f0;
  font-size: 13px; line-height: 1.6;
}
.compare-info:last-of-type { border-bottom: none; }
.compare-info label { color: #909399; flex-shrink: 0; margin-right: 8px; }
.compare-info span { color: #303133; text-align: right; font-weight: 500; }

.compare-bio {
  margin-top: 14px; padding: 12px;
  font-size: 13px; color: #606266; line-height: 1.7;
  text-align: left;
  background: #f8f9fb; border-radius: 10px;
  display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;
}

.compare-vs {
  display: flex; align-items: center; justify-content: center;
  width: 64px; flex-shrink: 0;
  font-size: 22px; font-weight: 800;
  color: #c0c4cc; letter-spacing: 2px;
  background: linear-gradient(180deg, transparent, rgba(64,158,255,0.04), transparent);
}

.compare-slot {
  width: 340px; flex: 0 0 auto;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 12px;
  border: 2px dashed #dcdfe6;
  border-radius: 16px;
  background: rgba(255,255,255,0.4);
  cursor: pointer;
  transition: all 0.25s ease;
  min-height: 200px;
}
.compare-slot:hover {
  border-color: #409eff;
  background: rgba(64,158,255,0.04);
}
.slot-icon {
  width: 56px; height: 56px; line-height: 56px;
  border-radius: 50%;
  background: rgba(64,158,255,0.08);
  color: #409eff;
  font-size: 28px; font-weight: 300;
  text-align: center;
  transition: all 0.25s;
}
.compare-slot:hover .slot-icon {
  background: rgba(64,158,255,0.15);
  transform: scale(1.1);
}
.slot-text { font-size: 14px; color: #c0c4cc; }

/* ── 中国纪年 ── */
.chrono-card { border-radius: 14px; }
.chrono-axis {
  display: flex; justify-content: space-between;
  font-size: 12px; color: #909399;
  margin-bottom: 12px; padding-left: 240px;
}
.chrono-row {
  display: flex; align-items: center;
  height: 34px; padding: 2px 0;
}
.chrono-row.indent { }
.chrono-row.indent .chrono-icon { margin-left: 40px; }
.chrono-row.indent .chrono-name { font-size: 13px; color: #444; }
.chrono-row.is-group .chrono-name { font-size: 16px; color: #111; }
.chrono-row.is-group { height: 40px; }
.chrono-row.is-group .chrono-bar-wrap { background: transparent; }
.chrono-bar.group-bar { height: 26px; }
.chrono-year {
  width: 80px; text-align: right; padding-right: 16px;
  font-size: 13px; color: #555; flex-shrink: 0;
}
.chrono-icon {
  width: 40px; text-align: center; font-size: 20px; flex-shrink: 0;
}
.chrono-img-icon { width: 22px; height: 22px; object-fit: contain; vertical-align: middle; }
.chrono-name {
  width: 80px; padding-left: 8px;
  font-weight: 700; font-size: 15px; color: #222; flex-shrink: 0;
}
.chrono-bar-wrap {
  flex: 1; display: flex; align-items: center;
  background: #f5f6f8; border-radius: 11px;
}
.chrono-bar {
  height: 22px; border-radius: 11px;
  min-width: 4px;
  transition: width 0.6s ease;
}
.chrono-dur {
  margin-left: 6px;
  font-size: 12px; font-weight: 600; color: #909399;
  white-space: nowrap; flex-shrink: 0;
}
</style>
