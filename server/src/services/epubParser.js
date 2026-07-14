import AdmZip from 'adm-zip';

export function parseEpub(filePath) {
  const zip = new AdmZip(filePath);
  const container = zip.readAsText('META-INF/container.xml');
  const opfMatch = container.match(/full-path=["']([^"']+)/);
  if (!opfMatch) return null;
  const opfPath = opfMatch[1];
  const opfXml = zip.readAsText(opfPath);

  // 用正则提取元数据（避免 XML 命名空间问题）
  const title = extractTag(opfXml, 'dc:title') || extractTag(opfXml, 'title');
  const creator = extractTag(opfXml, 'dc:creator') || extractTag(opfXml, 'creator');

  // 找封面 ID
  const coverMetaMatch = opfXml.match(/<meta\s+[^>]*name=["']cover["'][^>]*content=["']([^"']+)/i);
  const coverId = coverMetaMatch ? coverMetaMatch[1] : null;

  // 通过 ID 找封面文件
  let coverHref = null;
  if (coverId) {
    const idMatch = opfXml.match(new RegExp(
      `<item\\s+[^>]*id=["']${escapeRegex(coverId)}["'][^>]*href=["']([^"']+)`, 'i'
    ));
    if (idMatch) {
      coverHref = idMatch[1];
    } else {
      // 有些 EPUB 直接用 coverImage id
      const imgMatch = opfXml.match(/<item\s+[^>]*id=["']coverImage["'][^>]*href=["']([^"']+)/i);
      if (imgMatch) coverHref = imgMatch[1];
    }
  } else {
    // 没有 meta cover，尝试常用 ID
    const altMatch = opfXml.match(/<item\s+[^>]*id=["'](?:cover|coverImage|cover-img)["'][^>]*href=["']([^"']+)/i);
    if (altMatch) coverHref = altMatch[1];
  }

  // 读取封面文件
  let coverData = null;
  let coverMime = null;
  if (coverHref) {
    const baseDir = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);
    const fullPath = baseDir + coverHref;
    try {
      const entry = zip.getEntry(fullPath);
      if (entry) {
        coverData = entry.getData();
        coverMime = coverHref.endsWith('.png') ? 'image/png' : 'image/jpeg';
      }
    } catch { /* ignore */ }
  }

  return { title, creator, coverData, coverMime };
}

function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${escapeRegex(tag)}[^>]*>([^<]+)</${escapeRegex(tag)}>`, 'i'));
  return match ? match[1].trim() : null;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
