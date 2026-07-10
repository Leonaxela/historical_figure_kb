import { getDb, saveDb } from '../database/init.js';

/**
 * 查询关系列表（分页 + 筛选）
 */
export function listRelationships({ page = 1, pageSize = 50, type_id, celebrity_id } = {}) {
  const db = getDb();
  const conditions = [];
  const params = [];
  if (type_id) {
    conditions.push('r.type_id = ?');
    params.push(type_id);
  }
  if (celebrity_id) {
    conditions.push('(r.source_id = ? OR r.target_id = ?)');
    params.push(celebrity_id, celebrity_id);
  }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const countResult = db.exec(`SELECT COUNT(*) as total FROM relationships r ${where}`, params);
  const total = countResult[0]?.values[0]?.[0] ?? 0;

  const offset = (page - 1) * pageSize;
  const sql = `
    SELECT r.*, rt.name as type_name, rt.direction as type_direction, rt.color as type_color, rt.category as type_category,
      c1.name as source_name, c1.chinese_name as source_chinese_name,
      c2.name as target_name, c2.chinese_name as target_chinese_name
    FROM relationships r
    JOIN relation_types rt ON r.type_id = rt.id
    JOIN celebrities c1 ON r.source_id = c1.id
    JOIN celebrities c2 ON r.target_id = c2.id
    ${where}
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const stmt = db.prepare(sql);
  stmt.bind([...params, pageSize, offset]);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return { total, page, pageSize, data: rows };
}

/**
 * 创建关系
 */
export function createRelationship({ source_id, target_id, type_id, description, start_date, end_date }) {
  const db = getDb();
  db.run(
    `INSERT OR IGNORE INTO relationships (source_id, target_id, type_id, description, start_date, end_date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [source_id, target_id, type_id, description || null, start_date || null, end_date || null]
  );
  saveDb();
  return db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
}

/**
 * 删除关系
 */
export function deleteRelationship(id) {
  const db = getDb();
  db.run('DELETE FROM relationships WHERE id = ?', [id]);
  saveDb();
  return true;
}

/**
 * 获取所有关系类型
 */
export function getRelationTypes() {
  const db = getDb();
  const result = db.exec('SELECT * FROM relation_types ORDER BY category, name');
  const stmt = db.prepare('SELECT * FROM relation_types ORDER BY category, name');
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/**
 * 创建关系类型
 */
export function createRelationType({ name, category, description, direction, color }) {
  const db = getDb();
  db.run(
    'INSERT INTO relation_types (name, category, description, direction, color) VALUES (?, ?, ?, ?, ?)',
    [name, category || null, description || null, direction || 'none', color || '#6366f1']
  );
  saveDb();
  return db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
}

/**
 * 删除关系类型
 */
export function deleteRelationType(id) {
  const db = getDb();
  db.run('DELETE FROM relationships WHERE type_id = ?', [id]);
  db.run('DELETE FROM relation_types WHERE id = ?', [id]);
  saveDb();
  return true;
}

/**
 * 更新关系类型
 */
export function updateRelationType(id, { name, category, description, direction, color }) {
  const db = getDb();
  const fields = []; const params = [];
  if (name !== undefined) { fields.push('name = ?'); params.push(name); }
  if (category !== undefined) { fields.push('category = ?'); params.push(category); }
  if (description !== undefined) { fields.push('description = ?'); params.push(description); }
  if (direction !== undefined) { fields.push('direction = ?'); params.push(direction); }
  if (color !== undefined) { fields.push('color = ?'); params.push(color); }
  if (fields.length === 0) return;
  params.push(id);
  db.run(`UPDATE relation_types SET ${fields.join(', ')} WHERE id = ?`, params);
  saveDb();
}
