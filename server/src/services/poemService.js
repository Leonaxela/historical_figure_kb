import { getDb, saveDb } from '../database/init.js';

export function getPoems() {
  const db = getDb();
  const rows = db.exec('SELECT * FROM poems ORDER BY created_at DESC');
  return (rows[0]?.values ?? []).map(v => ({
    id: v[0], title: v[1], author: v[2], content: v[3],
    theme: v[4] || 'warm', seal: v[5] || '雅',
    card_width: v[8] || 280, card_height: v[9] || 320,
    created_at: v[6], updated_at: v[7],
  }));
}

export function createPoem({ title, author, content, theme, seal, card_width, card_height }) {
  const db = getDb();
  db.run(
    `INSERT INTO poems (title, author, content, theme, seal, card_width, card_height) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, author || null, content || null, theme || 'warm', seal || '雅', card_width || 280, card_height || 320]
  );
  saveDb();
  return db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
}

export function updatePoem(id, data) {
  const db = getDb();
  const fields = [];
  const params = [];
  for (const [key, value] of Object.entries(data)) {
    if (['title', 'author', 'content', 'theme', 'seal', 'card_width', 'card_height'].includes(key)) {
      fields.push(`${key} = ?`);
      params.push(value ?? null);
    }
  }
  if (fields.length === 0) return false;
  fields.push("updated_at = datetime('now','localtime')");
  params.push(id);
  db.run(`UPDATE poems SET ${fields.join(', ')} WHERE id = ?`, params);
  saveDb();
  return true;
}

export function deletePoem(id) {
  const db = getDb();
  db.run('DELETE FROM poems WHERE id = ?', [id]);
  saveDb();
}
