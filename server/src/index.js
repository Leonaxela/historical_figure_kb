import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initSchema } from './database/init.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import celebritiesRouter from './routes/celebrities.js';
import relationshipsRouter from './routes/relationships.js';
import graphRouter from './routes/graph.js';
import uploadRouter from './routes/upload.js';
import authRouter, { authMiddleware } from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
// 静态文件 — 人物图片
app.use('/img', express.static(path.join(__dirname, '../data/img')));

// API 路由
app.use('/api/celebrities', celebritiesRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/relationships', relationshipsRouter);
app.use('/api/graph', graphRouter);
app.use('/api', authRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '名人关系图谱服务运行中', version: '1.0.0' });
});

// 启动
async function start() {
  await initSchema();
  app.listen(PORT, () => {
    console.log(`🚀 服务已启动: http://localhost:${PORT}`);
  });
}

start().catch(console.error);
