/**
 * 关系类型 API 路由
 */
import { Router } from 'express';
import { queryAll, queryOne, run } from '../database/index.js';

const router = Router();

// 获取所有关系类型
router.get('/', (req, res) => {
  try {
    const types = queryAll('SELECT * FROM relation_types ORDER BY category, id');
    // 附上每种关系类型的数量
    for (const t of types) {
      const row = queryOne('SELECT COUNT(*) as cnt FROM relationships WHERE relation_type_id = ?', [t.id]);
      t.count = row ? row.cnt : 0;
    }
    res.json({ data: types });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 创建关系类型
router.post('/', (req, res) => {
  try {
    const { name, category, description, color } = req.body;
    if (!name) return res.status(400).json({ error: 'name 是必填项' });

    run('INSERT INTO relation_types (name, category, description, color) VALUES (?, ?, ?, ?)',
      [name, category || null, description || null, color || '#409EFF']);
    const row = queryOne('SELECT last_insert_rowid() as id');
    const type = queryOne('SELECT * FROM relation_types WHERE id = ?', [row.id]);
    res.status(201).json({ data: type });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新关系类型
router.put('/:id', (req, res) => {
  try {
    const existing = queryOne('SELECT * FROM relation_types WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: '关系类型不存在' });

    const fields = ['name', 'category', 'description', 'color'];
    const updates = [];
    const params = [];

    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        params.push(req.body[f]);
      }
    }

    if (updates.length > 0) {
      params.push(req.params.id);
      run(`UPDATE relation_types SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const type = queryOne('SELECT * FROM relation_types WHERE id = ?', [req.params.id]);
    res.json({ data: type });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除关系类型
router.delete('/:id', (req, res) => {
  try {
    const existing = queryOne('SELECT * FROM relation_types WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: '关系类型不存在' });

    // 检查是否被使用
    const usage = queryOne('SELECT COUNT(*) as cnt FROM relationships WHERE relation_type_id = ?', [req.params.id]);
    if (usage && usage.cnt > 0) {
      return res.status(400).json({ error: `该关系类型被 ${usage.cnt} 条关系使用，无法删除` });
    }

    run('DELETE FROM relation_types WHERE id = ?', [req.params.id]);
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 按分类分组
router.get('/grouped', (req, res) => {
  try {
    const types = queryAll('SELECT * FROM relation_types ORDER BY category, id');
    const grouped = {};
    for (const t of types) {
      const cat = t.category || '其他';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(t);
    }
    res.json({ data: grouped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
