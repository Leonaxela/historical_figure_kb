import { defineStore } from 'pinia'
import { getCelebrities, getFullGraph, getRelationTypes } from '@/api/index.js'

export const useAppStore = defineStore('app', {
  state: () => ({
    // 名人列表
    celebrities: [],
    totalCelebrities: 0,
    currentPage: 1,
    pageSize: 20,
    searchKeyword: '',
    filterOccupation: '',
    filterNationality: '',
    loading: false,

    // 图谱数据
    graphData: { nodes: [], edges: [] },
    graphLoading: false,

    // 关系类型
    relationTypes: [],
    relationTypesGrouped: {},

    // 侧边栏
    sidebarCollapsed: false,

    // 站内统计
    stats: {
      celebrityCount: 0,
      relationshipCount: 0,
      relationTypeCount: 0
    }
  }),

  getters: {
    filteredCelebrities: (state) => state.celebrities,
    totalPages: (state) => Math.ceil(state.totalCelebrities / state.pageSize),
  },

  actions: {
    async fetchCelebrities(params = {}) {
      this.loading = true
      try {
        const query = {
          page: params.page || this.currentPage,
          pageSize: params.pageSize || this.pageSize,
          keyword: params.keyword !== undefined ? params.keyword : this.searchKeyword,
          occupation: params.occupation !== undefined ? params.occupation : this.filterOccupation,
          nationality: params.nationality !== undefined ? params.nationality : this.filterNationality
        }
        const res = await getCelebrities(query)
        this.celebrities = res.data.data
        this.totalCelebrities = res.data.total
        this.currentPage = query.page
      } catch (err) {
        console.error('获取名人列表失败:', err)
      } finally {
        this.loading = false
      }
    },

    async fetchGraphData() {
      this.graphLoading = true
      try {
        const res = await getFullGraph()
        this.graphData = res.data.data
      } catch (err) {
        console.error('获取图谱数据失败:', err)
      } finally {
        this.graphLoading = false
      }
    },

    async fetchRelationTypes() {
      try {
        const res = await getRelationTypes()
        this.relationTypes = res.data.data
        this.relationTypesGrouped = {}
        for (const t of this.relationTypes) {
          const cat = t.category || '其他'
          if (!this.relationTypesGrouped[cat]) this.relationTypesGrouped[cat] = []
          this.relationTypesGrouped[cat].push(t)
        }
      } catch (err) {
        console.error('获取关系类型失败:', err)
      }
    },

    async fetchRelationTypesGrouped() {
      try {
        const res = await getRelationTypes()
        this.relationTypes = res.data.data
        this.relationTypesGrouped = {}
        for (const t of this.relationTypes) {
          const cat = t.category || '其他'
          if (!this.relationTypesGrouped[cat]) this.relationTypesGrouped[cat] = []
          this.relationTypesGrouped[cat].push(t)
        }
      } catch (err) {
        console.error('获取关系类型失败:', err)
      }
    },

    setSearch(keyword) {
      this.searchKeyword = keyword
      this.currentPage = 1
      this.fetchCelebrities({ keyword })
    },

    setPage(page) {
      this.currentPage = page
      this.fetchCelebrities()
    },

    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    }
  }
})
