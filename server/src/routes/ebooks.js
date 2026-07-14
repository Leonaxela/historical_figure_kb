import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getEbooks } from '../services/ebookService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EBOOK_DIR = path.join(__dirname, '../../data/ebook');

const router = Router();

router.get('/', (req, res) => {
  res.json({ success: true, data: getEbooks() });
});

// 提供 EPUB 文件（用 query 传文件名，避免中文路径问题）
router.get('/file', (req, res) => {
  const filename = req.query.name;
  if (!filename) return res.status(400).json({ success: false, message: '缺少 name 参数' });
  const safeName = path.basename(filename);
  const filePath = path.join(EBOOK_DIR, safeName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: '文件不存在' });
  res.set('Content-Type', 'application/epub+zip');
  res.sendFile(filePath);
});

export default router;
