import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// 名人相关
export const celebrityApi = {
  list(params) { return api.get('/celebrities', { params }).then(r => r.data) },
  get(id) { return api.get(`/celebrities/${id}`).then(r => r.data) },
  create(data) { return api.post('/celebrities', data).then(r => r.data) },
  update(id, data) { return api.put(`/celebrities/${id}`, data).then(r => r.data) },
  remove(id) { return api.delete(`/celebrities/${id}`).then(r => r.data) },
  bulk(celebrities) { return api.post('/celebrities/bulk', { celebrities }).then(r => r.data) },
  nationalities() { return api.get('/celebrities/nationalities').then(r => r.data) },
  occupations() { return api.get('/celebrities/occupations').then(r => r.data) },
}

// 关系相关
export const relationApi = {
  list(params) { return api.get('/relationships', { params }).then(r => r.data) },
  create(data) { return api.post('/relationships', data).then(r => r.data) },
  remove(id) { return api.delete(`/relationships/${id}`).then(r => r.data) },
  types() { return api.get('/relationships/types').then(r => r.data) },
  createType(data) { return api.post('/relationships/types', data).then(r => r.data) },
  updateType(id, data) { return api.put(`/relationships/types/${id}`, data).then(r => r.data) },
  removeType(id) { return api.delete(`/relationships/types/${id}`).then(r => r.data) },
}

// 图谱相关
export const graphApi = {
  get(params) { return api.get('/graph', { params }).then(r => r.data) },
  path(sourceId, targetId, maxDepth) { return api.get('/graph/path', { params: { sourceId, targetId, maxDepth } }).then(r => r.data) },
  stats() { return api.get('/graph/stats').then(r => r.data) },
  wordcloud() { return api.get('/graph/wordcloud').then(r => r.data) },
}

// 内容相关
export const contentApi = {
  get(id) { return api.get(`/celebrities/${id}/contents`).then(r => r.data) },
  save(id, data) { return api.put(`/celebrities/${id}/contents`, data).then(r => r.data) },
  timeline(id) { return api.get(`/celebrities/${id}/timeline`).then(r => r.data) },
  addTimeline(id, data) { return api.post(`/celebrities/${id}/timeline`, data).then(r => r.data) },
  updateTimeline(id, data) { return api.put(`/celebrities/timeline/${id}`, data).then(r => r.data) },
  deleteTimeline(id) { return api.delete(`/celebrities/timeline/${id}`).then(r => r.data) },
}

// 健康检查
export const healthApi = {
  check() { return api.get('/health').then(r => r.data) },
}

export default api
