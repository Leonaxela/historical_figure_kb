import { defineStore } from 'pinia'
import { celebrityApi, relationApi, graphApi } from '../api/index.js'

export const useCelebrityStore = defineStore('celebrities', {
  state: () => ({
    list: [],
    total: 0,
    page: 1,
    pageSize: 24,
    search: '',
    nationality: '',
    occupation: '',
    loading: false,
    current: null,
    nationalities: [],
    occupations: [],
    stats: null,
  }),

  actions: {
    async fetchList() {
      this.loading = true
      try {
        const res = await celebrityApi.list({
          page: this.page, pageSize: this.pageSize,
          search: this.search || undefined,
          nationality: this.nationality || undefined,
          occupation: this.occupation || undefined,
        })
        this.list = res.data
        this.total = res.total
      } finally {
        this.loading = false
      }
    },

    async fetchDetail(id) {
      const res = await celebrityApi.get(id)
      this.current = res.data
      return res.data
    },

    async fetchFilters() {
      const [nat, occ] = await Promise.all([
        celebrityApi.nationalities(),
        celebrityApi.occupations(),
      ])
      this.nationalities = nat.data || []
      this.occupations = occ.data || []
    },

    async fetchStats() {
      const res = await graphApi.stats()
      this.stats = res.data
    },

    setPage(page) {
      this.page = page
      this.fetchList()
    },

    setSearch(search) {
      this.search = search
      this.page = 1
      this.fetchList()
    },

    setFilter(key, value) {
      this[key] = value
      this.page = 1
      this.fetchList()
    },
  },
})
