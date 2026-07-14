import { Router } from 'express';
import { getNotes, createNote, updateNote, deleteNote } from '../services/noteService.js';
import { authMiddleware } from './auth.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({ success: true, data: getNotes() });
});

router.post('/', authMiddleware, (req, res) => {
  const { content, bg_color, card_width, card_height } = req.body;
  const id = createNote({ content, bg_color, card_width, card_height });
  res.status(201).json({ success: true, data: { id } });
});

router.put('/:id', authMiddleware, (req, res) => {
  if (!updateNote(Number(req.params.id), req.body))
    return res.status(404).json({ success: false, message: '未找到' });
  res.json({ success: true });
});

router.delete('/:id', authMiddleware, (req, res) => {
  deleteNote(Number(req.params.id));
  res.json({ success: true });
});

export default router;
