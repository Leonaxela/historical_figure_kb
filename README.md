# 中外名人关系图谱

一个可扩展的中外名人数据库与关系图谱可视化系统。

## 技术栈

- **前端**: Vite + Vue 3 + Element Plus + D3-Force
- **后端**: Node.js + Express + SQLite (sql.js)
- **数据源**: Wikidata SPARQL / Wikipedia API

## 快速启动

```bash
# 1. 安装依赖
cd server && npm install
cd ../client && npm install

# 2. 导入样例数据（30 位名人，28 条关系）
cd server && npm run seed

# 3. 启动后端 (端口 3001)
npm run dev:server

# 4. 另开终端，启动前端 (端口 5173)
npm run dev:client

# 5. 浏览器打开 http://localhost:5173
```

## 系统架构

```
celebrity-graph/
├── server/                  # Node.js 后端
│   ├── src/
│   │   ├── index.js         # Express 入口
│   │   ├── database/        # SQLite 数据库初始化
│   │   ├── routes/          # REST API 路由
│   │   ├── services/        # 业务逻辑层
│   │   ├── crawlers/        # 数据爬虫/导入模块
│   │   └── seed/            # 内置样例数据
│   └── data/                # SQLite 数据库文件
├── client/                  # Vue 3 前端
│   ├── src/
│   │   ├── views/           # 页面视图
│   │   ├── components/      # 通用组件
│   │   ├── stores/          # Pinia 状态管理
│   │   ├── api/             # API 客户端
│   │   └── router/          # 路由配置
│   └── ...
└── package.json             # 根项目配置
```

## API 文档

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/health | 健康检查 |
| GET | /api/celebrities | 名人列表（支持搜索、分页、筛选） |
| GET | /api/celebrities/:id | 名人详情（含关系） |
| POST | /api/celebrities | 创建名人 |
| PUT | /api/celebrities/:id | 更新名人 |
| DELETE | /api/celebrities/:id | 删除名人 |
| POST | /api/celebrities/bulk | 批量导入 |
| GET | /api/relationships | 关系列表 |
| POST | /api/relationships | 创建关系 |
| DELETE | /api/relationships/:id | 删除关系 |
| GET | /api/graph | 图谱数据（支持中心展开） |
| GET | /api/graph/path | 两点间路径查找 |
| GET | /api/graph/stats | 统计分析 |
| POST | /api/import/wikidata | 从 Wikidata 导入 |
| POST | /api/import/wikipedia | 从 Wikipedia 导入 |

## 数据库模型

### celebrities（名人表）
- name (英文名)
- chinese_name (中文名)
- birth_date / death_date (生卒日期)
- nationality (国籍)
- occupation (职业)
- biography (简介)
- image_url (头像 URL)
- wiki_id (Wiki 数据 ID，用于去重)

### relation_types（关系类型表）
- name (类型名)
- category (分类)
- description (描述)
- color (显示颜色)

### relationships（关系表）
- source_id / target_id (关联名人)
- type_id (关系类型)
- description (描述)

## 扩展性

### 添加新的数据源
继承 `BaseCrawler` 类，实现 `fetchCelebrities()` 方法，然后注册到 `ImportService`：

```js
import { BaseCrawler, importService } from './crawlers/index.js'

class MyCrawler extends BaseCrawler {
  constructor() { super('my-source') }
  async fetchCelebrities() { /* 你的爬虫逻辑 */ }
}

importService.registerCrawler(new MyCrawler())
```

### 添加新的关系类型
通过 `/api/relationships/types` API 或直接插入 `relation_types` 表。

### 前端扩展
Vue 组件按约定放在 `client/src/views/` 和 `client/src/components/`，路由在 `client/src/router/index.js` 中注册。
