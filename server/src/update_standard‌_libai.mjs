/**
 * ========================================
 *  名人数据更新模板
 *  通过 API 更新名人扩展内容和时间线
 *
 *  ── API 接口 ──
 *    POST   /api/login                          登录获取 token
 *    PUT    /api/celebrities/:id/contents        更新扩展内容
 *    GET    /api/celebrities/:id/timeline        获取时间线列表
 *    POST   /api/celebrities/:id/timeline        新增时间线事件
 *    DELETE /api/celebrities/timeline/:id        删除时间线事件
 *
 *  ── 数据库表 ──
 *    celebrity_contents  → biography / works / influence / anecdotes
 *    timeline_events     → event_date / title / description / event_type
 *
 *  用法：node server/src/testmjs/update_libai.mjs
 *  注意：服务端必须先启动（localhost:3001）
 * ========================================
 */

// ─── 配置 ─────────────────────────────────────
const BASE = 'http://localhost:3001/api';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';
const CELEBRITY_ID = 86;  // 李白的 ID

// ─── 要更新的内容 ──────────────────────────────
// 对应数据库表 celebrity_contents 的字段：
//   biography  — 生平（支持 Markdown）
//   works      — 著作/作品（支持 Markdown）
//   influence  — 影响/地位（支持 Markdown）
//   anecdotes  — 轶事/典故（支持 Markdown）
const CONTENT = {
  biography: `李白（701年2月28日—762年12月），字太白，号青莲居士，又号"谪仙人"，唐代伟大的浪漫主义诗人，被后世尊为**"诗仙"**，与杜甫并称**"李杜"**。

## 家世背景

李白祖籍陇西成纪（今甘肃秦安），生于西域碎叶城（今吉尔吉斯斯坦托克马克），四岁随父迁居剑南道绵州昌隆（今四川江油）。

## 漫游与入仕

- **725年**：出蜀，"仗剑去国，辞亲远游"
- **730年**：初入长安，求仕未果
- **742年**：应召入京，供奉翰林
- **744年**：被赐金放还，离开长安
- **744年秋**：在洛阳与杜甫相遇

## 晚年

安史之乱期间，因参加永王李璘幕府被流放夜郎。途中遇赦放还。晚年漂泊困苦，病逝于当涂。`,
  works: `## 代表诗作

- **《将进酒》**：君不见黄河之水天上来
- **《蜀道难》**：蜀道之难，难于上青天
- **《静夜思》**：床前明月光，疑是地上霜
- **《望庐山瀑布》**：飞流直下三千尺
- **《早发白帝城》**：轻舟已过万重山
- **《赠汪伦》**：桃花潭水深千尺
- **《行路难》**：长风破浪会有时
- **《梦游天姥吟留别》**：安能摧眉折腰事权贵`,
  influence: `## 文学地位

中国文学史上最伟大的浪漫主义诗人，代表盛唐气象的巅峰。

## 艺术成就

- **浪漫主义风格**：想象奇特、夸张大胆
- **题材广泛**：山水、情怀、时政、友情

## 文化符号

**自由不羁、豪放洒脱**的精神象征。`,
  anecdotes: `## 铁杵磨针

少年遇老妇磨铁杵，从此发奋读书。

## 力士脱靴

让高力士为其脱靴，蔑视权贵。

## 斗酒诗百篇

杜甫："李白一斗诗百篇，长安市上酒家眠。"

## 与杜甫友谊

744年在洛阳相识，杜甫为其写多首诗。`,
};

// ─── 时间线数据 ───────────────────────────────
// 对应数据库表 timeline_events 的字段，每行格式：
//   [event_date, title, description, event_type]
//   event_date — 日期（如 "701年"、"725年春"）
//   title      — 事件标题
//   description— 事件描述（可选）
//   event_type — 事件类型："升迁"|"贬谪"|"创作"|"婚丧"|"其他"
const TIMELINE = [
  ['701年', '李白出生', '生于碎叶城', '其他'],
  ['725年', '辞亲远游', '仗剑去国，辞亲远游', '其他'],
  ['742年', '应召入京', '供奉翰林，贺知章叹为谪仙人', '升迁'],
  ['744年', '赐金放还', '遭谗毁离开长安', '贬谪'],
  ['744年', '与杜甫相遇', '在洛阳相识，同游梁宋', '其他'],
  ['755年', '安史之乱', '携家人南逃避难', '其他'],
  ['757年', '被流放夜郎', '永王兵败受牵连', '贬谪'],
  ['759年', '遇赦放还', '作《早发白帝城》', '升迁'],
  ['762年', '病逝当涂', '享年六十二岁', '婚丧'],
];

// ─── API 工具 ──────────────────────────────────
let AUTH_TOKEN = null;
function auth() {
  return AUTH_TOKEN ? { headers: { 'Authorization': 'Bearer ' + AUTH_TOKEN } } : {};
}

async function api(method, path, body) {
  const url = BASE + path;
  const opts = { method, ...auth() };
  if (body) {
    opts.headers = { 'Content-Type': 'application/json', ...opts.headers };
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch {
    throw new Error(`[${res.status}] ${url} 返回非 JSON: ${text.slice(0, 100)}`);
  }
  if (!data.success) throw new Error(`[${res.status}] ${url}: ${data.error || data.message || '未知错误'}`);
  return data;
}

// ─── 登录 ──────────────────────────────────────
async function login() {
  const data = await api('POST', '/login', { username: ADMIN_USER, password: ADMIN_PASS });
  if (!data.data?.token) throw new Error('登录返回数据不含 token');
  AUTH_TOKEN = data.data.token;
  console.log('✅ 登录成功：' + (data.data.username || ADMIN_USER));
}

// ─── 更新内容 ──────────────────────────────────
async function updateContents() {
  const res = await api('PUT', `/celebrities/${CELEBRITY_ID}/contents`, CONTENT);
  if (res.success) console.log('✅ 内容已更新');
  return res;
}

// ─── 替换时间线 ────────────────────────────────
async function replaceTimeline() {
  // 1. 获取旧时间线
  const old = await api('GET', `/celebrities/${CELEBRITY_ID}/timeline`);
  const oldEvents = old.data || [];

  // 2. 逐条删除
  for (const ev of oldEvents) {
    try {
      await api('DELETE', `/celebrities/timeline/${ev.id}`);
    } catch (e) {
      console.warn(`⚠️  删除时间线 #${ev.id} 失败: ${e.message}`);
    }
  }
  if (oldEvents.length) console.log(`✅ 已删除 ${oldEvents.length} 条旧时间线`);

  // 3. 逐条新增
  for (let i = 0; i < TIMELINE.length; i++) {
    const [date, title, desc, type] = TIMELINE[i];
    try {
      await api('POST', `/celebrities/${CELEBRITY_ID}/timeline`, {
        event_date: date, title, description: desc, event_type: type,
      });
    } catch (e) {
      console.error(`❌ 新增时间线 #${i + 1}「${title}」失败: ${e.message}`);
      throw e; // 时间线数据完整性重要，失败就停
    }
  }
  console.log(`✅ 时间线已更新（${TIMELINE.length} 条）`);
}

// ─── 主流程 ────────────────────────────────────
try {
  console.log(`📝 开始更新名人 #${CELEBRITY_ID}...`);
  await login();
  await updateContents();
  await replaceTimeline();
  console.log('🎉 全部完成！刷新页面即可看到更新。');
  process.exit(0);
} catch (e) {
  console.error('❌ 更新失败:', e.message);
  process.exit(1);
}
