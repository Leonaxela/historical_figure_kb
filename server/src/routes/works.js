import { Router } from 'express';
import { getWorks, createWork, updateWork, deleteWork } from '../services/workService.js';
import { authMiddleware } from './auth.js';

const router = Router();

// GET /api/works — 所有著作
router.get('/', (req, res) => {
  const data = getWorks();
  res.json({ success: true, data });
});

// POST /api/works — 新增
router.post('/', authMiddleware, (req, res) => {
  const { title, celebrity_id, author, status } = req.body;
  if (!title) return res.status(400).json({ success: false, message: '标题为必填项' });
  const id = createWork({ title, celebrity_id, author, status });
  res.status(201).json({ success: true, data: { id } });
});

// PUT /api/works/:id — 更新
router.put('/:id', authMiddleware, (req, res) => {
  updateWork(Number(req.params.id), req.body);
  res.json({ success: true });
});

// DELETE /api/works/:id — 删除
router.delete('/:id', authMiddleware, (req, res) => {
  deleteWork(Number(req.params.id));
  res.json({ success: true });
});

export default router;
