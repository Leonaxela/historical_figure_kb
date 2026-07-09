import { getDb } from '../database/init.js';

/**
 * 获取完整关系图谱数据（所有节点和边）
 * @param {Object} options
 * @param {number} options.centerId - 中心节点 ID，围绕该节点展开
 * @param {number} options.depth - 展开深度（1 = 仅直接关系，2 = 关系的关系）
 * @param {string} options.category - 关系分类筛选
 * @param {number} options.limit - 最大节点数
 */
export function getGraphData({ centerId, depth = 1, category, limit = 200 } = {}) {
  const db = getDb();

  if (centerId) {
    return getEgoGraph(Number(centerId), Number(depth), category, Number(limit));
  }
  return getFullGraph(category, Number(limit));
}

/**
 * 全量图（适合数据量较小时）
 */
function getFullGraph(category, limit) {
  const db = getDb();

  const typeParam = category ? [category] : [];

  // 获取所有关系（限制数量）
  const edgeSql = `
    SELECT r.id, r.source_id, r.target_id, r.description,
      rt.name as type_name, rt.direction as type_direction, rt.color as type_color, rt.category as type_category
    FROM relationships r
    JOIN relation_types rt ON r.type_id = rt.id
    ${category ? 'WHERE rt.category = ?' : ''}
    LIMIT ?
  `;
  const edgeStmt = db.prepare(edgeSql);
  edgeStmt.bind([...typeParam, limit]);
  const edges = [];
  while (edgeStmt.step()) {
    edges.push(edgeStmt.getAsObject());
  }
  edgeStmt.free();

  // 收集涉及的节点 ID
  const nodeIds = new Set();
  for (const e of edges) {
    nodeIds.add(e.source_id);
    nodeIds.add(e.target_id);
  }

  if (nodeIds.size === 0) return { nodes: [], edges: [] };

  // 查询节点信息
  const ids = [...nodeIds];
  const placeholders = ids.map(() => '?').join(',');
  const nodeSql = `SELECT id, name, chinese_name, nationality, occupation, image_url, biography FROM celebrities WHERE id IN (${placeholders})`;
  const nodeStmt = db.prepare(nodeSql);
  nodeStmt.bind(ids);
  const nodes = [];
  while (nodeStmt.step()) {
    nodes.push(nodeStmt.getAsObject());
  }
  nodeStmt.free();

  return { nodes, edges };
}

/**
 * 自我中心图（围绕一个名人展开）
 */
function getEgoGraph(centerId, depth, category, limit) {
  const db = getDb();

  const extraParams = category ? [category] : [];

  // 查询中心节点
  const centerStmt = db.prepare('SELECT id, name, chinese_name, nationality, occupation, image_url, biography FROM celebrities WHERE id = ?');
  centerStmt.bind([centerId]);
  let centerNode = null;
  if (centerStmt.step()) {
    centerNode = centerStmt.getAsObject();
  }
  centerStmt.free();
  if (!centerNode) return { nodes: [], edges: [] };

  const visited = new Set([centerId]);
  const nodes = [centerNode];
  const edges = [];
  const edgeSet = new Set();
  let currentLevel = [centerId];

  for (let d = 0; d < depth && currentLevel.length > 0 && nodes.length < limit; d++) {
    const nextLevel = [];
    const ids = currentLevel;

    for (const cid of ids) {
      // 查询该节点的所有关系
      const relSql = `
        SELECT r.id, r.source_id, r.target_id, r.description,
          rt.name as type_name, rt.direction as type_direction, rt.color as type_color, rt.category as type_category
        FROM relationships r
        JOIN relation_types rt ON r.type_id = rt.id
        WHERE (r.source_id = ? OR r.target_id = ?)
          AND (rt.direction != 'from' OR r.source_id = ?)
        ${category ? 'AND rt.category = ?' : ''}
        LIMIT ?
      `;
      const params = [cid, cid, cid, ...extraParams, limit];
      const relStmt = db.prepare(relSql);
      relStmt.bind(params);
      while (relStmt.step()) {
        const edge = relStmt.getAsObject();
        const edgeKey = `${Math.min(edge.source_id, edge.target_id)}-${Math.max(edge.source_id, edge.target_id)}-${edge.type_name}`;
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          edges.push(edge);
        }

        // 收集邻居节点
        const neighborId = edge.source_id == cid ? Number(edge.target_id) : Number(edge.source_id);
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          nextLevel.push(neighborId);
        }
      }
      relStmt.free();
    }

    // 批量查询新节点的信息
    if (nextLevel.length > 0 && nodes.length < limit) {
      const chunk = nextLevel.slice(0, limit - nodes.length);
      const placeholders = chunk.map(() => '?').join(',');
      const nodeSql = `SELECT id, name, chinese_name, nationality, occupation, image_url, biography FROM celebrities WHERE id IN (${placeholders})`;
      const nodeStmt = db.prepare(nodeSql);
      nodeStmt.bind(chunk);
      while (nodeStmt.step()) {
        nodes.push(nodeStmt.getAsObject());
      }
      nodeStmt.free();
    }

    currentLevel = nextLevel;
  }

  return { nodes, edges };
}

/**
 * 查询两个名人之间的路径
 */
export function findPath(sourceId, targetId, maxDepth = 6) {
  const db = getDb();

  // 使用 BFS 在内存中搜索路径
  const sql = 'SELECT source_id, target_id FROM relationships';
  const stmt = db.prepare(sql);
  const adjList = new Map();
  while (stmt.step()) {
    const row = stmt.getAsObject();
    const s = Number(row.source_id);
    const t = Number(row.target_id);
    if (!adjList.has(s)) adjList.set(s, new Set());
    if (!adjList.has(t)) adjList.set(t, new Set());
    adjList.get(s).add(t);
    adjList.get(t).add(s);
  }
  stmt.free();

  // BFS 找路径
  const queue = [[sourceId]];
  const visited = new Set([sourceId]);

  while (queue.length > 0) {
    const path = queue.shift();
    const node = path[path.length - 1];

    if (node === targetId) {
      // 获取路径上所有节点的信息
      const placeholders = path.map(() => '?').join(',');
      const nodeSql = `SELECT id, name, chinese_name FROM celebrities WHERE id IN (${placeholders})`;
      const nodeStmt = db.prepare(nodeSql);
      nodeStmt.bind(path);
      const nodes = [];
      while (nodeStmt.step()) {
        nodes.push(nodeStmt.getAsObject());
      }
      nodeStmt.free();

      // 获取路径上所有关系
      const edgeSql = `
        SELECT DISTINCT r.source_id, r.target_id, rt.name as type_name, rt.direction as type_direction, rt.color as type_color
        FROM relationships r
        JOIN relation_types rt ON r.type_id = rt.id
        WHERE (r.source_id IN (${placeholders}) AND r.target_id IN (${placeholders}))
      `;
      const edgeParams = [...path, ...path];
      const edgeStmt = db.prepare(edgeSql);
      edgeStmt.bind(edgeParams);
      const edges = [];
      while (edgeStmt.step()) {
        const e = edgeStmt.getAsObject();
        // 只保留路径上连续的关系
        for (let i = 0; i < path.length - 1; i++) {
          const a = path[i];
          const b = path[i + 1];
          if ((Number(e.source_id) === a && Number(e.target_id) === b) ||
              (Number(e.source_id) === b && Number(e.target_id) === a)) {
            edges.push(e);
            break;
          }
        }
      }
      edgeStmt.free();

      return { path: nodes, edges, length: path.length - 1 };
    }

    if (path.length - 1 >= maxDepth) continue;

    const neighbors = adjList.get(node);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }
  }

  return null; // 未找到路径
}

/**
 * 统计分析
 */
export function getStats() {
  const db = getDb();

  const celebrityCount = db.exec('SELECT COUNT(*) as count FROM celebrities')[0].values[0][0];
  const relationshipCount = db.exec('SELECT COUNT(*) as count FROM relationships')[0].values[0][0];
  const typeCount = db.exec('SELECT COUNT(*) as count FROM relation_types')[0].values[0][0];

  // 连接最多的名人（按关系数排序，使用和列表一致的去重逻辑）
  const topConnected = db.exec(`
    SELECT c.id, c.name, c.chinese_name,
      (SELECT COUNT(*) FROM (
        SELECT 1 FROM relationships r2
        JOIN relation_types rt ON r2.type_id = rt.id
        WHERE (r2.source_id = c.id OR r2.target_id = c.id)
          AND (rt.direction != 'from' OR r2.source_id = c.id)
        GROUP BY
          CASE WHEN r2.source_id < r2.target_id THEN r2.source_id ELSE r2.target_id END,
          CASE WHEN r2.source_id < r2.target_id THEN r2.target_id ELSE r2.source_id END,
          r2.type_id
      )) as conn_count
    FROM celebrities c
    ORDER BY conn_count DESC
    LIMIT 10
  `);

  // 关系类型分布
  const typeDistribution = db.exec(`
    SELECT rt.name, rt.category, rt.color, COUNT(*) as count
    FROM relationships r
    JOIN relation_types rt ON r.type_id = rt.id
    GROUP BY rt.id, rt.name
    ORDER BY count DESC
  `);

  // 国籍分布（含朝代子分类如 中国_秦）
  const nationalityDist = db.exec(`
    SELECT nationality, COUNT(*) as count
    FROM celebrities
    WHERE nationality IS NOT NULL AND nationality != ''
    GROUP BY nationality
    ORDER BY count DESC
  `);

  return {
    celebrityCount,
    relationshipCount,
    typeCount,
    topConnected: topConnected[0]?.values?.map(v => ({ id: v[0], name: v[1], chinese_name: v[2], conn_count: v[3] })) ?? [],
    typeDistribution: typeDistribution[0]?.values?.map(v => ({ name: v[0], category: v[1], color: v[2], count: v[3] })) ?? [],
    nationalityDistribution: nationalityDist[0]?.values?.map(v => ({ name: v[0], count: v[1] })) ?? [],
  };
}
