import { Router } from 'express';
import { getGraphData, findPath, getStats, getWordCloud } from '../services/graphService.js';

const router = Router();

// GET /api/graph — 图谱数据
router.get('/', (req, res) => {
  const { centerId, centerIds, depth = 1, category, limit = 200 } = req.query;
  // 兼容两种传参：centerIds（多选逗号分隔）和 centerId（单个，管理后台使用）
  const ids = centerIds || centerId;
  const data = getGraphData({
    centerIds: ids ? ids.split(',').map(Number) : undefined,
    depth: Number(depth),
    category,
    limit: Number(limit),
  });
  res.json({ success: true, data });
});

// GET /api/graph/path — 查找两个名人之间的路径
router.get('/path', (req, res) => {
  const { sourceId, targetId, maxDepth = 6 } = req.query;
  if (!sourceId || !targetId) {
    return res.status(400).json({ success: false, message: '需要提供 sourceId 和 targetId' });
  }
  const result = findPath(Number(sourceId), Number(targetId), Number(maxDepth));
  if (!result) {
    return res.json({ success: true, data: null, message: '未找到路径' });
  }
  res.json({ success: true, data: result });
});

// GET /api/graph/stats — 统计信息
router.get('/stats', (req, res) => {
  const stats = getStats();
  res.json({ success: true, data: stats });
});

// GET /api/graph/wordcloud — 词云数据
router.get('/wordcloud', (req, res) => {
  const data = getWordCloud();
  res.json({ success: true, data });
});

export default router;
