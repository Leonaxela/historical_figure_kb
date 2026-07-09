import { getDb, saveDb } from '../database/init.js';

// ── 扩展内容 ──

export function getContents(celebrityId) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM celebrity_contents WHERE celebrity_id = ?');
  stmt.bind([celebrityId]);
  if (stmt.step()) return stmt.getAsObject();
  stmt.free();
  return { biography: '', works: '', influence: '', anecdotes: '' };
}

export function upsertContents(celebrityId, data) {
  const db = getDb();
  const { biography, works, influence, anecdotes } = data;
  db.run(`
    INSERT INTO celebrity_contents (celebrity_id, biography, works, influence, anecdotes)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(celebrity_id) DO UPDATE SET
      biography = COALESCE(?, biography),
      works = COALESCE(?, works),
      influence = COALESCE(?, influence),
      anecdotes = COALESCE(?, anecdotes),
      updated_at = datetime('now')
  `, [celebrityId, biography||'', works||'', influence||'', anecdotes||'',
      biography, works, influence, anecdotes]);
  saveDb();
  return true;
}

// ── 时间线 ──

export function getTimeline(celebrityId) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM timeline_events WHERE celebrity_id = ? ORDER BY sort_order, event_date');
  stmt.bind([celebrityId]);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

export function createTimelineEvent(celebrityId, data) {
  const db = getDb();
  const { event_date, title, description, event_type, sort_order } = data;
  db.run(
    `INSERT INTO timeline_events (celebrity_id, event_date, title, description, event_type, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [celebrityId, event_date, title, description||'', event_type||'其他', sort_order||0]
  );
  saveDb();
  return db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
}

export function updateTimelineEvent(id, data) {
  const db = getDb();
  const { event_date, title, description, event_type, sort_order } = data;
  db.run(
    `UPDATE timeline_events SET event_date=?, title=?, description=?, event_type=?, sort_order=?, created_at=created_at WHERE id=?`,
    [event_date, title, description||'', event_type||'其他', sort_order||0, id]
  );
  saveDb();
  return true;
}

export function deleteTimelineEvent(id) {
  const db = getDb();
  db.run('DELETE FROM timeline_events WHERE id = ?', [id]);
  saveDb();
  return true;
}
