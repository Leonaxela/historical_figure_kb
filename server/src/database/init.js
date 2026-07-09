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
  // 启动过程不执行任何建表/改表/写数据操作
  db.run('PRAGMA foreign_keys = ON');
}
