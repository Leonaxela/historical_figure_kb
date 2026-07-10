/**
 * 数据库表结构定义
 * 关系图谱系统核心数据模型
 */
export const SCHEMA_SQL = `
-- 名人表：存储中外名人基本信息
CREATE TABLE IF NOT EXISTS celebrities (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,                -- 英文/原文名
  chinese_name  TEXT,                         -- 中文名
  birth_date    TEXT,                         -- 出生日期 (YYYY-MM-DD 或 YYYY)
  death_date    TEXT,                         -- 逝世日期
  nationality   TEXT,                         -- 国籍
  occupation    TEXT,                         -- 职业（逗号分隔）
  bio           TEXT,                         -- 简介
  image_url     TEXT,                         -- 头像图片 URL
  wiki_url      TEXT,                         -- 百科链接
  wikidata_id   TEXT UNIQUE,                  -- Wikidata QID，用于数据扩展
  status        INTEGER DEFAULT 1,            -- 状态（1=显示，0=隐藏，仅影响游客）
  created_at    TEXT DEFAULT (datetime('now','localtime')),
  updated_at    TEXT DEFAULT (datetime('now','localtime'))
);

-- 关系类型表：可扩展的关系分类
CREATE TABLE IF NOT EXISTS relation_types (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL UNIQUE,          -- 关系名称（如 "配偶"、"师生"）
  category      TEXT,                          -- 关系分类（如 "家庭"、"学术"）
  description   TEXT,                          -- 描述
  color         TEXT DEFAULT '#409EFF'         -- 图谱中显示颜色
);

-- 关系表：连接两个名人的边
CREATE TABLE IF NOT EXISTS relationships (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id       INTEGER NOT NULL REFERENCES celebrities(id),
  target_id       INTEGER NOT NULL REFERENCES celebrities(id),
  relation_type_id INTEGER NOT NULL REFERENCES relation_types(id),
  description     TEXT,                        -- 关系描述
  start_year      TEXT,                        -- 关系起始年份
  end_year        TEXT,                        -- 关系结束年份
  created_at      TEXT DEFAULT (datetime('now','localtime')),
  CHECK (source_id != target_id)
);

-- 扩展字段表：为任意实体附加自定义属性（EAV 模式，保证扩展性）
CREATE TABLE IF NOT EXISTS entity_attributes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type   TEXT NOT NULL,                 -- 实体类型: 'celebrity', 'relationship'
  entity_id     INTEGER NOT NULL,
  attr_key      TEXT NOT NULL,                 -- 属性键
  attr_value    TEXT,                          -- 属性值
  UNIQUE(entity_type, entity_id, attr_key)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_rel_source ON relationships(source_id);
CREATE INDEX IF NOT EXISTS idx_rel_target ON relationships(target_id);
CREATE INDEX IF NOT EXISTS idx_rel_type  ON relationships(relation_type_id);
CREATE INDEX IF NOT EXISTS idx_attr_lookup ON entity_attributes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_celeb_name ON celebrities(name);
CREATE INDEX IF NOT EXISTS idx_celeb_chinese_name ON celebrities(chinese_name);
CREATE INDEX IF NOT EXISTS idx_celeb_occupation ON celebrities(occupation);
`;

/**
 * 默认关系类型
 */
export const DEFAULT_RELATION_TYPES = [
  { name: '配偶',     category: '家庭', color: '#E74C3C', description: '婚姻关系' },
  { name: '子女',     category: '家庭', color: '#E91E63', description: '父母与子女' },
  { name: '父母',     category: '家庭', color: '#E91E63', description: '子女与父母' },
  { name: '师生',     category: '学术', color: '#3498DB', description: '老师与学生' },
  { name: '同门',     category: '学术', color: '#9B59B6', description: '同一位老师门下' },
  { name: '合作',     category: '职业', color: '#2ECC71', description: '合作关系' },
  { name: '挚友',     category: '社交', color: '#1ABC9C', description: '亲密友谊' },
  { name: '对手',     category: '社交', color: '#F39C12', description: '竞争/敌对关系' },
  { name: '师徒',     category: '职业', color: '#E67E22', description: '师傅与徒弟（手艺/艺术）' },
  { name: '同行',     category: '职业', color: '#95A5A6', description: '同一行业/领域' },
  { name: '前后辈',   category: '社交', color: '#34495E', description: '前辈与后辈' },
  { name: '校友',     category: '学术', color: '#16A085', description: '同一学校毕业' },
  { name: '同僚',     category: '职业', color: '#2980B9', description: '同一机构共事' },
  { name: '恋人',     category: '家庭', color: '#FF6B81', description: '恋爱关系' },
  { name: '亲属',     category: '家庭', color: '#A04000', description: '其他亲属关系' },
];
