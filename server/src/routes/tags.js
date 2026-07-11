import { Router } from 'express';
import { getTags, createTag, updateTag, deleteTag, getTagCelebrities, attachTag, detachTag, saveTagSort } from '../services/tagService.js';

const router = Router();

// GET /api/tags — 所有称谓
router.get('/', (req, res) => {
  res.json({ success: true, data: getTags() });
});

// POST /api/tags — 创建称谓
router.post('/', (req, res) => {
  const { name, description, color } = req.body;
  if (!name) return res.status(400).json({ success: false, message: '称谓名称为必填项' });
  const tag = createTag({ name, description, color });
  res.json({ success: true, data: tag });
});

// PUT /api/tags/:id — 更新称谓
router.put('/:id', (req, res) => {
  const { name, description, color } = req.body;
  if (!name) return res.status(400).json({ success: false, message: '称谓名称为必填项' });
  updateTag(Number(req.params.id), { name, description, color });
  res.json({ success: true });
});

// DELETE /api/tags/:id — 删除称谓
router.delete('/:id', (req, res) => {
  deleteTag(Number(req.params.id));
  res.json({ success: true });
});

// GET /api/tags/:id/celebrities — 称谓下的名人
router.get('/:id/celebrities', (req, res) => {
  const data = getTagCelebrities(Number(req.params.id));
  res.json({ success: true, data });
});

// POST /api/tags/attach — 关联名人与称谓
router.post('/attach', (req, res) => {
  const { celebrity_id, tag_id } = req.body;
  if (!celebrity_id || !tag_id) return res.status(400).json({ success: false, message: 'celebrity_id 和 tag_id 为必填项' });
  attachTag(Number(celebrity_id), Number(tag_id));
  res.json({ success: true });
});

// POST /api/tags/detach — 解除关联
router.post('/detach', (req, res) => {
  const { celebrity_id, tag_id } = req.body;
  detachTag(Number(celebrity_id), Number(tag_id));
  res.json({ success: true });
});

// POST /api/tags/sort — 批量保存排序
router.post('/sort', (req, res) => {
  const { tag_id, celebrity_ids } = req.body;
  if (!tag_id || !celebrity_ids) return res.status(400).json({ success: false, message: 'tag_id 和 celebrity_ids 为必填项' });
  saveTagSort(Number(tag_id), celebrity_ids.map(Number));
  res.json({ success: true });
});

export default router;
