import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getDb, saveDb } from '../database/init.js';
import { authMiddleware } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG_DIR = path.join(__dirname, '../../data/img');

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post('/:id', authMiddleware, upload.single('avatar'), (req, res) => {
  const id = Number(req.params.id);
  const file = req.file;
  if (!file) return res.status(400).json({ success: false, message: '请选择图片' });

  const db = getDb();
  const stmt = db.prepare('SELECT chinese_name, name, image_url FROM celebrities WHERE id = ?');
  stmt.bind([id]);
  if (!stmt.step()) return res.status(404).json({ success: false, message: '未找到该名人' });
  const celeb = stmt.getAsObject();
  stmt.free();

  // 以中文名或英文名作为文件名
  const baseName = (celeb.chinese_name || celeb.name).replace(/[<>:"/\\|?*]/g, '_');
  const ext = path.extname(file.originalname) || '.png';
  const fileName = baseName + ext;

  // 备份旧图片
  if (celeb.image_url) {
    const oldPath = path.join(IMG_DIR, celeb.image_url);
    if (fs.existsSync(oldPath)) {
      const now = new Date();
      const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
      const oldExt = path.extname(celeb.image_url);
      const oldBase = path.basename(celeb.image_url, oldExt);
      const backupName = `${oldBase}_备份_${ts}${oldExt}`;
      fs.renameSync(oldPath, path.join(IMG_DIR, backupName));
    }
  }

  // 写入新图片
  if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });
  fs.writeFileSync(path.join(IMG_DIR, fileName), file.buffer);

  // 更新数据库
  db.run('UPDATE celebrities SET image_url = ?, updated_at = datetime("now") WHERE id = ?', [fileName, id]);
  saveDb();

  res.json({ success: true, data: { image_url: fileName } });
});

export default router;
