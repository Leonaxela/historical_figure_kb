import { getDb, saveDb } from '../database/init.js';

/**
 * 获取所有称谓（含关联人数）
 */
export function getTags() {
  const db = getDb();
  const rows = db.exec(`
    SELECT t.*, COUNT(ct.celebrity_id) as count
    FROM tags t
    LEFT JOIN celebrity_tags ct ON t.id = ct.tag_id
    GROUP BY t.id
    ORDER BY count DESC, t.name
  `);
  return rows[0]?.values?.map(v => ({
    id: v[0], name: v[1], description: v[2], color: v[3],
    created_at: v[4], updated_at: v[5], count: v[6],
  })) ?? [];
}

/**
 * 创建称谓
 */
export function createTag({ name, description, color }) {
  const db = getDb();
  db.run('INSERT INTO tags (name, description, color) VALUES (?, ?, ?)', [name, description || '', color || '#409eff']);
  saveDb();
  return { id: db.exec('SELECT last_insert_rowid()')[0].values[0][0], name, description, color };
}

/**
 * 更新称谓
 */
export function updateTag(id, { name, description, color }) {
  const db = getDb();
  db.run('UPDATE tags SET name = ?, description = ?, color = ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?',
    [name, description, color || '#409eff', id]);
  saveDb();
}

/**
 * 删除称谓（关联数据自动 CASCADE 删除）
 */
export function deleteTag(id) {
  const db = getDb();
  db.run('DELETE FROM celebrity_tags WHERE tag_id = ?', [id]);
  db.run('DELETE FROM tags WHERE id = ?', [id]);
  saveDb();
}

/**
 * 获取称谓下的名人列表
 */
export function getTagCelebrities(tagId) {
  const db = getDb();
  const rows = db.exec(`
    SELECT c.id, c.name, c.chinese_name, c.nationality, c.occupation, c.image_url, c.birth_date, c.death_date, ct.sort_order
    FROM celebrities c
    JOIN celebrity_tags ct ON c.id = ct.celebrity_id
    WHERE ct.tag_id = ?
    ORDER BY ct.sort_order, ct.created_at
  `, [tagId]);
  return rows[0]?.values?.map(v => ({
    id: v[0], name: v[1], chinese_name: v[2], nationality: v[3], occupation: v[4], image_url: v[5], birth_date: v[6], death_date: v[7], sort_order: v[8] || 0,
  })) ?? [];
}

/**
 * 关联名人与称谓
 */
export function attachTag(celebrity_id, tag_id) {
  const db = getDb();
  db.run('INSERT OR IGNORE INTO celebrity_tags (celebrity_id, tag_id) VALUES (?, ?)', [celebrity_id, tag_id]);
  saveDb();
}

/**
 * 解除关联
 */
export function detachTag(celebrity_id, tag_id) {
  const db = getDb();
  db.run('DELETE FROM celebrity_tags WHERE celebrity_id = ? AND tag_id = ?', [celebrity_id, tag_id]);
  saveDb();
}

/**
 * 批量保存排序
 */
export function saveTagSort(tagId, celebrityIds) {
  const db = getDb();
  celebrityIds.forEach((cid, i) => {
    db.run('UPDATE celebrity_tags SET sort_order = ? WHERE celebrity_id = ? AND tag_id = ?', [i, cid, tagId]);
  });
  saveDb();
}
