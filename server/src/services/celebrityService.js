import { getDb, saveDb } from '../database/init.js';

/**
 * 查询名人列表（分页 + 搜索 + 筛选）
 */
export function listCelebrities({ page = 1, pageSize = 20, search, nationality, occupation, tagId, includeHidden = false } = {}) {
  const db = getDb();
  const conditions = [];
  const params = [];

  if (!includeHidden) {
    conditions.push('c.status IS NOT 0');
  }

  if (search) {
    conditions.push('(c.name LIKE ? OR c.chinese_name LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s);
  }
  if (nationality) {
    conditions.push('c.nationality LIKE ?');
    params.push(`%${nationality}%`);
  }
  if (occupation) {
    conditions.push('c.occupation LIKE ?');
    params.push(`%${occupation}%`);
  }
  if (tagId) {
    conditions.push('c.id IN (SELECT celebrity_id FROM celebrity_tags WHERE tag_id = ?)');
    params.push(tagId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 总数
  const countSql = `SELECT COUNT(*) as total FROM celebrities c ${where}`;
  const countResult = db.exec(countSql, params);
  const total = countResult[0]?.values[0]?.[0] ?? 0;

  // 分页数据
  const offset = (page - 1) * pageSize;
  const dataSql = `
    SELECT c.*, 
      (SELECT COUNT(*) FROM (
        SELECT 1 FROM relationships r2
        JOIN relation_types rt ON r2.type_id = rt.id
        WHERE (r2.source_id = c.id OR r2.target_id = c.id)
          AND (rt.direction != 'from' OR r2.source_id = c.id)
        GROUP BY
          CASE WHEN r2.source_id < r2.target_id THEN r2.source_id ELSE r2.target_id END,
          CASE WHEN r2.source_id < r2.target_id THEN r2.target_id ELSE r2.source_id END,
          r2.type_id
      )) as relation_count
    FROM celebrities c
    ${where}
    ORDER BY c.updated_at DESC
    LIMIT ? OFFSET ?
  `;
  const stmt = db.prepare(dataSql);
  stmt.bind([...params, pageSize, offset]);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();

  return { total, page, pageSize, data: rows };
}

/**
 * 获取名人详情（含关系）
 */
export function getCelebrity(id, includeHidden = false) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM celebrities WHERE id = ?');
  stmt.bind([id]);
  let celebrity = null;
  if (stmt.step()) {
    celebrity = stmt.getAsObject();
  }
  stmt.free();
  if (!celebrity) return null;
  if (!includeHidden && celebrity.status === 0) return null;

  // 查询该名人的所有关系
  const relSql = `
    SELECT r.*, rt.name as type_name, rt.direction as type_direction, rt.color as type_color, rt.category as type_category,
      c1.name as source_name, c1.chinese_name as source_chinese_name,
      c2.name as target_name, c2.chinese_name as target_chinese_name
    FROM relationships r
    JOIN relation_types rt ON r.type_id = rt.id
    JOIN celebrities c1 ON r.source_id = c1.id
    JOIN celebrities c2 ON r.target_id = c2.id
    WHERE r.source_id = ? OR r.target_id = ?
    ORDER BY r.created_at DESC
  `;
  const relStmt = db.prepare(relSql);
  relStmt.bind([id, id]);
  const relations = [];
  while (relStmt.step()) {
    relations.push(relStmt.getAsObject());
  }
  relStmt.free();

  return { ...celebrity, relations };
}

// 朝代名称 → 英文ID 映射（与前端 DYNASTY_LABELS 反向）
const DYNASTY_MAP = {
  '春秋': 'chunqiu', '战国': 'zhanguo', '秦': 'qin', '西汉': 'xihan', '东汉': 'donghan',
  '三国': 'sanguo', '西晋': 'xijin', '东晋': 'dongjin', '南北朝': 'nanbei', '隋': 'sui',
  '唐': 'tang', '北宋': 'beisong', '南宋': 'nansong', '元': 'yuan', '明': 'ming', '清': 'qing',
}

/**
 * 创建名人
 */
export function createCelebrity(data) {
  const db = getDb();
  const { name, chinese_name, his_id, birth_date, death_date, nationality, occupation, biography, image_url, wiki_id } = data;
  const finalHisId = his_id || generateHisId(nationality);
  db.run(
    `INSERT INTO celebrities (name, chinese_name, his_id, birth_date, death_date, nationality, occupation, biography, image_url, wiki_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, chinese_name || null, finalHisId, birth_date || null, death_date || null, nationality || null, occupation || null, biography || null, image_url || null, wiki_id || null]
  );
  saveDb();
  return db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
}

function generateHisId(nationality) {
  // 中国人物：从 "中国_唐" 中提取朝代，生成 tang_6位随机数
  if (nationality && nationality.startsWith('中国_')) {
    const dynastyLabel = nationality.replace('中国_', '')
    const prefix = DYNASTY_MAP[dynastyLabel]
    if (prefix) {
      const rand = String(Math.floor(100000 + Math.random() * 900000))
      return `${prefix}_${rand}`
    }
  }
  // 非中国人物：F_6位随机数
  const rand = String(Math.floor(100000 + Math.random() * 900000))
  return `F_${rand}`
}

/**
 * 更新名人
 */
export function updateCelebrity(id, data) {
  const db = getDb();
  const fields = [];
  const params = [];

  for (const [key, value] of Object.entries(data)) {
    if (['name', 'chinese_name', 'his_id', 'birth_date', 'death_date', 'nationality', 'occupation', 'biography', 'image_url', 'wiki_id', 'status'].includes(key)) {
      fields.push(`${key} = ?`);
      params.push(value ?? null);
    }
  }

  if (fields.length === 0) return false;

  fields.push("updated_at = datetime('now')");
  params.push(id);

  db.run(`UPDATE celebrities SET ${fields.join(', ')} WHERE id = ?`, params);
  saveDb();
  return true;
}

/**
 * 删除名人（级联删除关系）
 */
export function deleteCelebrity(id) {
  const db = getDb();
  db.run('DELETE FROM relationships WHERE source_id = ? OR target_id = ?', [id, id]);
  db.run('DELETE FROM celebrities WHERE id = ?', [id]);
  saveDb();
  return true;
}

/**
 * 获取所有国籍列表（去重）
 */
export function getNationalities() {
  const db = getDb();
  const result = db.exec('SELECT DISTINCT nationality FROM celebrities WHERE nationality IS NOT NULL AND nationality != "" AND status IS NOT 0 AND nationality NOT LIKE "%/%" ORDER BY nationality');
  return (result[0]?.values ?? []).map(v => v[0]);
}

/**
 * 获取所有职业分类（去重）
 */
export function getOccupations() {
  const db = getDb();
  const result = db.exec('SELECT occupation FROM celebrities WHERE occupation IS NOT NULL AND occupation != "" AND status IS NOT 0');
  const set = new Set();
  for (const row of (result[0]?.values ?? [])) {
    for (const part of (row[0] ?? '').split('、')) {
      const trimmed = part.trim();
      if (trimmed) set.add(trimmed);
    }
  }
  return [...set].sort();
}

/**
 * 批量导入名人
 */
export function bulkImport(celebrities) {
  const db = getDb();
  const insert = db.prepare(
    `INSERT OR IGNORE INTO celebrities (name, chinese_name, his_id, birth_date, death_date, nationality, occupation, biography, image_url, wiki_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  let imported = 0;
  for (const c of celebrities) {
    insert.bind([c.name, c.chinese_name || null, c.his_id || null, c.birth_date || null, c.death_date || null, c.nationality || null, c.occupation || null, c.biography || null, c.image_url || null, c.wiki_id || null]);
    const result = insert.step();
    insert.reset();
    if (result) imported++;
  }
  insert.free();
  saveDb();
  return imported;
}
