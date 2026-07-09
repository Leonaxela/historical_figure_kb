/**
 * 示例数据种子 — 中外名人关系网络
 * 包含跨领域、跨文化的关系连接
 */
import { getDb, queryAll, queryOne } from '../database/index.js';

const CELEBRITIES = [
  // ---- 物理学 ----
  { name: 'Albert Einstein', chinese_name: '阿尔伯特·爱因斯坦', birth_date: '1879-03-14', death_date: '1955-04-18', nationality: '德国/美国', occupation: '物理学家', wikidata_id: 'Q937', bio: '20世纪最伟大的物理学家之一，提出相对论，开创现代物理学。' },
  { name: 'Niels Bohr', chinese_name: '尼尔斯·玻尔', birth_date: '1885-10-07', death_date: '1962-11-18', nationality: '丹麦', occupation: '物理学家', wikidata_id: 'Q7085', bio: '量子力学奠基人之一，哥本哈根学派领袖。' },
  { name: 'Marie Curie', chinese_name: '玛丽·居里', birth_date: '1867-11-07', death_date: '1934-07-04', nationality: '波兰/法国', occupation: '物理学家,化学家', wikidata_id: 'Q7186', bio: '两次获得诺贝尔奖，放射性研究先驱。' },
  { name: 'Pierre Curie', chinese_name: '皮埃尔·居里', birth_date: '1859-05-15', death_date: '1906-04-19', nationality: '法国', occupation: '物理学家', wikidata_id: 'Q66971', bio: '居里夫人的丈夫与合作者，放射性研究先驱。' },
  { name: 'Richard Feynman', chinese_name: '理查德·费曼', birth_date: '1918-05-11', death_date: '1988-02-15', nationality: '美国', occupation: '物理学家', wikidata_id: 'Q39246', bio: '量子电动力学奠基人，伟大的物理学教育家。' },

  // ---- 中国科学家 ----
  { name: 'Qian Xuesen', chinese_name: '钱学森', birth_date: '1911-12-11', death_date: '2009-10-31', nationality: '中国', occupation: '科学家,火箭专家', wikidata_id: 'Q703920', bio: '中国航天之父，两弹一星元勋。' },
  { name: 'Yang Zhenning', chinese_name: '杨振宁', birth_date: '1922-10-01', nationality: '中国/美国', occupation: '物理学家', wikidata_id: 'Q180643', bio: '诺贝尔物理学奖得主，规范场论奠基人。' },
  { name: 'Deng Jiaxian', chinese_name: '邓稼先', birth_date: '1924-06-25', death_date: '1986-07-29', nationality: '中国', occupation: '物理学家', wikidata_id: 'Q696882', bio: '中国核武器研制奠基人，"两弹元勋"。' },
  { name: 'Tsung-Dao Lee', chinese_name: '李政道', birth_date: '1926-11-24', death_date: '2024-08-04', nationality: '中国/美国', occupation: '物理学家', wikidata_id: 'Q181693', bio: '诺贝尔物理学奖得主，与杨振宁共同发现宇称不守恒。' },

  // ---- 文学 ----
  { name: 'Lu Xun', chinese_name: '鲁迅', birth_date: '1881-09-25', death_date: '1936-10-19', nationality: '中国', occupation: '作家,思想家', wikidata_id: 'Q23114', bio: '中国现代文学奠基人，思想家、革命家。' },
  { name: 'Lao She', chinese_name: '老舍', birth_date: '1899-02-03', death_date: '1966-08-24', nationality: '中国', occupation: '作家', wikidata_id: 'Q361272', bio: '中国现代小说家、戏剧家，代表作《茶馆》《骆驼祥子》。' },
  { name: 'Ba Jin', chinese_name: '巴金', birth_date: '1904-11-25', death_date: '2005-10-17', nationality: '中国', occupation: '作家', wikidata_id: 'Q333061', bio: '中国现代文学巨匠，代表作《家》《春》《秋》。' },
  { name: 'William Shakespeare', chinese_name: '威廉·莎士比亚', birth_date: '1564-04-26', death_date: '1616-04-23', nationality: '英国', occupation: '剧作家,诗人', wikidata_id: 'Q692', bio: '英国文学史上最伟大的剧作家和诗人。' },
  { name: 'Ernest Hemingway', chinese_name: '欧内斯特·海明威', birth_date: '1899-07-21', death_date: '1961-07-02', nationality: '美国', occupation: '作家', wikidata_id: 'Q5683', bio: '美国"迷惘的一代"代表作家，诺贝尔文学奖得主。' },

  // ---- 艺术 ----
  { name: 'Pablo Picasso', chinese_name: '巴勃罗·毕加索', birth_date: '1881-10-25', death_date: '1973-04-08', nationality: '西班牙', occupation: '画家,雕塑家', wikidata_id: 'Q5593', bio: '现代艺术创始人之一，立体主义代表。' },
  { name: 'Vincent van Gogh', chinese_name: '文森特·梵高', birth_date: '1853-03-30', death_date: '1890-07-29', nationality: '荷兰', occupation: '画家', wikidata_id: 'Q5582', bio: '后印象派代表人物，对20世纪艺术影响深远。' },
  { name: 'Leonardo da Vinci', chinese_name: '列奥纳多·达·芬奇', birth_date: '1452-04-15', death_date: '1519-05-02', nationality: '意大利', occupation: '画家,发明家,科学家', wikidata_id: 'Q762', bio: '文艺复兴时期最杰出的天才，跨界巨匠。' },
  { name: 'Zhang Daqian', chinese_name: '张大千', birth_date: '1899-05-10', death_date: '1983-04-02', nationality: '中国', occupation: '画家', wikidata_id: 'Q716663', bio: '中国泼墨画家，被西方艺坛赞为"东方之笔"。' },
  { name: 'Qi Baishi', chinese_name: '齐白石', birth_date: '1864-01-01', death_date: '1957-09-16', nationality: '中国', occupation: '画家', wikidata_id: 'Q1073847', bio: '中国近现代绘画大师，以花鸟虫鱼闻名。' },

  // ---- 音乐 ----
  { name: 'Ludwig van Beethoven', chinese_name: '路德维希·凡·贝多芬', birth_date: '1770-12-17', death_date: '1827-03-26', nationality: '德国', occupation: '作曲家', wikidata_id: 'Q255', bio: '古典主义与浪漫主义过渡时期的音乐巨匠。' },
  { name: 'Wolfgang Amadeus Mozart', chinese_name: '沃尔夫冈·阿马德乌斯·莫扎特', birth_date: '1756-01-27', death_date: '1791-12-05', nationality: '奥地利', occupation: '作曲家', wikidata_id: 'Q254', bio: '古典时期最伟大的音乐天才之一。' },
  { name: 'Franz Schubert', chinese_name: '弗朗茨·舒伯特', birth_date: '1797-01-31', death_date: '1828-11-19', nationality: '奥地利', occupation: '作曲家', wikidata_id: 'Q7312', bio: '浪漫主义早期作曲家，艺术歌曲大师。' },
  { name: 'Xian Xinghai', chinese_name: '冼星海', birth_date: '1905-06-13', death_date: '1945-10-30', nationality: '中国', occupation: '作曲家', wikidata_id: 'Q701280', bio: '中国近代著名作曲家，《黄河大合唱》作者。' },
  { name: 'Nie Er', chinese_name: '聂耳', birth_date: '1912-02-14', death_date: '1935-07-17', nationality: '中国', occupation: '作曲家', wikidata_id: 'Q1386935', bio: '中国国歌《义勇军进行曲》的作曲者。' },
];

const RELATIONSHIPS = [
  { source: 'Albert Einstein', target: 'Niels Bohr', type: '同行', description: '爱因斯坦与玻尔关于量子力学的著名论辩' },
  { source: 'Marie Curie', target: 'Pierre Curie', type: '配偶', description: '居里夫妇，共同研究放射性元素' },
  { source: 'Marie Curie', target: 'Niels Bohr', type: '同行', description: '同为诺贝尔物理学奖得主' },
  { source: 'Richard Feynman', target: 'Albert Einstein', type: '同行', description: '费曼深受爱因斯坦工作的影响' },
  { source: 'Qian Xuesen', target: 'Deng Jiaxian', type: '同僚', description: '共同参与中国"两弹一星"工程' },
  { source: 'Yang Zhenning', target: 'Tsung-Dao Lee', type: '合作', description: '杨振宁与李政道共同提出宇称不守恒，获诺贝尔奖' },
  { source: 'Yang Zhenning', target: 'Deng Jiaxian', type: '校友', description: '杨振宁与邓稼先中学和大学同学' },
  { source: 'Qian Xuesen', target: 'Albert Einstein', type: '同行', description: '钱学森在美期间曾与爱因斯坦有学术交流' },
  { source: 'Lu Xun', target: 'Lao She', type: '同行', description: '鲁迅与老舍同为现代文学巨匠，彼此尊重' },
  { source: 'Lu Xun', target: 'Ba Jin', type: '前后辈', description: '鲁迅对巴金有提携之恩' },
  { source: 'Ba Jin', target: 'Lao She', type: '同行', description: '巴金与老舍同为现代文学重要作家' },
  { source: 'William Shakespeare', target: 'Ernest Hemingway', type: '同行', description: '海明威深受莎士比亚文学传统影响' },
  { source: 'Pablo Picasso', target: 'Vincent van Gogh', type: '同行', description: '毕加索深受梵高艺术风格影响' },
  { source: 'Leonardo da Vinci', target: 'Pablo Picasso', type: '同行', description: '达芬奇对毕加索的创作理念有深远影响' },
  { source: 'Zhang Daqian', target: 'Qi Baishi', type: '同行', description: '张大千与齐白石并称"南张北齐"' },
  { source: 'Pablo Picasso', target: 'Zhang Daqian', type: '同行', description: '毕加索与张大千曾会面交流，互相欣赏' },
  { source: 'Ludwig van Beethoven', target: 'Wolfgang Amadeus Mozart', type: '同行', description: '贝多芬深受莫扎特影响，曾师从莫扎特学习' },
  { source: 'Ludwig van Beethoven', target: 'Franz Schubert', type: '同行', description: '舒伯特是贝多芬的崇拜者，葬于贝多芬墓旁' },
  { source: 'Wolfgang Amadeus Mozart', target: 'Franz Schubert', type: '同行', description: '舒伯特深受莫扎特音乐风格影响' },
  { source: 'Xian Xinghai', target: 'Nie Er', type: '同行', description: '冼星海与聂耳同为近代中国音乐先驱' },
  { source: 'Lu Xun', target: 'Ernest Hemingway', type: '同行', description: '鲁迅与海明威同为世界反法西斯文学代表' },
  { source: 'Qian Xuesen', target: 'Richard Feynman', type: '同行', description: '钱学森与费曼曾在加州理工共事' },
  { source: 'Leonardo da Vinci', target: 'Albert Einstein', type: '同行', description: '达芬奇与爱因斯坦同为跨学科天才代表' },
];

export async function seed() {
  const db = await getDb();

  // 检查是否已有数据
  const existingPeople = queryAll('SELECT COUNT(*) as cnt FROM celebrities');
  if (existingPeople.length > 0 && existingPeople[0].cnt > 0) {
    console.log(`数据库已有 ${existingPeople[0].cnt} 条名人数据，跳过种子。`);
    return;
  }

  // 插入名人
  const celebIds = {};
  for (const c of CELEBRITIES) {
    const vals = [
      c.name, c.chinese_name ?? null, c.birth_date ?? null,
      c.death_date ?? null, c.nationality ?? null,
      c.occupation ?? null, c.wikidata_id ?? null, c.bio ?? null
    ];
    db.run(
      'INSERT INTO celebrities (name, chinese_name, birth_date, death_date, nationality, occupation, wikidata_id, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      vals
    );
    // 获取刚插入的 ID
    const row = queryOne('SELECT last_insert_rowid() as id');
    if (row) celebIds[c.name] = row.id;
  }
  console.log(`✅ 已插入 ${Object.keys(celebIds).length} 位名人`);

  // 插入关系
  let relCount = 0;
  for (const r of RELATIONSHIPS) {
    const sourceId = celebIds[r.source];
    const targetId = celebIds[r.target];
    if (!sourceId || !targetId) {
      console.warn(`⚠️ 跳过关系: ${r.source} -> ${r.target}（名人未找到）`);
      continue;
    }
    const typeRow = queryOne('SELECT id FROM relation_types WHERE name = ?', [r.type]);
    if (!typeRow) {
      console.warn(`⚠️ 跳过关系: ${r.type}（关系类型未找到）`);
      continue;
    }
    db.run(
      'INSERT INTO relationships (source_id, target_id, relation_type_id, description) VALUES (?, ?, ?, ?)',
      [sourceId, targetId, typeRow.id, r.description]
    );
    relCount++;
  }

  // 持久化到文件
  const { persistDb } = await import('../database/index.js');
  persistDb();

  console.log(`✅ 已插入 ${relCount} 条关系`);
  console.log('🎉 种子数据导入完成！');
}

// 直接运行时执行
seed().catch(err => {
  console.error('种子数据导入失败:', err);
  process.exit(1);
});
