import { Router } from 'express';
import {
  listCelebrities, getCelebrity, createCelebrity, updateCelebrity,
  deleteCelebrity, getNationalities, getOccupations, bulkImport,
} from '../services/celebrityService.js';
import {
  getContents, upsertContents,
  getTimeline, createTimelineEvent, updateTimelineEvent, deleteTimelineEvent,
} from '../services/contentService.js';
import { authMiddleware } from './auth.js';

const router = Router();

// ── 公开（GET）──
router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, search, nationality, occupation } = req.query;
  const result = listCelebrities({ page: Number(page), pageSize: Number(pageSize), search, nationality, occupation, includeHidden: req.query.includeHidden === 'true' });
  res.json({ success: true, ...result });
});

router.get('/nationalities', (req, res) => {
  const data = getNationalities();
  res.json({ success: true, data });
});

router.get('/occupations', (req, res) => {
  const data = getOccupations();
  res.json({ success: true, data });
});

router.get('/:id', (req, res) => {
  const celebrity = getCelebrity(Number(req.params.id), req.query.includeHidden === 'true');
  if (!celebrity) return res.status(404).json({ success: false, message: '未找到该名人' });
  res.json({ success: true, data: celebrity });
});

router.get('/:id/contents', (req, res) => {
  const data = getContents(Number(req.params.id));
  res.json({ success: true, data });
});

router.get('/:id/timeline', (req, res) => {
  const data = getTimeline(Number(req.params.id));
  res.json({ success: true, data });
});

// ── 需登录（POST/PUT/DELETE）──
router.post('/', authMiddleware, (req, res) => {
  const { name, chinese_name, birth_date, death_date, nationality, occupation, biography, image_url, wiki_id } = req.body;
  if (!name) return res.status(400).json({ success: false, message: '姓名为必填项' });
  const id = createCelebrity({ name, chinese_name, birth_date, death_date, nationality, occupation, biography, image_url, wiki_id });
  res.status(201).json({ success: true, data: { id } });
});

router.post('/bulk', authMiddleware, (req, res) => {
  const { celebrities } = req.body;
  if (!Array.isArray(celebrities) || celebrities.length === 0) {
    return res.status(400).json({ success: false, message: '请提供有效的名人数组' });
  }
  const count = bulkImport(celebrities);
  res.json({ success: true, data: { imported: count } });
});

router.put('/:id', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const updated = updateCelebrity(id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: '未找到或未更改' });
  res.json({ success: true });
});

router.delete('/:id', authMiddleware, (req, res) => {
  deleteCelebrity(Number(req.params.id));
  res.json({ success: true });
});

router.put('/:id/contents', authMiddleware, (req, res) => {
  upsertContents(Number(req.params.id), req.body);
  res.json({ success: true });
});

router.post('/:id/timeline', authMiddleware, (req, res) => {
  const id = createTimelineEvent(Number(req.params.id), req.body);
  res.status(201).json({ success: true, data: { id } });
});

router.put('/timeline/:id', authMiddleware, (req, res) => {
  updateTimelineEvent(Number(req.params.id), req.body);
  res.json({ success: true });
});

router.delete('/timeline/:id', authMiddleware, (req, res) => {
  deleteTimelineEvent(Number(req.params.id));
  res.json({ success: true });
});

export default router;
