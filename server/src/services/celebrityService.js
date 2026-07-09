import { getDb, saveDb } from '../database/init.js';

/**
 * 查询名人列表（分页 + 搜索 + 筛选）
 */
export function listCelebrities({ page = 1, pageSize = 20, search, nationality, occupation } = {}) {
  const db = getDb();
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(c.name LIKE ? OR c.chinese_name LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s);
  }
  if (nationality) {
    conditions.push('c.nationality = ?');
    params.push(nationality);
  }
  if (occupation) {
    conditions.push('c.occupation LIKE ?');
    params.push(`%${occupation}%`);
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
export function getCelebrity(id) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM celebrities WHERE id = ?');
  stmt.bind([id]);
  let celebrity = null;
  if (stmt.step()) {
    celebrity = stmt.getAsObject();
  }
  stmt.free();
  if (!celebrity) return null;

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

const DYNASTY_LABELS = {
  chunqiu: '春秋', zhanguo: '战国', qin: '秦', xihan: '西汉', donghan: '东汉',
  sanguo: '三国', xijin: '西晋', dongjin: '东晋', nanbei: '南北朝', sui: '隋',
  tang: '唐', beisong: '北宋', nansong: '南宋', yuan: '元', ming: '明', qing: '清',
};

/**
 * 创建名人
 */
export function createCelebrity(data) {
  const db = getDb();
  const { name, chinese_name, his_id, birth_date, death_date, nationality, dynasty, occupation, biography, image_url, wiki_id } = data;
  // 中国人物：将朝代合并到国籍字段（如 "chunqiu" → "春秋"，存为 "中国_春秋"）
  const dynLabel = DYNASTY_LABELS[dynasty] || dynasty;
  const finalNationality = (nationality?.includes('中国') && dynasty)
    ? `中国_${dynLabel}` : nationality
  const finalHisId = his_id || generateHisId(nationality, dynasty);
  db.run(
    `INSERT INTO celebrities (name, chinese_name, his_id, birth_date, death_date, nationality, occupation, biography, image_url, wiki_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, chinese_name || null, finalHisId, birth_date || null, death_date || null, finalNationality || null, occupation || null, biography || null, image_url || null, wiki_id || null]
  );
  saveDb();
  return db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
}

function generateHisId(nationality, dynasty) {
  const rand = String(Math.floor(100000 + Math.random() * 900000));
  if (dynasty) return `${dynasty}_${rand}`;
  if (nationality && !nationality.includes('中国')) return `F_${rand}`;
  return `F_${rand}`;
}

/**
 * 更新名人
 */
export function updateCelebrity(id, data) {
  const db = getDb();
  const fields = [];
  const params = [];

  // 处理 dynasty → nationality 合并
  let nat = data.nationality;
  if (data.dynasty && nat?.includes('中国')) {
    const dynLabel = DYNASTY_LABELS[data.dynasty] || data.dynasty;
    nat = `中国_${dynLabel}`;
  }

  for (const [key, value] of Object.entries(data)) {
    if (['name', 'chinese_name', 'his_id', 'birth_date', 'death_date', 'occupation', 'biography', 'image_url', 'wiki_id'].includes(key)) {
      fields.push(`${key} = ?`);
      params.push(value ?? null);
    }
  }
  if (nat !== undefined) {
    fields.push('nationality = ?');
    params.push(nat ?? null);
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
  const result = db.exec('SELECT DISTINCT nationality FROM celebrities WHERE nationality IS NOT NULL AND nationality != "" ORDER BY nationality');
  return (result[0]?.values ?? []).map(v => v[0]);
}

/**
 * 获取所有职业分类（去重）
 */
export function getOccupations() {
  const db = getDb();
  const result = db.exec('SELECT DISTINCT occupation FROM celebrities WHERE occupation IS NOT NULL AND occupation != "" ORDER BY occupation');
  return (result[0]?.values ?? []).map(v => v[0]);
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
