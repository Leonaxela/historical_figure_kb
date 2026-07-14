import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseEpub } from './epubParser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EBOOK_DIR = path.join(__dirname, '../../data/ebook');
const COVER_DIR = path.join(EBOOK_DIR, '.covers');

if (!fs.existsSync(COVER_DIR)) fs.mkdirSync(COVER_DIR, { recursive: true });

function sanitize(name) {
  return name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').slice(0, 100);
}

export function getEbooks() {
  if (!fs.existsSync(EBOOK_DIR)) return [];
  const files = fs.readdirSync(EBOOK_DIR).filter(f => f.toLowerCase().endsWith('.epub'));
  return files.map(f => {
    const filePath = path.join(EBOOK_DIR, f);
    const baseName = f.replace(/\.epub$/i, '');
    let title = baseName;
    let author = '';
    let coverFileName = '';

    const cacheMeta = path.join(COVER_DIR, sanitize(baseName) + '.json');
    let fromCache = false;

    // 尝试从缓存读取元数据
    if (fs.existsSync(cacheMeta)) {
      try {
        const cached = JSON.parse(fs.readFileSync(cacheMeta, 'utf-8'));
        title = cached.title || title;
        author = cached.author || '';
        coverFileName = cached.coverFileName || '';
        fromCache = true;
      } catch { /* ignore */ }
    }

    if (!fromCache) {
      try {
        const result = parseEpub(filePath);
        if (result) {
          title = result.title || title;
          author = result.creator || '';

          // 保存封面
          if (result.coverData) {
            const ext = result.coverMime === 'image/png' ? '.png' : '.jpg';
            coverFileName = sanitize(baseName) + ext;
            const coverPath = path.join(COVER_DIR, coverFileName);
            if (!fs.existsSync(coverPath)) {
              fs.writeFileSync(coverPath, result.coverData);
            }
          }
        }

        // 写入缓存
        fs.writeFileSync(cacheMeta, JSON.stringify({ title, author, coverFileName }), 'utf-8');
      } catch (err) {
        // 解析失败，使用文件名
      }
    }

    return {
      filename: f,
      title: title || f.replace(/\.epub$/i, ''),
      author,
      coverFileName: coverFileName || null,
    };
  }).sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
}
