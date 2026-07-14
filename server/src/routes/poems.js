import { Router } from 'express';
import { getPoems, createPoem, updatePoem, deletePoem } from '../services/poemService.js';
import { authMiddleware } from './auth.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({ success: true, data: getPoems() });
});

router.post('/', authMiddleware, (req, res) => {
  const { title, author, content, theme, seal, card_width, card_height } = req.body;
  if (!title) return res.status(400).json({ success: false, message: '标题为必填项' });
  const id = createPoem({ title, author, content, theme, seal, card_width, card_height });
  res.status(201).json({ success: true, data: { id } });
});

router.put('/:id', authMiddleware, (req, res) => {
  if (!updatePoem(Number(req.params.id), req.body))
    return res.status(404).json({ success: false, message: '未找到' });
  res.json({ success: true });
});

router.delete('/:id', authMiddleware, (req, res) => {
  deletePoem(Number(req.params.id));
  res.json({ success: true });
});

export default router;
