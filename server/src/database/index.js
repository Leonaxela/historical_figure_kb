/**
 * 数据库连接与初始化（使用 sql.js 纯 JS 引擎）
 */
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SCHEMA_SQL, DEFAULT_RELATION_TYPES } from './schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'famous_people.db');

let db = null;
let SQL = null; // sql.js 初始化后的模块

/**
 * 确保数据目录存在
 */
function ensureDataDir() {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * 从文件加载数据库，或创建新的
 */
async function loadOrCreateDb() {
  ensureDataDir();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    return new SQL.Database(buffer);
  }
  return new SQL.Database();
}

/**
 * 保存数据库到文件
 */
function saveDb() {
  if (!db) return;
  ensureDataDir();
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

/**
 * 获取数据库实例（首次调用时初始化）
 */
export async function getDb() {
  if (!db) {
    SQL = await initSqlJs();
    db = await loadOrCreateDb();
    await initSchema();
    // 首次创建时立即保存
    if (!fs.existsSync(DB_PATH)) {
      saveDb();
    }
  }
  return db;
}

/**
 * 初始化表结构和默认数据
 */
async function initSchema() {
  // 逐条执行 DDL
  const statements = SCHEMA_SQL.split(';').filter(s => s.trim());
  for (const stmt of statements) {
    db.run(stmt.trim() + ';');
  }

  // 初始化默认关系类型
  const result = db.exec('SELECT COUNT(*) as cnt FROM relation_types');
  const cnt = result.length > 0 ? result[0].values[0][0] : 0;
  if (cnt === 0) {
    for (const t of DEFAULT_RELATION_TYPES) {
      db.run(
        'INSERT INTO relation_types (name, category, description, color) VALUES (?, ?, ?, ?)',
        [t.name, t.category, t.description, t.color]
      );
    }
    saveDb();
  }
}

/**
 * 保存数据库（手动触发持久化）
 */
export function persistDb() {
  saveDb();
}

/**
 * 关闭数据库
 */
export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * 工具函数：执行查询并返回对象数组
 */
export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

/**
 * 工具函数：执行查询并返回单个对象
 */
export function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

/**
 * 工具函数：执行写入操作
 */
export function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

export { DB_PATH };
