import { getDb, saveDb } from '../database/init.js';

/**
 * 获取所有著作（按状态分组）
 */
export function getWorks() {
  const db = getDb();
  const rows = db.exec('SELECT * FROM works ORDER BY sort_order, created_at DESC');
  return (rows[0]?.values ?? []).map(v => ({
    id: v[0], title: v[1], author: v[2], category: v[3],
    description: v[4], cover_url: v[5], status: v[6],
    sort_order: v[7], created_at: v[8], updated_at: v[9],
    vue_url: v[10], celebrity_id: v[11],
  }));
}

/**
 * 创建著作
 */
export function createWork({ title, celebrity_id, author, status }) {
  const db = getDb();
  const maxOrder = db.exec('SELECT COALESCE(MAX(sort_order), 0) FROM works')[0].values[0][0];
  db.run(
    `INSERT INTO works (title, celebrity_id, sort_order, status, author) VALUES (?, ?, ?, ?, ?)`,
    [title, celebrity_id || null, maxOrder + 1, status || '1', author || null]
  );
  saveDb();
  return db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
}

/**
 * 更新著作
 */
export function updateWork(id, data) {
  const db = getDb();
  const fields = [];
  const params = [];
  for (const [key, value] of Object.entries(data)) {
    if (['title', 'celebrity_id', 'sort_order', 'vue_url', 'status'].includes(key)) {
      fields.push(`${key} = ?`);
      params.push(value ?? null);
    }
  }
  if (fields.length === 0) return false;
  fields.push("updated_at = datetime('now','localtime')");
  params.push(id);
  db.run(`UPDATE works SET ${fields.join(', ')} WHERE id = ?`, params);
  saveDb();
  return true;
}

/**
 * 删除著作
 */
export function deleteWork(id) {
  const db = getDb();
  db.run('DELETE FROM works WHERE id = ?', [id]);
  saveDb();
}
