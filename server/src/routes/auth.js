import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { getDb } from '../database/init.js';

const JWT_SECRET = 'celebrity-graph-jwt-secret-2026';
const router = Router();

// POST /api/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '请输入用户名和密码' });
  }

  const db = getDb();
  const stmt = db.prepare('SELECT id, username, password_hash FROM users WHERE username = ?');
  stmt.bind([username]);
  if (!stmt.step()) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
  const user = stmt.getAsObject();
  stmt.free();

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, data: { token, username: user.username } });
});

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未登录' });
  }
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: '登录已过期' });
  }
}

router.get('/me', authMiddleware, (req, res) => {
  res.json({ success: true, data: { username: req.user.username } });
});

export default router;
