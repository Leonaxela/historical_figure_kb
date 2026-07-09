import Database from 'sql.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../data/celebrity.db');

let db = null;

/**
 * 同步获取数据库实例（初始化后使用）
 */
export function getDb() {
  if (!db) throw new Error('数据库尚未初始化，请先调用 initSchema()');
  return db;
}

/**
 * 异步初始化数据库（仅在启动时调用一次）
 */
export async function initDb() {
  if (db) return db;

  const SQL = await Database();
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // 启用外键
  db.run('PRAGMA foreign_keys = ON');
  return db;
}

/**
 * 保存数据库到磁盘
 */
export function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

/**
 * 初始化表结构
 */
export async function initSchema() {
  const db = await initDb();

  db.run(`
    CREATE TABLE IF NOT EXISTS celebrities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      chinese_name TEXT,
      birth_date TEXT,
      death_date TEXT,
      nationality TEXT,
      occupation TEXT,
      biography TEXT,
      image_url TEXT,
      wiki_id TEXT UNIQUE,
      his_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 兼容旧数据库：尝试添加 his_id 列（已存在则忽略）
  try { db.run('ALTER TABLE celebrities ADD COLUMN his_id TEXT'); } catch (e) {}
  try { db.run('ALTER TABLE celebrities DROP COLUMN dynasty'); } catch (e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS relation_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      category TEXT,
      description TEXT,
      direction TEXT DEFAULT 'none',
      color TEXT DEFAULT '#6366f1',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id INTEGER NOT NULL,
      target_id INTEGER NOT NULL,
      type_id INTEGER NOT NULL,
      description TEXT,
      start_date TEXT,
      end_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (source_id) REFERENCES celebrities(id) ON DELETE CASCADE,
      FOREIGN KEY (target_id) REFERENCES celebrities(id) ON DELETE CASCADE,
      FOREIGN KEY (type_id) REFERENCES relation_types(id) ON DELETE CASCADE,
      UNIQUE(source_id, target_id, type_id)
    )
  `);

  // 创建索引
  db.run('CREATE INDEX IF NOT EXISTS idx_celebrities_name ON celebrities(name)');
  db.run('CREATE INDEX IF NOT EXISTS idx_celebrities_nationality ON celebrities(nationality)');
  db.run('CREATE INDEX IF NOT EXISTS idx_celebrities_occupation ON celebrities(occupation)');
  db.run('CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships(source_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships(target_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(type_id)');

  // 人物扩展内容表（生平、著作、影响、轶事）
  db.run(`
    CREATE TABLE IF NOT EXISTS celebrity_contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      celebrity_id INTEGER NOT NULL UNIQUE REFERENCES celebrities(id) ON DELETE CASCADE,
      biography TEXT DEFAULT '',
      works TEXT DEFAULT '',
      influence TEXT DEFAULT '',
      anecdotes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 时间线事件表
  db.run(`
    CREATE TABLE IF NOT EXISTS timeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      celebrity_id INTEGER NOT NULL REFERENCES celebrities(id) ON DELETE CASCADE,
      event_date TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      event_type TEXT DEFAULT '其他',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run('CREATE INDEX IF NOT EXISTS idx_timeline_celeb ON timeline_events(celebrity_id)');

  // 用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 插入默认管理员（密码: admin123，bcrypt 10轮）
  const adminHash = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)`,
    ['admin', adminHash]);

  // 插入关系类型 — 15 种，含方向
  const defaultTypes = [
    ['老师', '师门', '直接传授学问或技艺的人', 'from', '#f59e0b'],
    ['学生', '师门', '亲自教授过的弟子', 'from', '#eab308'],
    ['父亲', '家庭', '生父或养父', 'from', '#f43f5e'],
    ['母亲', '家庭', '生母或养母', 'from', '#fb7185'],
    ['丈夫', '家庭', '婚姻关系中的丈夫', 'both', '#ef4444'],
    ['妻子', '家庭', '婚姻关系中的妻子', 'both', '#e11d48'],
    ['小妾', '家庭', '纳为妾室', 'both', '#f87171'],
    ['情人', '情感', '恋爱或情人关系', 'both', '#ec4899'],
    ['兄弟', '家庭', '亲兄弟或结拜兄弟', 'both', '#f97316'],
    ['姐妹', '家庭', '亲姐妹或结拜姐妹', 'both', '#fb923c'],
    ['儿子', '家庭', '亲生或收养的儿子', 'from', '#f43f5e'],
    ['女儿', '家庭', '亲生或收养的女儿', 'from', '#fb7185'],
    ['朋友', '社交', '友谊关系', 'none', '#3b82f6'],
    ['政敌', '社交', '政治立场对立的对手', 'none', '#8b5cf6'],
    ['同事', '社交', '同僚或共事关系', 'none', '#14b8a6'],
  ];

  for (const [name, category, description, direction, color] of defaultTypes) {
    db.run(
      `INSERT OR IGNORE INTO relation_types (name, category, description, direction, color) VALUES (?, ?, ?, ?, ?)`,
      [name, category, description, direction, color]
    );
  }

  saveDb();
}
