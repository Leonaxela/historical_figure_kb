import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initSchema, getDb } from './database/init.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import celebritiesRouter from './routes/celebrities.js';
import relationshipsRouter from './routes/relationships.js';
import worksRouter from './routes/works.js';
import graphRouter from './routes/graph.js';
import uploadRouter from './routes/upload.js';
import tagsRouter from './routes/tags.js';
import poemsRouter from './routes/poems.js';
import notesRouter from './routes/notes.js';
import ebooksRouter from './routes/ebooks.js';
import authRouter, { authMiddleware } from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
// 静态文件 — 人物图片
app.use('/img', express.static(path.join(__dirname, '../data/img')));
// 静态文件 — 电子书封面
app.use('/ebook-cover', express.static(path.join(__dirname, '../data/ebook/.covers')));

// API 路由
app.use('/api/celebrities', celebritiesRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/relationships', relationshipsRouter);
app.use('/api/graph', graphRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/works', worksRouter);
app.use('/api/poems', poemsRouter);
app.use('/api/notes', notesRouter);
app.use('/api/ebooks', ebooksRouter);
app.use('/api', authRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '名人关系图谱服务运行中', version: '1.0.0' });
});

// 启动
async function start() {
  await initSchema();
  const db = getDb();

  // 统计信息
  const celebRow = db.exec("SELECT COUNT(*) FROM celebrities");
  const relRow = db.exec("SELECT COUNT(*) FROM relationships");

  const celebCnt = celebRow[0]?.values[0]?.[0] ?? '?';
  const relCnt = relRow[0]?.values[0]?.[0] ?? '?';

  app.listen(PORT, () => {
    console.log('');
    console.log(' ╔═══════════════════════════════════════╗');
    console.log(' ║      🌏 名人关系图谱服务              ║');
    console.log(' ╠═══════════════════════════════════════╣');
    console.log(` ║  🚀 服务已启动: http://localhost:${PORT} ║`);
    console.log(`    📊 名人 ${celebCnt} 位 | 关系 ${relCnt} 条`);
    console.log(' ╚═══════════════════════════════════════╝');
    console.log('');
  });
}

start().catch(console.error);
