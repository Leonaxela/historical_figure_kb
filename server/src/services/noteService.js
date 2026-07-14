import { getDb, saveDb } from '../database/init.js';

export function getNotes() {
  const db = getDb();
  const rows = db.exec('SELECT * FROM notes ORDER BY created_at DESC');
  return (rows[0]?.values ?? []).map(v => ({
    id: v[0], content: v[1] || '',
    bg_color: v[2] || '#FFF9C4',
    card_width: v[3] || 220, card_height: v[4] || 220,
    created_at: v[5], updated_at: v[6],
  }));
}

export function createNote({ content, bg_color, card_width, card_height }) {
  const db = getDb();
  db.run(
    `INSERT INTO notes (content, bg_color, card_width, card_height) VALUES (?, ?, ?, ?)`,
    [content || '', bg_color || '#FFF9C4', card_width || 220, card_height || 220]
  );
  saveDb();
  return db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
}

export function updateNote(id, data) {
  const db = getDb();
  const fields = [];
  const params = [];
  for (const [key, value] of Object.entries(data)) {
    if (['content', 'bg_color', 'card_width', 'card_height'].includes(key)) {
      fields.push(`${key} = ?`);
      params.push(value ?? null);
    }
  }
  if (fields.length === 0) return false;
  fields.push("updated_at = datetime('now','localtime')");
  params.push(id);
  db.run(`UPDATE notes SET ${fields.join(', ')} WHERE id = ?`, params);
  saveDb();
  return true;
}

export function deleteNote(id) {
  const db = getDb();
  db.run('DELETE FROM notes WHERE id = ?', [id]);
  saveDb();
}
