import { Router } from 'express';
import {
  listRelationships, createRelationship, deleteRelationship,
  getRelationTypes, createRelationType, updateRelationType, deleteRelationType,
} from '../services/relationshipService.js';
import { authMiddleware } from './auth.js';

const router = Router();

router.get('/', (req, res) => {
  const { page = 1, pageSize = 50, type_id, celebrityId } = req.query;
  const result = listRelationships({ page: Number(page), pageSize: Number(pageSize), type_id: type_id ? Number(type_id) : undefined, celebrity_id: celebrityId ? Number(celebrityId) : undefined });
  res.json({ success: true, ...result });
});

router.get('/types', (req, res) => {
  const data = getRelationTypes();
  res.json({ success: true, data });
});

// 需登录
router.post('/', authMiddleware, (req, res) => {
  const { source_id, target_id, type_id, description, start_date, end_date } = req.body;
  if (!source_id || !target_id || !type_id) {
    return res.status(400).json({ success: false, message: 'source_id, target_id, type_id 为必填项' });
  }
  const id = createRelationship({ source_id, target_id, type_id, description, start_date, end_date });
  res.status(201).json({ success: true, data: { id } });
});

router.delete('/:id', authMiddleware, (req, res) => {
  deleteRelationship(Number(req.params.id));
  res.json({ success: true });
});

router.post('/types', authMiddleware, (req, res) => {
  const { name, category, description, direction, color } = req.body;
  if (!name) return res.status(400).json({ success: false, message: '名称为必填项' });
  const id = createRelationType({ name, category, description, direction, color });
  res.status(201).json({ success: true, data: { id } });
});

router.delete('/types/:id', authMiddleware, (req, res) => {
  deleteRelationType(Number(req.params.id));
  res.json({ success: true });
});

router.put('/types/:id', authMiddleware, (req, res) => {
  const { name, category, description, direction, color } = req.body;
  updateRelationType(Number(req.params.id), { name, category, description, direction, color });
  res.json({ success: true });
});

export default router;
